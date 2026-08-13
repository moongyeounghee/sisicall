import calls from '../src/data/calls3000.json';
import { recommendCalls } from '../src/services/recommendationEngine';
import {
  addSimulationMinutes,
  buildSimulationCallPool,
  DEFAULT_SIMULATION,
  simulationTimeBucket,
} from '../src/services/simulationEngine';
import type { DriverPreferences, FeedbackEvent, OperationMode, RawCall } from '../src/types';
import {
  EMPTY_DRIVER_STATS,
  recordCallResponse,
  recordCompletedTrip,
  statsForDate,
} from '../src/services/statsEngine';

const source = calls as RawCall[];
const pool = source
  .filter((call) => call.timeBucket === '출근' && call.pickupDistanceKm <= 8)
  .slice(0, 250);

const preferences: DriverPreferences = {
  currentLocationName: '연세대학교 신촌캠퍼스',
  homeLocationName: '노원구 노원로26길 59',
  baseTime: '07:00',
  desiredEndTime: '09:00',
  batteryLevel: 35,
  safetyReserve: 15,
  maxDrivingMinutes: 120,
  maxShortTripKm: 7,
};

const noFeedback: FeedbackEvent[] = [];
const modes: OperationMode[] = ['normal', 'home', 'long', 'short', 'ev'];
const topByMode = new Map<OperationMode, ReturnType<typeof recommendCalls>[number]>();

for (const mode of modes) {
  const ranked = recommendCalls(pool, mode, preferences, noFeedback);
  const eligible = ranked.filter((call) => call.eligible);
  const top = ranked.find((call) => call.eligible);
  if (!top) throw new Error(`${mode} 모드에 추천 가능한 콜이 없습니다.`);
  if (top.recommendationScore < 0 || top.recommendationScore > 100) {
    throw new Error(`${mode} 모드 점수가 범위를 벗어났습니다: ${top.recommendationScore}`);
  }
  if (top.reasons.length === 0) throw new Error(`${mode} 모드 추천 이유가 없습니다.`);
  if (mode === 'normal' && eligible.length !== pool.length) {
    throw new Error(`일반 모드는 모든 콜을 노출해야 합니다: ${eligible.length}/${pool.length}`);
  }
  if (mode !== 'normal' && (eligible.length === 0 || eligible.length === pool.length)) {
    throw new Error(`${mode} 모드 적합성 판정이 비정상입니다: ${eligible.length}/${pool.length}`);
  }
  if (mode === 'home' && eligible.some((call) => call.homeDirectionSimilarity < 70 || call.homeDistanceChangeKm >= 0 || call.pickupDistanceKm > 7)) {
    throw new Error('귀가 모드의 필수 방향·거리 기준을 통과하지 못한 콜이 추천되었습니다.');
  }
  if (mode === 'long' && eligible.some((call) => call.distanceKm < 20 || call.pickupDistanceKm > 8 || call.returnBurdenScore < 25)) {
    throw new Error('장거리 모드의 필수 거리·복귀 기준을 통과하지 못한 콜이 추천되었습니다.');
  }
  if (mode === 'short' && eligible.some((call) => call.distanceKm > preferences.maxShortTripKm || call.pickupDistanceKm > 5 || call.durationMin > 25)) {
    throw new Error('단거리 모드의 필수 거리·시간 기준을 통과하지 못한 콜이 추천되었습니다.');
  }
  if (mode === 'ev' && eligible.some((call) => call.batteryAfterRidePct < preferences.safetyReserve || call.nearestChargerDistanceKm === null || call.nearestChargerDistanceKm > 2)) {
    throw new Error('전기차 모드의 필수 배터리·충전소 기준을 통과하지 못한 콜이 추천되었습니다.');
  }
  topByMode.set(mode, top);
}

if (new Set([...topByMode.values()].map((call) => call.id)).size < 3) {
  throw new Error('모드별 상위 추천이 충분히 달라지지 않습니다.');
}

