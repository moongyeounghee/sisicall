import React, { useState, useEffect } from 'react';
import { CallRequest } from '../types';
import { sounds } from '../utils/audio';
import { RecommendationScore } from './RecommendationScore';

interface Props {
  call: CallRequest;
  onAcceptCall: (call: CallRequest) => void;
  onRejectCall: () => void;
}

export const CallAcceptModal: React.FC<Props> = ({ call, onAcceptCall, onRejectCall }) => {
  const [timeLeft, setTimeLeft] = useState<number>(15);

  useEffect(() => {
    // Play dispatch audio alert
    sounds.playIncomingCallAlert();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onRejectCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onRejectCall]);

  const handleAccept = () => {
    sounds.playAcceptSound();
    onAcceptCall(call);
  };

  const handleReject = () => {
    sounds.playClick();
    onRejectCall();
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#131313] text-[#e5e2e1] flex flex-col h-full overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Status Header (Secondary Blue for Active Dispatch Mode) */}
      <header className="w-full bg-[#1e95f2] px-4 py-3 flex justify-between items-center shadow-md relative z-10 text-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white icon-fill text-2xl">
            speed
          </span>
          <h1 className="font-bold text-lg">{call.modeLabel}</h1>
        </div>

        {/* Surge Badge */}
        <div className="bg-[#131313] text-[#ffd700] px-2.5 py-1 rounded-full text-xs font-mono-num font-bold border border-[#ffd700] shadow-sm flex items-center gap-1">
          <span>{call.surgeBadge || '+20% 할증'}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-h-0 flex-1 flex flex-col p-3 gap-3 overflow-hidden pb-24">
        <section>
          <p className="mb-2 text-base font-extrabold text-[#ffd700]">현재 모드 {call.rank}순위 추천</p>
          <RecommendationScore score={call.recommendationScore} reasons={call.reasons} warnings={call.warnings} />
        </section>
        
        {/* Key Metrics Card (예상 거리 & 예상 소요 시간) */}
        <div className="flex justify-around items-center bg-[#2a2a2a] rounded-xl p-4 border border-[#4d4732] shadow-md">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-mono-num text-[#d0c6ab]">예상 거리</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#ffe16d] font-mono-num">{call.distanceKm}</span>
              <span className="text-xs text-[#d0c6ab]">km</span>
            </div>
          </div>

          <div className="w-px h-10 bg-[#4d4732]"></div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-mono-num text-[#d0c6ab]">예상 소요 시간</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#ffe16d] font-mono-num">{call.durationMin}</span>
              <span className="text-xs text-[#d0c6ab]">분</span>
            </div>
          </div>

          <div className="w-px h-10 bg-[#4d4732]"></div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-mono-num text-[#d0c6ab]">픽업 거리</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#ffe16d] font-mono-num">{call.pickupDistanceKm.toFixed(1)}</span>
              <span className="text-xs text-[#d0c6ab]">km</span>
            </div>
          </div>
        </div>

        {/* Routing Information (Origin & Destination) */}
        <div className="flex flex-col gap-4 bg-[#201f1f] p-5 rounded-xl border border-[#4d4732] flex-1 justify-center shadow-inner">
          
          {/* Origin */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-5 h-5 bg-[#1e95f2] rounded-full border-2 border-[#131313] flex items-center justify-center relative z-10 shadow">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div className="w-0.5 h-14 bg-[#4d4732] my-1"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono-num text-[#d0c6ab] uppercase tracking-wider mb-0.5">
                출발지
              </span>
              <h2 className="text-2xl font-extrabold text-[#e5e2e1] leading-tight">
                {call.originTitle}
              </h2>
              <span className="text-xs text-[#d0c6ab] mt-1">{call.originSub}</span>
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-5 h-5 bg-[#ffd700] rounded-full border-2 border-[#131313] flex items-center justify-center relative z-10 shadow-[0_0_12px_rgba(255,215,0,0.6)]">
                <span className="material-symbols-outlined text-[#705e00] text-[12px] icon-fill">
                  location_on
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono-num text-[#d0c6ab] uppercase tracking-wider mb-0.5">
                목적지
              </span>
              <h2 className="text-2xl font-extrabold text-[#e5e2e1] leading-tight">
                {call.destTitle}
              </h2>
              <span className="text-xs text-[#d0c6ab] mt-1">{call.destSub}</span>
            </div>
          </div>

        </div>

        {/* Passenger & Fare Info Glanceable Bar */}
        <div className="flex items-center justify-between bg-[#1c1b1b] p-4 rounded-xl border border-[#4d4732]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1e95f2]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1e95f2] icon-fill">
                person
              </span>
            </div>
            <div>
              <p className="font-bold text-base text-[#e5e2e1]">{call.callType}</p>
              <p className="text-xs text-[#d0c6ab]">
                {call.isAutoPayment ? '결제 완료 (앱 결제)' : '현장 결제'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold font-mono-num text-[#ffe16d]">
              ~ ₩{call.estFare.toLocaleString()}
            </p>
            <p className="text-xs text-[#d0c6ab]">예상 요금</p>
          </div>
        </div>

      </main>

      {/* Action Buttons (Bottom Fixed with 15s Countdown Bar) */}
      <div className="absolute bottom-0 left-0 w-full bg-[#131313] border-t border-[#4d4732] p-4 flex flex-col gap-2 z-40">
        
        {/* Countdown timer bar */}
        <div className="w-full bg-[#201f1f] h-1.5 rounded-full overflow-hidden mb-1">
          <div
            className="bg-[#ffd700] h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          ></div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={handleReject}
            className="flex-1 py-4 bg-[#353534] text-[#d0c6ab] font-bold text-base rounded-xl border border-[#4d4732] hover:bg-[#424240] active:scale-95 transition-all flex justify-center items-center h-[56px] cursor-pointer"
          >
            거절 ({timeLeft}s)
          </button>

          <button
            onClick={handleAccept}
            className="flex-[2] py-4 bg-[#ffd700] hover:bg-[#ffe16d] text-[#3a3000] font-extrabold text-lg rounded-xl shadow-[0_4px_16px_rgba(255,215,0,0.3)] active:scale-95 transition-all flex justify-center items-center h-[56px] cursor-pointer relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined font-bold">call_made</span>
              수락하기
            </span>
          </button>
        </div>
      </div>

    </div>
  );
};
