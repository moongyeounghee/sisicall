import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import calls3000 from './data/calls3000.json';
import {
  CallRequest,
  DriverPreferences,
  DriverState,
  DriverStats,
  FeedbackEvent,
  OperationMode,
  RawCall,
} from './types';
import { callVector, recommendCalls } from './services/recommendationEngine';
import {
  addSimulationMinutes,
  buildSimulationCallPool,
  DEFAULT_SIMULATION,
  estimatedRoadDistanceKm,
  HOME_COORDINATES,
  SimulationState,
} from './services/simulationEngine';
import {
  EMPTY_DRIVER_STATS,
  normalizeDriverStats,
  recordCallResponse,
  recordCompletedTrip,
  statsForDate,
} from './services/statsEngine';
import { sounds } from './utils/audio';
import { PwaDemoHeader } from './components/PwaDemoHeader';
import { MobileFrame } from './components/MobileFrame';
import { MainCallWaitingScreen } from './components/MainCallWaitingScreen';
import { ModeSettingsModal } from './components/ModeSettingsModal';
import { CallAcceptModal } from './components/CallAcceptModal';
import { ActiveDriveScreen } from './components/ActiveDriveScreen';
import { CallListDrawer } from './components/CallListDrawer';
import { ComingSoonModal } from './components/ComingSoonModal';
import { BoosterModal } from './components/BoosterModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { StatsModal } from './components/StatsModal';
import { NoticeModal } from './components/NoticeModal';
import { MenuDrawer } from './components/MenuDrawer';

const RAW_CALLS = calls3000 as RawCall[];

const DEFAULT_PREFERENCES: DriverPreferences = {
  currentLocationName: '연세대학교 신촌캠퍼스',
  homeLocationName: '노원구 노원로26길 59',
  baseTime: '07:00',
  desiredEndTime: '09:00',
  batteryLevel: 35,
  safetyReserve: 15,
  maxDrivingMinutes: 120,
  maxShortTripKm: 7,
};