const lowBattery = recommendCalls(pool, 'ev', { ...preferences, batteryLevel: 20 }, noFeedback);
const excluded = lowBattery.filter((call) => !call.eligible);
if (excluded.length === 0) throw new Error('저배터리 전기차 안전 제외 콜이 없습니다.');
if (excluded.some((call) => call.warnings.length === 0)) {
  throw new Error('제외 콜 중 경고 이유가 없는 항목이 있습니다.');
}

console.log('추천 로직 검증 완료');
for (const mode of modes) {
  const top = topByMode.get(mode)!;
  console.log(`- ${mode}: ${top.originTitle} → ${top.destTitle}, ${Math.round(top.recommendationScore)}점`);
}
console.log(`- 전기차 20% 안전 제외: ${excluded.length}건 / ${pool.length}건`);

const initialSimulationPool = buildSimulationCallPool(source, DEFAULT_SIMULATION, []);
if (initialSimulationPool.length !== 72) throw new Error('초기 시뮬레이션 콜 풀이 72건이 아닙니다.');
if (initialSimulationPool.some((call) => call.timeBucket !== '출근')) {
  throw new Error('07:00 시뮬레이션에 출근 시간대가 아닌 콜이 포함됐습니다.');
}

const firstRide = initialSimulationPool[0];
const advancedTime = addSimulationMinutes(
  DEFAULT_SIMULATION.currentTime,
  firstRide.pickupDurationMin + firstRide.durationMin,
);
const movedSimulation = {
  currentTime: advancedTime,
  locationName: firstRide.destTitle,
  latitude: firstRide.destLat,
  longitude: firstRide.destLng,
};
const movedPool = buildSimulationCallPool(source, movedSimulation, [firstRide.id]);
if (movedPool.some((call) => call.id === firstRide.id)) throw new Error('완료한 콜이 다시 노출됐습니다.');
if (movedPool.length === 0) throw new Error('위치 이동 후 콜 풀이 갱신되지 않았습니다.');
if (movedPool.some((call) => call.timeBucket !== simulationTimeBucket(advancedTime))) {
  throw new Error('위치 이동 후 가상 시각대에 맞지 않는 콜이 포함됐습니다.');
}
if (movedSimulation.locationName !== firstRide.destTitle) throw new Error('운행 후 기사 위치가 목적지로 변경되지 않았습니다.');

const noonPool = buildSimulationCallPool(source, { ...movedSimulation, currentTime: '2026-08-13T12:30' }, [firstRide.id]);
if (noonPool.length !== 72 || noonPool.some((call) => call.timeBucket !== '주간')) {
  throw new Error('가상 시각 수동 변경 후 시간대별 콜이 갱신되지 않았습니다.');
}

console.log(`- 시뮬레이션 이동: ${DEFAULT_SIMULATION.locationName} → ${movedSimulation.locationName}`);
console.log(`- 가상 시각 진행: ${DEFAULT_SIMULATION.currentTime} → ${advancedTime}`);
console.log('- 가상 시각 12:30 변경: 주간 콜 72건 재구성');

const previousDayStats = {
  todayEarnings: 98000,
  completedTrips: 7,
  activeHours: 4.5,
  acceptanceRate: 95,
  acceptedCalls: 19,
  rejectedCalls: 1,
};
const resetStats = statsForDate(previousDayStats, '2026-08-13', '2026-08-14');
if (JSON.stringify(resetStats) !== JSON.stringify(EMPTY_DRIVER_STATS)) {
  throw new Error('가상 날짜 변경 시 일일 실적이 초기화되지 않습니다.');
}
const respondedStats = recordCallResponse(recordCallResponse(resetStats, 'accepted'), 'rejected');
if (respondedStats.acceptanceRate !== 50 || respondedStats.acceptedCalls !== 1 || respondedStats.rejectedCalls !== 1) {
  throw new Error('콜 수락률이 실제 응답 내역을 반영하지 않습니다.');
}
const completedStats = recordCompletedTrip(respondedStats, 12800, 45);
if (completedStats.todayEarnings !== 12800 || completedStats.completedTrips !== 1 || completedStats.activeHours !== 0.8) {
  throw new Error('운행 완료 실적이 요금·건수·활동 시간을 반영하지 않습니다.');
}
console.log('- 일일 실적: 날짜 초기화·수락률·수익·완료 건수·활동 시간 검증');
