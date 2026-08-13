import React from 'react';
import { CallRequest, OperationMode } from '../types';
import { MODE_META } from '../services/recommendationEngine';
import { sounds } from '../utils/audio';
import { RecommendationScore } from './RecommendationScore';

interface Props {
  calls: CallRequest[];
  activeMode: OperationMode;
  onAcceptCall: (call: CallRequest) => void;
  onClose: () => void;
}

export const CallListDrawer: React.FC<Props> = ({ calls, activeMode, onAcceptCall, onClose }) => {
  const eligibleCount = calls.filter((call) => call.eligible).length;
  const isNormal = activeMode === 'normal';
  const rankedCalls = [...calls].sort((a, b) => {
    if (a.eligible !== b.eligible) return Number(b.eligible) - Number(a.eligible);
    if (a.eligible && b.eligible) return a.rank - b.rank;
    return b.recommendationScore - a.recommendationScore;
  });

  return (
    <div className="absolute inset-0 z-50 flex h-full flex-col overflow-hidden bg-[#131313] text-[#e5e2e1] select-none">
      <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-[#353534] bg-[#131313] px-3 py-2">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full text-[#d0c6ab]" aria-label="뒤로">
            <span className="material-symbols-outlined text-3xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-extrabold">콜 리스트</h1>
            <p className="text-sm text-[#aaa28e]">
              {isNormal ? 'AI 추천 점수가 높은 순' : `${MODE_META[activeMode].label} · 적합 순위순`}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-[#4d4732] bg-[#201f1f] px-3 py-1.5 text-sm font-bold text-[#ffd700]">
          {isNormal ? `노출 ${eligibleCount}건` : `적합 ${eligibleCount}건`}
        </span>
      </header>

      <main className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 pb-6">
        {rankedCalls.map((call) => (
          <article
            key={call.id}
            className={`flex flex-col gap-2.5 rounded-2xl border bg-[#1c1b1b] p-4 shadow-md ${call.eligible ? 'border-[#353534]' : 'border-[#93000a]/70'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {call.eligible ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffd700] text-lg font-black text-[#3a3000] font-mono-num">{call.rank}</span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#93000a]/30 text-[#ffb4ab]"><span className="material-symbols-outlined text-2xl">block</span></span>
                )}
                <div>
                  <p className="text-sm text-[#aaa28e]">{call.modeLabel}</p>
                  <p className={`text-base font-extrabold ${call.eligible ? 'text-[#ffd700]' : 'text-[#ffb4ab]'}`}>
                    {call.eligible ? '추천 가능' : '모드 부적합'}
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-[#2a2a2a] px-3 py-2 text-base font-bold text-[#ffe16d]">약 ₩{call.estFare.toLocaleString()}</span>
            </div>

            <div className="rounded-xl bg-[#242321] px-3 py-1">
              <div className="grid grid-cols-[auto_42px_minmax(0,1fr)] items-center gap-2 border-b border-[#3b3934] py-2.5"><span className="h-3 w-3 rounded-full bg-[#1e95f2]"/><span className="text-sm font-bold text-[#72d6ff]">출발</span><span className="truncate text-xl font-black text-white">{call.originTitle}</span></div>
              <div className="grid grid-cols-[auto_42px_minmax(0,1fr)] items-center gap-2 py-2.5"><span className="h-3 w-3 rounded-full bg-[#ffd700]"/><span className="text-sm font-bold text-[#ffd700]">도착</span><span className="truncate text-xl font-black text-[#ffe88b]">{call.destTitle}</span></div>
            </div>

            <div className="grid h-10 grid-cols-3 divide-x divide-[#353534] rounded-xl bg-[#131313] text-center text-xs">
              <div className="flex items-center justify-center gap-1.5"><span className="text-[#999]">픽업</span><strong className="text-sm font-mono-num">{call.pickupDistanceKm.toFixed(1)}km</strong></div>
              <div className="flex items-center justify-center gap-1.5"><span className="text-[#999]">운행</span><strong className="text-sm font-mono-num">{call.distanceKm.toFixed(1)}km</strong></div>
              <div className="flex items-center justify-center gap-1.5"><span className="text-[#999]">예상</span><strong className="text-sm font-mono-num">{call.durationMin}분</strong></div>
            </div>

            <RecommendationScore dense score={call.recommendationScore} reasons={call.reasons} warnings={call.warnings} />

            {call.eligible && (
              <button
                onClick={() => { sounds.playAcceptSound(); onAcceptCall(call); onClose(); }}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd700] text-lg font-extrabold text-[#3a3000] active:scale-[0.99]"
              >
                이 콜 선택 <span className="material-symbols-outlined text-2xl">call_made</span>
              </button>
            )}
          </article>
        ))}
      </main>

    </div>
  );
};
