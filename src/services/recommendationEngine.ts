import {
  CallRequest,
  DriverPreferences,
  FeedbackEvent,
  OperationMode,
  RawCall,
  ScoreBreakdown,
} from '../types';

export const MODE_META: Record<OperationMode, { label: string; shortLabel: string; icon: string; description: string }> = {
  normal: { label: '일반 모드', shortLabel: '일반', icon: 'local_taxi', description: '선호 필터 없이 모든 콜 보기' },
  home: { label: '귀가 모드', shortLabel: '귀가', icon: 'home', description: '퇴근길을 방해하지 않는 콜' },
  long: { label: '장거리 선호 모드', shortLabel: '장거리', icon: 'route', description: '한 번에 길게 운행하는 콜' },
  short: { label: '단거리 선호 모드', shortLabel: '단거리', icon: 'repeat', description: '가깝고 빠르게 회전하는 콜' },
  ev: { label: '전기차 모드', shortLabel: '전기차', icon: 'ev_station', description: '배터리와 충전 동선이 안전한 콜' },
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return normA && normB ? dot / (normA * normB) : 0;
}

export function callVector(call: Pick<RawCall, 'distanceKm' | 'pickupDistanceKm' | 'homeDirectionSimilarity' | 'turnoverPotentialScore' | 'nearbyChargers' | 'nearbyFastChargers'>) {
  return [
    clamp(call.distanceKm * 2.5) / 100,
    clamp(100 - call.pickupDistanceKm * 7) / 100,
    call.homeDirectionSimilarity / 100,
    call.turnoverPotentialScore / 100,
    clamp(call.nearbyChargers * 20 + call.nearbyFastChargers * 25) / 100,
  ];
}

function learningAdjustment(call: RawCall, mode: OperationMode, feedback: FeedbackEvent[]) {
  const relevant = feedback.filter((item) => item.mode === mode).slice(-30);
  if (relevant.length < 2) return 0;
  const vector = callVector(call);
  const accepted = relevant.filter((item) => item.action === 'accepted');
  const rejected = relevant.filter((item) => item.action === 'rejected');
  const acceptedSimilarity = accepted.length
    ? accepted.reduce((sum, item) => sum + cosineSimilarity(vector, item.vector), 0) / accepted.length
    : 0;
  const rejectedSimilarity = rejected.length
    ? rejected.reduce((sum, item) => sum + cosineSimilarity(vector, item.vector), 0) / rejected.length
    : 0;
  return clamp((acceptedSimilarity - rejectedSimilarity) * 12, -8, 8);
}

function breakdownItem(key: string, label: string, score: number, weight: number): ScoreBreakdown {
  return { key, label, score: round(clamp(score)), weight, weightedScore: round(clamp(score) * weight) };
}

