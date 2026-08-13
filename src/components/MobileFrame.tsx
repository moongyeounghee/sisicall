import React from 'react';

interface Props {
  children: React.ReactNode;
  simulationTime: string;
}

export const MobileFrame: React.FC<Props> = ({ children, simulationTime }) => {
  const currentTime = simulationTime.slice(11, 16);

  // Frame View (Phone Shell Simulator)
  return (
    <div className="w-full flex-1 min-h-0 bg-[#0e0e0e] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Smartphone Body */}
      <div className="w-full max-w-[420px] h-full max-h-[850px] bg-[#1a1a1a] rounded-[48px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[3px] border-[#333333] flex flex-col relative overflow-hidden">
        
        {/* Hardware Notch / Dynamic Island */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[110px] h-[26px] bg-[#000000] rounded-full z-50 flex items-center justify-between px-2 shadow-inner pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-[#0a0a0a] border border-[#222]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#0a0f1d] border border-[#112233]"></div>
        </div>

        {/* Screen Bezel Content Area */}
        <div className="w-full h-full bg-[#131313] rounded-[38px] flex flex-col overflow-hidden relative border border-[#2a2a2a]">
          
          {/* Status Bar */}
          <div className="w-full bg-[#131313] px-6 pt-3 pb-1 flex justify-between items-center text-[12px] font-mono-num font-semibold text-[#e5e2e1] z-40 select-none">
            <span>{currentTime}</span>
            
            <div className="flex items-center gap-1.5 text-[11px] text-[#d0c6ab]">
              <span className="text-[9px] font-bold px-1 bg-[#1e95f2] text-white rounded">PWA</span>
              <span className="material-symbols-outlined text-[13px]">5g</span>
              <span className="material-symbols-outlined text-[13px]">location_on</span>
              <span className="material-symbols-outlined text-[15px] rotate-90">battery_full</span>
            </div>
          </div>

          {/* Actual Driver App Container */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
            {children}
          </div>

          {/* iOS / Android Bottom Home Indicator Bar */}
          <div className="w-full bg-[#131313] py-1.5 flex justify-center items-center z-40 select-none">
            <div className="w-32 h-1 bg-[#4d4732] rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
