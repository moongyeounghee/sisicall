import React, { useRef, useState } from 'react';
import { CallRequest, DriverPreferences, DriverState, OperationMode } from '../types';
import { MODE_META } from '../services/recommendationEngine';
import { sounds } from '../utils/audio';
import { RecommendationScore } from './RecommendationScore';

interface Props {
  driverState: DriverState;
  setDriverState: (state: DriverState) => void;
  activeMode: OperationMode;
  preferences: DriverPreferences;
  topRecommendation: CallRequest | null;
  analyzedCount: number;
  eligibleCount: number;
  homeDistanceKm: number;
  onPreviewTopCall: () => void;
  onOpenModeSettings: () => void;
  onGoHome: () => void;
  onCancelGoHome: () => void;
  onOpenBoosterModal: () => void;
  onOpenNotice: () => void;
  onOpenMenu: () => void;
  boosterTarget: string | null;
  onOpenCallList: () => void;
  onOpenDemandMap: () => void;
  onRefreshCalls: () => void;
}

export const MainCallWaitingScreen: React.FC<Props> = ({
  driverState,
  setDriverState,
  activeMode,
  preferences,
  topRecommendation,
  analyzedCount,
  eligibleCount,
  homeDistanceKm,
  onPreviewTopCall,
  onOpenModeSettings,
  onGoHome,
  onCancelGoHome,
  onOpenBoosterModal,
  onOpenNotice,
  onOpenMenu,
  boosterTarget,
  onOpenCallList,
  onOpenDemandMap,
  onRefreshCalls,
}) => {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const mode = MODE_META[activeMode];
  const sliderMaxOffset = Math.max(1, (sliderTrackRef.current?.clientWidth ?? 56) - 56);
  const sliderProgress = Math.round(sliderPosition / sliderMaxOffset * 100);

  const getSliderPosition = (clientX: number) => {
    if (!sliderTrackRef.current) return { position: 0, maxOffset: 0 };
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const maxOffset = Math.max(0, rect.width - 56);
    const position = Math.max(0, Math.min(clientX - rect.left - 28, maxOffset));
    return { position, maxOffset };
  };

  const handlePointerStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setSliderPosition(0);
    sounds.playClick();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setSliderPosition(getSliderPosition(event.clientX).position);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (!isDragging) return;
    const { position, maxOffset } = getSliderPosition(event.clientX);
    const completed = !cancelled && maxOffset > 0 && position >= maxOffset - 3;
    setIsDragging(false);
    setSliderPosition(0);
    if (completed) {
      sounds.playAcceptSound();
      setDriverState(driverState === 'off_duty' ? 'waiting' : 'off_duty');
    }
  };

  const togglePauseCall = () => {
    sounds.playClick();
    setDriverState(driverState === 'waiting' ? 'paused' : 'waiting');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden bg-[#131313] p-2.5 text-[#e5e2e1] select-none">
      <div className="flex h-9 shrink-0 items-center justify-between">
        <button
          onClick={onOpenModeSettings}
          className="flex h-8 items-center gap-1.5 rounded-full border border-[#ffd700]/50 bg-[#201f1f] px-3 text-xs font-extrabold text-[#ffd700]"
          aria-label="모드 선택"
        >
          <span className="material-symbols-outlined text-lg">{mode.icon}</span>
          <span>{mode.shortLabel}</span>
          <span className="material-symbols-outlined text-base">expand_more</span>
        </button>
        <div className="flex items-center text-xs font-bold">
          <button onClick={onOpenNotice} className="h-8 px-2">공지</button>
          <button onClick={onOpenMenu} className="h-8 px-2">메뉴</button>
        </div>
      </div>

      <div className="grid h-10 shrink-0 grid-cols-[1fr_1fr_auto] divide-x divide-[#3b3934] rounded-lg border border-[#353534] bg-[#1d1c1c]">
        <StatCard label="주변 콜" value={`${analyzedCount}건`} />
        <StatCard label={activeMode === 'normal' ? '노출 콜' : '모드 적합'} value={`${eligibleCount}건`} accent="text-[#ffd700]" />
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onRefreshCalls();
          }}
          aria-label="주변 콜 새로 불러오기"
          className="flex w-11 items-center justify-center text-[#d0c6ab] transition-colors hover:text-[#ffd700] active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      {driverState === 'waiting' && topRecommendation && (
        <section className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 rounded-2xl border border-[#ffd700]/60 bg-[#1c1b1b] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.32)]">
          <div className="flex shrink-0 items-center gap-2 overflow-hidden">
            <span className="shrink-0 rounded-full bg-[#ffd700] px-2.5 py-1 text-xs font-black text-[#3a3000]">AI 1순위</span>
            <span className="truncate text-sm text-[#d0c6ab]">{mode.description}</span>
          </div>

          <div className="grid min-h-[104px] flex-1 grid-rows-2 overflow-hidden rounded-xl bg-[#242321] px-3 py-1">
            <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-3 border-b border-[#3b3934]">
              <span className="text-sm font-bold text-[#72d6ff]">출발</span>
              <h2 className="truncate text-2xl font-black leading-tight text-white">{topRecommendation.originTitle}</h2>
            </div>
            <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-3">
              <span className="text-sm font-bold text-[#ffd700]">도착</span>
              <h2 className="truncate text-2xl font-black leading-tight text-[#ffe88b]">{topRecommendation.destTitle}</h2>
            </div>
          </div>

          <div className="grid h-11 shrink-0 grid-cols-3 divide-x divide-[#4d4732] rounded-xl bg-[#101010] px-1 text-center text-sm font-bold font-mono-num">
            <span className="flex items-center justify-center">픽업 {topRecommendation.pickupDistanceKm.toFixed(1)}km</span>
            <span className="flex items-center justify-center">운행 {topRecommendation.distanceKm.toFixed(1)}km</span>
            <span className="flex items-center justify-center">{topRecommendation.durationMin}분</span>
          </div>

          <RecommendationScore
            compact
            score={topRecommendation.recommendationScore}
            reasons={topRecommendation.reasons}
            warnings={topRecommendation.warnings}
          />
          <button
            type="button"
            onClick={onPreviewTopCall}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ffd700] text-base font-extrabold text-[#3a3000]"
          >
            추천 콜 확인 <span className="material-symbols-outlined text-2xl">arrow_forward</span>
          </button>
        </section>
      )}

      {driverState === 'paused' && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-[#ffb4ab]/30 bg-[#1c1b1b] p-5 text-center">
          <span className="material-symbols-outlined text-4xl text-[#ffb4ab]">pause_circle</span>
          <h2 className="mt-1 text-xl font-bold text-[#ffb4ab]">콜 대기 중단됨</h2>
          <p className="mt-1 text-sm text-[#d0c6ab]">새로운 추천 콜 수신을 잠시 정지했습니다.</p>
          <button onClick={togglePauseCall} className="mt-3 h-12 rounded-xl bg-[#ffd700] px-6 font-bold text-[#3a3000]">콜 다시 받기</button>
        </div>
      )}

      {driverState === 'off_duty' && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-[#353534] bg-[#1c1b1b] p-5 text-center">
          <span className="material-symbols-outlined text-4xl text-[#d0c6ab]">bedtime</span>
          <h2 className="mt-1 text-xl font-bold">퇴근 상태</h2>
          <p className="mt-1 text-sm text-[#d0c6ab]">아래 버튼을 밀면 추천 콜 수신을 재개합니다.</p>
        </div>
      )}

      <div className={`flex h-[62px] shrink-0 items-center rounded-xl border px-3 ${activeMode === 'home' ? 'border-[#ffd700] bg-[#2b270f]' : 'border-[#8a7400] bg-[#292611]'}`}>
        <button type="button" onClick={activeMode === 'home' ? undefined : onGoHome} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="material-symbols-outlined shrink-0 text-3xl text-[#ffd700] icon-fill">home</span>
          <span className="min-w-0">
            <strong className="block text-lg font-extrabold leading-tight text-[#ffd700]">{activeMode === 'home' ? '귀가 모드 사용 중' : '이제 귀가'}</strong>
            <span className="block truncate text-xs text-[#e7dfbd]">{preferences.homeLocationName} · 약 {homeDistanceKm.toFixed(1)}km</span>
          </span>
        </button>
        {activeMode === 'home' && <button type="button" onClick={onCancelGoHome} className="h-10 rounded-lg border border-[#d0c6ab]/50 px-3 text-sm font-bold">해제</button>}
      </div>

      <button onClick={onOpenBoosterModal} className="flex h-11 shrink-0 items-center justify-between rounded-xl border border-[#353534] bg-[#201f1f] px-4 text-sm font-bold">
        <span className="flex min-w-0 items-center gap-2"><span className="material-symbols-outlined text-xl text-[#ffd700]">assistant_navigation</span><span className="truncate">{boosterTarget ? `부스터: ${boosterTarget}` : '목적지 부스터 설정'}</span></span>
        <span className="material-symbols-outlined text-xl">chevron_right</span>
      </button>

      <button
        onClick={togglePauseCall}
        disabled={driverState === 'off_duty'}
        className={`h-11 shrink-0 rounded-xl border text-base font-bold ${driverState === 'off_duty' ? 'bg-[#201f1f] text-[#666] border-[#2a2a2a]' : driverState === 'paused' ? 'bg-[#ffd700] text-[#3a3000] border-[#ffd700]' : 'bg-[#2a2a2a] text-[#e5e2e1] border-[#3d3d3d]'}`}
      >
        {driverState === 'paused' ? '콜 재개하기' : '콜 잠시 멈추기'}
      </button>

      <div className="grid h-11 shrink-0 grid-cols-2 divide-x divide-[#3a3a3a] border-y border-[#2a2a2a] text-sm font-extrabold">
        <button onClick={onOpenCallList} className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-2xl text-[#ffd700]">format_list_bulleted</span>콜 리스트</button>
        <button onClick={onOpenDemandMap} className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-2xl text-[#1e95f2]">map</span>수요지도</button>
      </div>

      <div
        ref={sliderTrackRef}
        className="relative flex h-14 w-full shrink-0 touch-none select-none items-center overflow-hidden rounded-full border border-[#3d3d3d] bg-[#2a2a2a] p-1.5"
      >
        <div className="absolute inset-y-0 left-0 bg-[#ffd700]/20" style={{ width: `${sliderPosition + 40}px` }} />
        <div
          onPointerDown={handlePointerStart}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => handlePointerEnd(event)}
          onPointerCancel={(event) => handlePointerEnd(event, true)}
          style={{ transform: `translateX(${sliderPosition}px)` }}
          className="z-20 flex h-11 w-11 cursor-grab touch-none items-center justify-center rounded-full bg-[#ffd700] text-[#3a3000] active:cursor-grabbing"
          role="slider"
          aria-label={driverState === 'off_duty' ? '밀어서 출근' : '밀어서 퇴근'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sliderProgress}
        >
          <span className="material-symbols-outlined text-2xl font-bold">arrow_forward</span>
        </div>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center pl-8 text-base font-bold">{driverState === 'off_duty' ? '밀어서 출근' : '밀어서 퇴근'}</span>
      </div>
    </div>
  );
};

function StatCard({ label, value, accent = '' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-2">
      <p className="text-xs font-bold text-[#aaa28e]">{label}</p>
      <p className={`text-lg font-extrabold font-mono-num ${accent}`}>{value}</p>
    </div>
  );
}