function scoreMode(call: RawCall, mode: OperationMode, preferences: DriverPreferences) {
  const pickupConvenience = clamp(100 - call.pickupDistanceKm * 7);
  const totalMinutes = call.pickupDurationMin + call.durationMin;
  const desiredMinutes = timeToMinutes(preferences.desiredEndTime);
  const baseMinutes = timeToMinutes(preferences.baseTime);
  const availableMinutes = desiredMinutes >= baseMinutes
    ? desiredMinutes - baseMinutes
    : desiredMinutes + 24 * 60 - baseMinutes;
  const finishDelayMinutes = Math.max(0, totalMinutes - availableMinutes);
  const batteryAfterRide = preferences.batteryLevel - call.batteryUsePct;
  let breakdown: ScoreBreakdown[] = [];
  let eligible = true;
  const warnings: string[] = [];

  if (mode === 'normal') {
    const timeEfficiency = clamp(100 - totalMinutes * 0.55);
    breakdown = [
      breakdownItem('pickup', '가까운 픽업', pickupConvenience, 0.45),
      breakdownItem('demand', '하차지 수요', call.destinationDemandScore, 0.35),
      breakdownItem('timeEfficiency', '운행 시간', timeEfficiency, 0.20),
    ];
  } else if (mode === 'home') {
    const distanceImprovement = clamp(50 - call.homeDistanceChangeKm * 5);
    const finishFit = clamp(100 - finishDelayMinutes * 4);
    breakdown = [
      breakdownItem('direction', '자택 방향 일치', call.homeDirectionSimilarity, 0.35),
      breakdownItem('homeDistance', '귀가 거리 개선', distanceImprovement, 0.30),
      breakdownItem('finishTime', '퇴근 시간 적합', finishFit, 0.25),
      breakdownItem('pickup', '픽업 편의', pickupConvenience, 0.10),
    ];
    if (call.homeDirectionSimilarity < 70) warnings.push('자택 방향 일치도가 70%보다 낮아요.');
    if (call.homeDistanceChangeKm >= 0) warnings.push(`운행 후 자택까지 거리가 ${round(call.homeDistanceChangeKm)}km 늘어나요.`);
    if (finishDelayMinutes > 0) warnings.push(`희망 종료 시각보다 약 ${finishDelayMinutes}분 늦어질 수 있어요.`);
    if (call.pickupDistanceKm > 7) warnings.push('픽업 위치가 현재 위치에서 너무 멀어요.');
    eligible = call.homeDirectionSimilarity >= 70
      && call.homeDistanceChangeKm < 0
      && finishDelayMinutes === 0
      && call.pickupDistanceKm <= 7;
  } else if (mode === 'long') {
    const distanceScore = clamp(call.distanceKm * 2.5);
    const timeFit = clamp(100 - Math.max(0, totalMinutes - preferences.maxDrivingMinutes) * 4);
    breakdown = [
      breakdownItem('distance', '운행 거리', distanceScore, 0.40),
      breakdownItem('highway', '간선도로 접근', call.highwayRatio * 100, 0.20),
      breakdownItem('timeFit', '운행 시간 적합', timeFit, 0.20),
      breakdownItem('return', '복귀 부담', call.returnBurdenScore, 0.10),
      breakdownItem('pickup', '픽업 편의', pickupConvenience, 0.10),
    ];
    if (call.distanceKm < 20) warnings.push('운행 거리가 20km보다 짧아 장거리 기준에 맞지 않아요.');
    if (totalMinutes > preferences.maxDrivingMinutes) warnings.push('설정한 최대 운행 시간을 초과할 가능성이 있어요.');
    if (call.pickupDistanceKm > 8) warnings.push('픽업 위치가 현재 위치에서 너무 멀어요.');
    if (call.returnBurdenScore < 25) warnings.push('목적지 도착 후 복귀 부담이 큰 지역이에요.');
    eligible = call.distanceKm >= 20
      && totalMinutes <= preferences.maxDrivingMinutes
      && call.pickupDistanceKm <= 8
      && call.returnBurdenScore >= 25;
  } else if (mode === 'short') {
    const shortTrip = clamp(100 - Math.max(0, call.distanceKm - 1) * (100 / Math.max(1, preferences.maxShortTripKm)));
    breakdown = [
      breakdownItem('shortTrip', '짧은 운행', shortTrip, 0.30),
      breakdownItem('pickup', '가까운 픽업', pickupConvenience, 0.30),
      breakdownItem('turnover', '회전 가능성', call.turnoverPotentialScore, 0.25),
      breakdownItem('demand', '하차지 수요', call.destinationDemandScore, 0.15),
    ];
    if (call.distanceKm > preferences.maxShortTripKm) warnings.push(`선호 거리 ${preferences.maxShortTripKm}km를 초과해요.`);
    if (call.pickupDistanceKm > 5) warnings.push('픽업 거리가 5km보다 멀어요.');
    if (call.durationMin > 25) warnings.push('예상 운행 시간이 25분보다 길어요.');
    eligible = call.distanceKm <= preferences.maxShortTripKm
      && call.pickupDistanceKm <= 5
      && call.durationMin <= 25;
  } else {
    const batterySafety = clamp((batteryAfterRide - preferences.safetyReserve) * 7);
    const chargerAccess = clamp(
      call.nearbyChargers * 20 +
      call.nearbyFastChargers * 25 +
      (call.nearestChargerDistanceKm !== null && call.nearestChargerDistanceKm <= 1 ? 20 : 0),
    );
    const efficiency = clamp(100 - call.batteryUsePct * 8);
    breakdown = [
      breakdownItem('battery', '배터리 안전', batterySafety, 0.40),
      breakdownItem('charger', '충전 접근성', chargerAccess, 0.30),
      breakdownItem('efficiency', '소모 효율', efficiency, 0.20),
      breakdownItem('congestion', '충전 혼잡', call.chargerCongestionScore, 0.10),
    ];
    if (batteryAfterRide < preferences.safetyReserve) {
      eligible = false;
      warnings.push(`운행 후 ${round(batteryAfterRide)}%로 안전 잔량 ${preferences.safetyReserve}%를 밑돌아요.`);
    }
    const hasReachableCharger = call.nearbyChargers > 0
      && call.nearestChargerDistanceKm !== null
      && call.nearestChargerDistanceKm <= 2;
    if (!hasReachableCharger) {
      eligible = false;
      warnings.push('목적지 2km 이내 이용 가능한 충전소가 확인되지 않아요.');
    }
  }

  return { breakdown, eligible, warnings, batteryAfterRide, finishDelayMinutes };
}