const DEFAULT_STATS: DriverStats = {
  todayEarnings: 98000,
  completedTrips: 7,
  activeHours: 4.5,
  acceptanceRate: 95,
  acceptedCalls: 19,
  rejectedCalls: 1,
};

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeMode, setActiveMode] = useState<OperationMode>(() => readStored('callfit-mode', 'normal'));
  const [preferences, setPreferences] = useState<DriverPreferences>(() => readStored('callfit-preferences', DEFAULT_PREFERENCES));
  const [feedback, setFeedback] = useState<FeedbackEvent[]>(() => readStored('callfit-feedback', []));
  const [simulation, setSimulation] = useState<SimulationState>(() => readStored('callfit-simulation', DEFAULT_SIMULATION));
  const [stats, setStats] = useState<DriverStats>(() => normalizeDriverStats(readStored('callfit-stats', DEFAULT_STATS)));
  const [statsDate, setStatsDate] = useState<string>(() => readStored(
    'callfit-stats-date',
    readStored<SimulationState>('callfit-simulation', DEFAULT_SIMULATION).currentTime.slice(0, 10),
  ));
  const [driverState, setDriverState] = useState<DriverState>('waiting');
  const [boosterTarget, setBoosterTarget] = useState<string | null>(null);
  const [unavailableCallIds, setUnavailableCallIds] = useState<string[]>(() => readStored('callfit-unavailable-calls', []));
  const [currentIncomingCall, setCurrentIncomingCall] = useState<CallRequest | null>(null);
  const [activeDriveCall, setActiveDriveCall] = useState<CallRequest | null>(null);
  const [callCursor, setCallCursor] = useState(0);

  const [showModeSettings, setShowModeSettings] = useState(false);
  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showCallList, setShowCallList] = useState(false);
  const [showDemandNotice, setShowDemandNotice] = useState(false);

  const hasBlockingOverlay = showModeSettings
    || showBoosterModal
    || showPwaModal
    || showStatsModal
    || showNoticeModal
    || showMenuDrawer
    || showCallList
    || showDemandNotice;
  const blockingOverlayRef = useRef(hasBlockingOverlay);
  blockingOverlayRef.current = hasBlockingOverlay;

  const livePool = useMemo(
    () => buildSimulationCallPool(RAW_CALLS, simulation, unavailableCallIds),
    [simulation, unavailableCallIds],
  );
  const scoringPreferences = useMemo<DriverPreferences>(() => ({
    ...preferences,
    currentLocationName: simulation.locationName,
    baseTime: simulation.currentTime.slice(11, 16),
  }), [preferences, simulation]);

  const recommendations = useMemo(
    () => recommendCalls(livePool, activeMode, scoringPreferences, feedback),
    [livePool, activeMode, scoringPreferences, feedback],
  );
  const eligibleRecommendations = recommendations.filter((call) => call.eligible);
  const visibleCalls = useMemo(
    () => [
      ...eligibleRecommendations.slice(0, 12),
      ...recommendations.filter((call) => !call.eligible).slice(0, 5),
    ],
    [eligibleRecommendations, recommendations],
  );

  useEffect(() => {
    localStorage.setItem('callfit-mode', JSON.stringify(activeMode));
    localStorage.setItem('callfit-preferences', JSON.stringify(preferences));
    localStorage.setItem('callfit-feedback', JSON.stringify(feedback.slice(-60)));
    localStorage.setItem('callfit-stats', JSON.stringify(stats));
    localStorage.setItem('callfit-stats-date', JSON.stringify(statsDate));
    localStorage.setItem('callfit-simulation', JSON.stringify(simulation));
    localStorage.setItem('callfit-unavailable-calls', JSON.stringify(unavailableCallIds.slice(-300)));
  }, [activeMode, preferences, feedback, stats, statsDate, simulation, unavailableCallIds]);

  useEffect(() => {
    const simulationDate = simulation.currentTime.slice(0, 10);
    if (statsDate !== simulationDate) {
      setStats({ ...EMPTY_DRIVER_STATS });
      setStatsDate(simulationDate);
    }
  }, [simulation.currentTime, statsDate]);

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  const recordFeedback = useCallback((call: CallRequest, action: FeedbackEvent['action']) => {
    const eventDate = simulation.currentTime.slice(0, 10);
    setFeedback((previous) => [
      ...previous.slice(-59),
      {
        callId: call.id,
        mode: activeMode,
        action,
        vector: callVector(call),
        createdAt: simulation.currentTime,
      },
    ]);
    setStats((previous) => recordCallResponse(statsForDate(previous, statsDate, eventDate), action));
    setStatsDate(eventDate);
  }, [activeMode, simulation.currentTime, statsDate]);

  const triggerIncomingCall = useCallback((modeOverride?: OperationMode) => {
    if (driverState !== 'waiting' || blockingOverlayRef.current) return;
    const targetMode = modeOverride ?? activeMode;
    const ranked = targetMode === activeMode
      ? eligibleRecommendations
      : recommendCalls(livePool, targetMode, scoringPreferences, feedback).filter((call) => call.eligible);
    if (!ranked.length) return;
    const selected = ranked[callCursor % Math.min(ranked.length, 8)];
    setCallCursor((value) => value + 1);
    setCurrentIncomingCall(selected);
    setDriverState('incoming_call');
  }, [activeMode, callCursor, driverState, eligibleRecommendations, feedback, livePool, scoringPreferences]);

  useEffect(() => {
    if (driverState !== 'waiting' || currentIncomingCall || activeDriveCall || hasBlockingOverlay) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') triggerIncomingCall();
    }, 28000);
    return () => window.clearTimeout(timer);
  }, [activeDriveCall, currentIncomingCall, driverState, hasBlockingOverlay, triggerIncomingCall]);

  const handleAcceptCall = (call: CallRequest) => {
    recordFeedback(call, 'accepted');
    setUnavailableCallIds((ids) => ids.includes(call.id) ? ids : [...ids, call.id]);
    setActiveDriveCall(call);
    setCurrentIncomingCall(null);
    setDriverState('driving');
  };

  const handleRejectCall = useCallback(() => {
    if (currentIncomingCall) recordFeedback(currentIncomingCall, 'rejected');
    setCurrentIncomingCall(null);
    setDriverState('waiting');
  }, [currentIncomingCall, recordFeedback]);

  const handleFinishDrive = (earnedFare: number) => {
    if (activeDriveCall) {
      const activeMinutes = activeDriveCall.pickupDurationMin + activeDriveCall.durationMin;
      const completedAt = addSimulationMinutes(simulation.currentTime, activeMinutes);
      const startedDate = simulation.currentTime.slice(0, 10);
      const completedDate = completedAt.slice(0, 10);
      setStats((previous) => recordCompletedTrip(
        statsForDate(previous, statsDate, completedDate),
        earnedFare,
        activeMinutes,
      ));
      setStatsDate(completedDate);
      if (completedDate !== startedDate) setUnavailableCallIds([activeDriveCall.id]);
      setPreferences((previous) => ({
        ...previous,
        currentLocationName: activeDriveCall.destTitle,
        batteryLevel: Number(Math.max(0, previous.batteryLevel - activeDriveCall.batteryUsePct).toFixed(1)),
      }));
      setSimulation((previous) => ({
        currentTime: addSimulationMinutes(previous.currentTime, activeMinutes),
        locationName: activeDriveCall.destTitle,
        latitude: activeDriveCall.destLat,
        longitude: activeDriveCall.destLng,
      }));
    }
    setActiveDriveCall(null);
    setDriverState('waiting');
  };

  const handleSaveMode = (mode: OperationMode, nextPreferences: DriverPreferences) => {
    setActiveMode(mode);
    setPreferences(nextPreferences);
    setCurrentIncomingCall(null);
    if (driverState === 'incoming_call') setDriverState('waiting');
  };

  const handleGoHome = () => {
    sounds.playAcceptSound();
    setActiveMode('home');
    setCurrentIncomingCall(null);
    if (driverState === 'paused' || driverState === 'off_duty' || driverState === 'incoming_call') {
      setDriverState('waiting');
    }
  };

  const handleCancelGoHome = () => {
    sounds.playClick();
    setActiveMode('normal');
    setCurrentIncomingCall(null);
    if (driverState === 'incoming_call') setDriverState('waiting');
  };

  const handleSimulationTimeChange = (currentTime: string) => {
    if (!currentTime) return;
    const previousDate = simulation.currentTime.slice(0, 10);
    const nextDate = currentTime.slice(0, 10);
    if (previousDate !== nextDate) {
      setStats({ ...EMPTY_DRIVER_STATS });
      setStatsDate(nextDate);
      setUnavailableCallIds([]);
    }
    setSimulation((previous) => ({ ...previous, currentTime }));
    setCurrentIncomingCall(null);
    setCallCursor(0);
    if (driverState === 'incoming_call') setDriverState('waiting');
  };

  const homeDistanceKm = estimatedRoadDistanceKm(
    simulation.latitude,
    simulation.longitude,
    HOME_COORDINATES.latitude,
    HOME_COORDINATES.longitude,
  );

  return (
    <div className="h-screen overflow-hidden bg-[#131313] text-[#e5e2e1] flex flex-col font-sans">
      <PwaDemoHeader
        simulation={simulation}
        onSimulationTimeChange={handleSimulationTimeChange}
        isDriving={driverState === 'driving'}
      />

      <MobileFrame simulationTime={simulation.currentTime}>
        <MainCallWaitingScreen
          driverState={driverState}
          setDriverState={setDriverState}
          activeMode={activeMode}
          preferences={scoringPreferences}
          topRecommendation={eligibleRecommendations[0] ?? null}
          analyzedCount={livePool.length}
          eligibleCount={eligibleRecommendations.length}
          homeDistanceKm={homeDistanceKm}
          onPreviewTopCall={() => triggerIncomingCall(activeMode)}
          onOpenModeSettings={() => setShowModeSettings(true)}
          onGoHome={handleGoHome}
          onCancelGoHome={handleCancelGoHome}
          onOpenBoosterModal={() => setShowBoosterModal(true)}
          onOpenNotice={() => setShowNoticeModal(true)}
          onOpenMenu={() => setShowMenuDrawer(true)}
          boosterTarget={boosterTarget}
          onOpenCallList={() => setShowCallList(true)}
          onOpenDemandMap={() => setShowDemandNotice(true)}
        />
        {showModeSettings && (
          <ModeSettingsModal
            activeMode={activeMode}
            preferences={preferences}
            onSaveMode={handleSaveMode}
            onClose={() => setShowModeSettings(false)}
          />
        )}
        {driverState === 'incoming_call' && currentIncomingCall && (
          <CallAcceptModal call={currentIncomingCall} onAcceptCall={handleAcceptCall} onRejectCall={handleRejectCall} />
        )}
        {driverState === 'driving' && activeDriveCall && (
          <ActiveDriveScreen
            call={activeDriveCall}
            driverLatitude={simulation.latitude}
            driverLongitude={simulation.longitude}
            onFinishDrive={handleFinishDrive}
            onCancelDrive={() => {
              setActiveDriveCall(null);
              setDriverState('waiting');
            }}
          />
        )}
        {showCallList && (
          <CallListDrawer calls={visibleCalls} activeMode={activeMode} onAcceptCall={handleAcceptCall} onClose={() => setShowCallList(false)} />
        )}
        {showDemandNotice && <ComingSoonModal onClose={() => setShowDemandNotice(false)} />}
        {showBoosterModal && <BoosterModal currentTarget={boosterTarget} onSetBooster={setBoosterTarget} onClose={() => setShowBoosterModal(false)} />}
        {showPwaModal && <PwaInstallModal onClose={() => setShowPwaModal(false)} />}
        {showStatsModal && <StatsModal stats={stats} onClose={() => setShowStatsModal(false)} />}
        {showNoticeModal && <NoticeModal onClose={() => setShowNoticeModal(false)} />}
        {showMenuDrawer && (
          <MenuDrawer
            onClose={() => setShowMenuDrawer(false)}
            onOpenModeSettings={() => setShowModeSettings(true)}
            onOpenStats={() => setShowStatsModal(true)}
            onOpenPwaModal={() => setShowPwaModal(true)}
          />
        )}
      </MobileFrame>
    </div>
  );
}
