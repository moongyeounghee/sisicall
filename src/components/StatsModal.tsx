import React from 'react';
import { DriverStats } from '../types';

interface Props {
  stats: DriverStats;
  onClose: () => void;
}

export const StatsModal: React.FC<Props> = ({ stats, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1c1b1b] border border-[#353534] rounded-2xl p-6 text-[#e5e2e1] max-h-[90vh] overflow-hidden flex flex-col justify-between shadow-2xl relative">
        
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-[#ffd700] flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill">query_stats</span>
              오늘 운행 실적
            </h2>
            <button
              onClick={onClose}
              className="text-[#d0c6ab] hover:text-white p-1 rounded-full cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Earnings Highlight Box */}
          <div className="bg-[#201f1f] border border-[#ffd700]/30 rounded-xl p-5 text-center mb-5 shadow-inner">
            <p className="text-xs text-[#d0c6ab] font-mono-num mb-1">총 수입 금액</p>
            <p className="text-3xl font-extrabold font-mono-num text-[#ffd700]">
              ₩{stats.todayEarnings.toLocaleString()}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#201f1f] p-3.5 rounded-xl border border-[#353534] text-center">
              <p className="text-xs text-[#d0c6ab]">완료 건수</p>
              <p className="text-xl font-bold font-mono-num text-[#e5e2e1] mt-1">{stats.completedTrips} 건</p>
            </div>

            <div className="bg-[#201f1f] p-3.5 rounded-xl border border-[#353534] text-center">
              <p className="text-xs text-[#d0c6ab]">총 운행 시간</p>
              <p className="text-xl font-bold font-mono-num text-[#1e95f2] mt-1">{stats.activeHours} 시간</p>
            </div>

            <div className="bg-[#201f1f] p-3.5 rounded-xl border border-[#353534] text-center">
              <p className="text-xs text-[#d0c6ab]">콜 수락률</p>
              <p className="text-xl font-bold font-mono-num text-[#ffd700] mt-1">{stats.acceptanceRate}%</p>
            </div>

            <div className="bg-[#201f1f] p-3.5 rounded-xl border border-[#353534] text-center">
              <p className="text-xs text-[#d0c6ab]">응답한 콜</p>
              <p className="text-xl font-bold font-mono-num text-[#e5e2e1] mt-1">{stats.acceptedCalls + stats.rejectedCalls} 건</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-[#2a2a2a] text-[#e5e2e1] font-bold rounded-xl text-sm border border-[#3d3d3d] cursor-pointer"
        >
          닫기
        </button>

      </div>
    </div>
  );
};
