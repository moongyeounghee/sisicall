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

export function buildSimulationCallPool(
  calls: RawCall[],
  simulation: SimulationState,
  unavailableCallIds: string[],
  limit = 72,
) {
  const unavailable = new Set(unavailableCallIds);
  const bucket = simulationTimeBucket(simulation.currentTime);
  return calls
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
    .sort((a, b) => a.pickupDistanceKm - b.pickupDistanceKm || hashId(a.id) - hashId(b.id))
    .slice(0, limit);
}
