import React, { useState } from 'react';
import { DESTINATION_BOOSTER_LOCATIONS } from '../data/mockCalls';
import { sounds } from '../utils/audio';

interface Props {
  currentTarget: string | null;
  onSetBooster: (target: string | null) => void;
  onClose: () => void;
}

export const BoosterModal: React.FC<Props> = ({ currentTarget, onSetBooster, onClose }) => {
  const [selected, setSelected] = useState<string | null>(currentTarget);

  const handleSelect = (name: string) => {
    sounds.playClick();
    if (selected === name) {
      setSelected(null);
    } else {
      setSelected(name);
    }
  };

  const handleApply = () => {
    sounds.playAcceptSound();
    onSetBooster(selected);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1c1b1b] border border-[#353534] rounded-t-2xl sm:rounded-2xl p-5 text-[#e5e2e1] max-h-[90vh] overflow-hidden flex flex-col justify-between shadow-2xl">
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#ffd700] flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill">favorite</span>
              목적지 부스터 설정
            </h2>
            <button
              onClick={onClose}
              className="text-[#d0c6ab] hover:text-white p-1 rounded-full cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <p className="text-xs text-[#d0c6ab] mb-4">
            선호하는 목적지를 설정하면 해당 지역 방향으로 이동하는 승객의 콜을 우선 배차받습니다.
          </p>

          <div className="space-y-2.5">
            {DESTINATION_BOOSTER_LOCATIONS.map((loc) => {
              const isChosen = selected === loc.name;
              return (
                <div
                  key={loc.name}
                  onClick={() => handleSelect(loc.name)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChosen
                      ? 'bg-[#2a2a2a] border-[#ffd700] text-[#ffd700]'
                      : 'bg-[#201f1f] border-[#353534] hover:bg-[#282828] text-[#e5e2e1]'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">{loc.name}</p>
                    <p className="text-xs text-[#d0c6ab]">{loc.area} • 수요 {loc.demand}</p>
                  </div>
                  <div className="flex items-center gap-2 font-mono-num">
                    <span className="text-xs bg-[#ffd700]/10 text-[#ffd700] px-2 py-0.5 rounded border border-[#ffd700]/30 font-bold">
                      {loc.surge}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isChosen ? 'border-[#ffd700] bg-[#ffd700]' : 'border-[#666666]'
                      }`}
                    >
                      {isChosen && <span className="material-symbols-outlined text-[#3a3000] text-sm font-bold">check</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-[#2a2a2a]">
          <button
            onClick={() => {
              setSelected(null);
              onSetBooster(null);
              onClose();
            }}
            className="flex-1 py-3 bg-[#2a2a2a] text-[#d0c6ab] font-bold rounded-xl text-sm border border-[#3d3d3d] cursor-pointer"
          >
            해제하기
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] py-3 bg-[#ffd700] text-[#3a3000] font-extrabold rounded-xl text-sm shadow-lg cursor-pointer"
          >
            부스터 적용하기
          </button>
        </div>

      </div>
    </div>
  );
};
