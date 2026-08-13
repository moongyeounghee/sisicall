export type OperationMode = 'normal' | 'home' | 'long' | 'short' | 'ev';

export type DriverState = 'waiting' | 'paused' | 'off_duty' | 'incoming_call' | 'driving' | 'arrived';

export interface CallRequest {
  id: string;
  mode: OperationMode;
  modeLabel: string;
  originTitle: string;
  originSub: string;
  destTitle: string;
  destSub: string;
  distanceKm: number;
  durationMin: number;
  estFare: number;
  isAutoPayment: boolean;
  callType: string;
  surgeBadge?: string;
  createdTime: string;
  pickupDistanceKm: number;
  pickupDurationMin: number;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  destRegion: string;
  homeDirectionSimilarity: number;
  homeDistanceChangeKm: number;
  highwayRatio: number;
  destinationDemandScore: number;
  turnoverPotentialScore: number;
  returnBurdenScore: number;
  batteryUsePct: number;
  batteryAfterRidePct: number;
  nearbyChargers: number;
  nearbyFastChargers: number;
  nearestChargerDistanceKm: number | null;
  chargerCongestionScore: number;
  scenarioTags: string[];
  recommendationScore: number;
  rank: number;
  eligible: boolean;
  reasons: string[];
  warnings: string[];
  scoreBreakdown: ScoreBreakdown[];
}

export interface RawCall {
  id: string;
  requestedAt: string;
  timeBucket: string;
  originTitle: string;
  originSub: string;
  originDistrict: string;
  originLat: number;
  originLng: number;
  destTitle: string;
  destSub: string;
  destRegion: string;
  destDistrict: string;
  destLat: number;
  destLng: number;
  pickupDistanceKm: number;
  pickupDurationMin: number;
  distanceKm: number;
  durationMin: number;
  homeDirectionSimilarity: number;
  homeDistanceChangeKm: number;
  highwayRatio: number;
  destinationDemandScore: number;
  turnoverPotentialScore: number;
  returnBurdenScore: number;
  batteryUsePct: number;
  batteryAfterRidePct: number;
  nearbyChargers: number;
  nearbyFastChargers: number;
  nearestChargerDistanceKm: number | null;
  chargerCongestionScore: number;
  scenarioTags: string[];
}

export interface ScoreBreakdown {
  key: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
}

export interface DriverPreferences {
  currentLocationName: string;
  homeLocationName: string;
  baseTime: string;
  desiredEndTime: string;
  batteryLevel: number;
  safetyReserve: number;
  maxDrivingMinutes: number;
  maxShortTripKm: number;
}

export interface FeedbackEvent {
  callId: string;
  mode: OperationMode;
  action: 'accepted' | 'rejected';
  vector: number[];
  createdAt: string;
}

export interface DriverStats {
  todayEarnings: number;
  completedTrips: number;
  activeHours: number;
  acceptanceRate: number;
  acceptedCalls: number;
  rejectedCalls: number;
}
