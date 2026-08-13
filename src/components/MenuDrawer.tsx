import React from 'react';

interface Props {
  onClose: () => void;
  onOpenModeSettings: () => void;
  onOpenStats: () => void;
  onOpenPwaModal: () => void;
}

export const MenuDrawer: React.FC<Props> = ({
  onClose,
  onOpenModeSettings,
  onOpenStats,
  onOpenPwaModal
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-[#1c1b1b] h-full p-5 text-[#e5e2e1] flex flex-col justify-between shadow-2xl border-l border-[#353534]">
        
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#ffd700]">기사 메뉴</h2>
            <button onClick={onClose} className="text-[#d0c6ab] hover:text-white p-1 rounded-full cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-[#201f1f] border border-[#353534] p-4 rounded-xl flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#ffd700] text-[#3a3000] font-extrabold flex items-center justify-center text-lg shadow">
              홍
            </div>
            <div>
              <p className="font-bold text-sm text-[#e5e2e1]">홍길동 기사님</p>
              <p className="text-xs text-[#ffd700] font-mono-num">서울 34 바 1234 (개인택시)</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 text-sm">
            <button
              onClick={() => {
                onClose();
                onOpenModeSettings();
              }}
              className="w-full text-left p-3 rounded-xl bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffd700]">tune</span>
                모드 선택
              </span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenStats();
              }}
              className="w-full text-left p-3 rounded-xl bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1e95f2]">query_stats</span>
                오늘 운행 실적
              </span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenPwaModal();
              }}
              className="w-full text-left p-3 rounded-xl bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffd700]">get_app</span>
                PWA 모바일 앱 정보
              </span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#2a2a2a] text-center text-xs text-[#d0c6ab]">
          <p>택시 기사 PWA v2.4.0</p>
          <p className="mt-0.5 text-[10px]">PWA Service Worker Operational</p>
        </div>

      </div>
    </div>
  );
};
