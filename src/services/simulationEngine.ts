import { RawCall } from '../types';

export interface SimulationState {
  currentTime: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_SIMULATION: SimulationState = {
  currentTime: '2026-08-13T07:00',
  locationName: '연세대학교 신촌캠퍼스',
  latitude: 37.565784,
  longitude: 126.938572,
};

export const HOME_COORDINATES = { latitude: 37.6467, longitude: 127.0718 };

/**
 * 처음 접속했을 때의 기사 위치를 무작위로 정한다.
 * 방금 손님을 내려준 지점에서 하루를 이어간다는 설정이라, 콜 데이터의 승차 지점을 그대로 쓴다.
 * 접속할 때마다 주변 콜 구성이 달라져 같은 화면이 반복되지 않는다.
 */
export function randomStartSimulation(calls: RawCall[]): SimulationState {
  const bucket = simulationTimeBucket(DEFAULT_SIMULATION.currentTime);
  const spots = calls.filter((call) => call.timeBucket === bucket);
  if (!spots.length) return DEFAULT_SIMULATION;

  const spot = spots[Math.floor(Math.random() * spots.length)];
  // 승차 지점 위에 정확히 세워두면 픽업 0km 콜만 이겨서 추천이 고정된다.
  // 실제로도 기사는 그 근처 어딘가에 있으므로 1~2km 정도 흩뜨린다.
  const bearing = Math.random() * Math.PI * 2;
  const offsetKm = 1 + Math.random();
  return {
    ...DEFAULT_SIMULATION,
    locationName: `${spot.originTitle} 인근`,
    latitude: spot.originLat + (offsetKm / 111) * Math.cos(bearing),
    longitude: spot.originLng + (offsetKm / 88) * Math.sin(bearing),
  };
}

const toRadians = (degrees: number) => degrees * Math.PI / 180;
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

export function straightDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(toLat - fromLat);
  const longitudeDelta = toRadians(toLng - fromLng);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimatedRoadDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  return round(Math.max(0.2, straightDistanceKm(fromLat, fromLng, toLat, toLng) * 1.24));
}

export function simulationTimeBucket(value: string) {
  const hour = Number(value.slice(11, 13));
  if (hour < 5) return '새벽';
  if (hour < 10) return '출근';
  if (hour < 17) return '주간';
  if (hour < 21) return '퇴근';
  return '심야';
}

export function addSimulationMinutes(value: string, minutes: number) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

function hashId(id: string) {
  return [...id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

/** 시드 기반 난수 — 같은 시드면 같은 콜 목록이 나온다 */
function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** 가까운 콜일수록 자주 잡히도록 가중치를 준다 */
const CANDIDATE_RADIUS = 240;
/** 한 승차 지점이 목록을 독점하지 않도록 제한한다 */
const MAX_PER_ORIGIN = 4;

export function buildSimulationCallPool(
  calls: RawCall[],
  simulation: SimulationState,
  unavailableCallIds: string[],
  limit = 72,
  seed = 0,
) {
  const unavailable = new Set(unavailableCallIds);
  const bucket = simulationTimeBucket(simulation.currentTime);
  const nearby = calls
    .filter((call) => call.timeBucket === bucket && !unavailable.has(call.id))
    .map((call) => {
      const pickupDistanceKm = estimatedRoadDistanceKm(
        simulation.latitude,
        simulation.longitude,
        call.originLat,
        call.originLng,
      );
      return {
        ...call,
        pickupDistanceKm,
        pickupDurationMin: Math.max(2, Math.round(pickupDistanceKm * 2.5)),
        requestedAt: simulation.currentTime,
      };
    })
    .sort((a, b) => a.pickupDistanceKm - b.pickupDistanceKm || hashId(a.id) - hashId(b.id));

  // 시드가 없으면 예전처럼 가장 가까운 순서 그대로 (시연 재현용)
  if (!seed) return nearby.slice(0, limit);

  // 실제 배차처럼, 권역 안의 콜 중 일부만 그때그때 떠 있게 만든다.
  // 가까울수록 뽑힐 확률이 높지만 매번 같은 조합이 나오지는 않는다.
  const random = seededRandom(seed);
  const ranked = nearby
    .slice(0, CANDIDATE_RADIUS)
    .map((call) => {
      const weight = 1 / Math.pow(1 + call.pickupDistanceKm, 1.5);
      return { call, key: Math.pow(random(), 1 / weight) };
    })
    .sort((a, b) => b.key - a.key);

  // 같은 승차 지점만 잔뜩 뽑히면 추천이 늘 똑같아지므로 지점별 상한을 둔다
  const perOrigin = new Map<string, number>();
  const picked: typeof nearby = [];
  for (const { call } of ranked) {
    if (picked.length >= limit) break;
    const used = perOrigin.get(call.originTitle) ?? 0;
    if (used >= MAX_PER_ORIGIN) continue;
    perOrigin.set(call.originTitle, used + 1);
    picked.push(call);
  }

  return picked.sort((a, b) => a.pickupDistanceKm - b.pickupDistanceKm);
}