function reasonFor(item: ScoreBreakdown, call: RawCall, mode: OperationMode, preferences: DriverPreferences) {
  if (item.key === 'direction') return `자택 방향과 ${Math.round(call.homeDirectionSimilarity)}% 일치해요.`;
  if (item.key === 'homeDistance') {
    return call.homeDistanceChangeKm <= 0
      ? `운행 후 귀가 거리가 ${Math.abs(round(call.homeDistanceChangeKm))}km 줄어요.`
      : `귀가 거리 증가가 ${round(call.homeDistanceChangeKm)}km로 비교적 작아요.`;
  }
  if (item.key === 'finishTime') return `${preferences.desiredEndTime} 이전 운행 종료 가능성이 높아요.`;
  if (item.key === 'distance') return `${round(call.distanceKm)}km 장거리 운행에 적합해요.`;
  if (item.key === 'highway') return `간선도로 예상 비중이 ${Math.round(call.highwayRatio * 100)}%예요.`;
  if (item.key === 'shortTrip') return `${round(call.distanceKm)}km, 약 ${call.durationMin}분의 짧은 콜이에요.`;
  if (item.key === 'pickup') return `픽업까지 ${round(call.pickupDistanceKm)}km, 약 ${call.pickupDurationMin}분이에요.`;
  if (item.key === 'turnover') return `빠른 회전 가능성이 ${Math.round(call.turnoverPotentialScore)}점이에요.`;
  if (item.key === 'demand') return `하차지 후속 수요가 ${Math.round(call.destinationDemandScore)}점이에요.`;
  if (item.key === 'timeEfficiency') return `픽업부터 운행까지 약 ${call.pickupDurationMin + call.durationMin}분이에요.`;
  if (item.key === 'battery') return `운행 후 예상 배터리는 ${round(preferences.batteryLevel - call.batteryUsePct)}%예요.`;
  if (item.key === 'charger') {
    const distance = call.nearestChargerDistanceKm === null ? '거리 확인 필요' : `${round(call.nearestChargerDistanceKm)}km`;
    return `주변 충전소 ${call.nearbyChargers}곳, 가장 가까운 곳은 ${distance}예요.`;
  }
  if (item.key === 'efficiency') return `예상 배터리 소모는 ${round(call.batteryUsePct)}%예요.`;
  if (item.key === 'return') return `복귀 부담 점수는 ${Math.round(call.returnBurdenScore)}점이에요.`;
  return `${MODE_META[mode].shortLabel} 모드에 적합한 조건이에요.`;
}

export function recommendCalls(
  rawCalls: RawCall[],
  mode: OperationMode,
  preferences: DriverPreferences,
  feedback: FeedbackEvent[] = [],
): CallRequest[] {
  const scored = rawCalls.map((call) => {
    const result = scoreMode(call, mode, preferences);
    const baseScore = result.breakdown.reduce((sum, item) => sum + item.weightedScore, 0);
    const learned = learningAdjustment(call, mode, feedback);
    const scoreThreshold = mode === 'normal' ? 0 : mode === 'ev' ? 50 : 55;
    const eligible = result.eligible && baseScore >= scoreThreshold;
    const warnings = [...result.warnings];
    if (result.eligible && !eligible) warnings.push(`모드 적합 점수가 기준 ${scoreThreshold}점보다 낮아요.`);
    const recommendationScore = clamp(baseScore + learned);
    const topItems = [...result.breakdown].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 2);
    const reasons = topItems.map((item) => reasonFor(item, call, mode, preferences));
    if (Math.abs(learned) >= 1) reasons.push(`최근 선택 패턴이 ${learned > 0 ? '+' : ''}${round(learned)}점 반영됐어요.`);
    const estFare = Math.round((4800 + call.distanceKm * 1050 + call.durationMin * 120) / 100) * 100;
    return {
      ...call,
      mode,
      modeLabel: MODE_META[mode].label,
      estFare,
      isAutoPayment: true,
      callType: call.destRegion === '서울특별시' ? '자동 결제' : '시외 자동 결제',
      surgeBadge: eligible ? `AI 추천 ${Math.round(recommendationScore)}점` : '모드 부적합',
      createdTime: '방금 전',
      batteryAfterRidePct: round(result.batteryAfterRide),
      recommendationScore: round(recommendationScore),
      rank: 0,
      eligible,
      reasons,
      warnings,
      scoreBreakdown: result.breakdown,
    } satisfies CallRequest;
  });

  return scored
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.recommendationScore - a.recommendationScore)
    .map((call, index) => ({ ...call, rank: call.eligible ? index + 1 : 0 }));
}
