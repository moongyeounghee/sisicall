import React, { useRef } from 'react';
import { SimulationState } from '../services/simulationEngine';

interface Props {
  simulation: SimulationState;
  onSimulationTimeChange: (value: string) => void;
  isDriving: boolean;
}

export const PwaDemoHeader: React.FC<Props> = ({
  simulation,
  onSimulationTimeChange,
  isDriving,
}) => {
  const timeInputRef = useRef<HTMLInputElement>(null);

  const openTimePicker = () => {
    const input = timeInputRef.current;
    if (!input || isDriving) return;
    try {
      input.showPicker?.();
    } catch {
      input.focus();
    }
  };

  return (
    <div className="z-50 shrink-0 border-b border-[#3c3521] bg-[#181818] px-3 py-2 text-[#e5e2e1] shadow-md">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-xl border-2 border-[#ffd700] bg-[#2a260d] p-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined text-2xl text-[#ffd700]">schedule</span>
          <div>
            <p className="text-sm font-extrabold text-[#ffe88b]">시뮬레이션 가상 시각</p>
            <p className="max-w-[230px] truncate text-xs text-[#d0c6ab]">현재 위치 · {simulation.locationName}</p>
          </div>
        </div>
        <input
          ref={timeInputRef}
          type="datetime-local"
          value={simulation.currentTime}
          onChange={(event) => onSimulationTimeChange(event.target.value)}
          disabled={isDriving}
          className="min-h-11 min-w-[205px] rounded-lg border border-[#8a7400] bg-[#101010] px-3 text-base font-extrabold text-white outline-none [color-scheme:dark] focus:border-[#ffd700] disabled:opacity-50"
          aria-label="시뮬레이션 가상 시각 설정"
        />
        <button
          type="button"
          onClick={openTimePicker}
          disabled={isDriving}
          className="flex min-h-11 items-center gap-1.5 rounded-lg bg-[#ffd700] px-4 text-sm font-black text-[#3a3000] shadow-lg disabled:bg-[#5b5640] disabled:text-[#aaa28e]"
        >
          <span className="material-symbols-outlined text-xl">edit_calendar</span>
          {isDriving ? '운행 중 변경 불가' : '시간 변경'}
        </button>
      </div>
    </div>
  );
};
