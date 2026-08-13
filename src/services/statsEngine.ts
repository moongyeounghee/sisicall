import { DriverStats, FeedbackEvent } from '../types';

export const EMPTY_DRIVER_STATS: DriverStats = {
  todayEarnings: 0,
  completedTrips: 0,
  activeHours: 0,
  acceptanceRate: 0,
  acceptedCalls: 0,
  rejectedCalls: 0,
};

export function normalizeDriverStats(stats: DriverStats): DriverStats {
  if (Number.isFinite(stats.acceptedCalls) && Number.isFinite(stats.rejectedCalls)) return stats;

  const sampleResponses = stats.acceptanceRate > 0 ? 20 : 0;
  const acceptedCalls = Math.round(sampleResponses * stats.acceptanceRate / 100);
  return {
    ...stats,
    acceptedCalls,
    rejectedCalls: sampleResponses - acceptedCalls,
  };
}

export function statsForDate(stats: DriverStats, statsDate: string, eventDate: string): DriverStats {
  return statsDate === eventDate ? normalizeDriverStats(stats) : { ...EMPTY_DRIVER_STATS };
}

export function recordCallResponse(stats: DriverStats, action: FeedbackEvent['action']): DriverStats {
  const acceptedCalls = stats.acceptedCalls + (action === 'accepted' ? 1 : 0);
  const rejectedCalls = stats.rejectedCalls + (action === 'rejected' ? 1 : 0);
  const totalResponses = acceptedCalls + rejectedCalls;
  return {
    ...stats,
    acceptedCalls,
    rejectedCalls,
    acceptanceRate: totalResponses === 0 ? 0 : Math.round(acceptedCalls / totalResponses * 100),
  };
}

export function recordCompletedTrip(
  stats: DriverStats,
  earnedFare: number,
  activeMinutes: number,
): DriverStats {
  return {
    ...stats,
    todayEarnings: stats.todayEarnings + earnedFare,
    completedTrips: stats.completedTrips + 1,
    activeHours: Number((stats.activeHours + activeMinutes / 60).toFixed(1)),
  };
}

