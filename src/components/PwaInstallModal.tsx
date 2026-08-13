import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface Props {
  onClose: () => void;
}

export const PwaInstallModal: React.FC<Props> = ({ onClose }) => {
  const [installedState, setInstalledState] = useState<boolean>(false);

  const handleSimulateInstall = () => {
    sounds.playAcceptSound();
    setInstalledState(true);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1c1b1b] border border-[#ffd700]/30 rounded-2xl p-5 text-[#e5e2e1] max-h-[90vh] overflow-hidden flex flex-col justify-between shadow-2xl relative">
        
        <div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#d0c6ab] hover:text-white p-1 rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="flex items-center gap-2 text-[#ffd700] mb-2">
            <span className="material-symbols-outlined text-3xl icon-fill">phone_iphone</span>
            <h2 className="text-xl font-extrabold text-[#ffd700]">PWA (Progressive Web App)</h2>
          </div>

          <p className="text-sm font-bold text-[#e5e2e1] mb-2">
            웹 브라우저에서 모바일 앱처럼 설치하고 동작합니다
          </p>

          <p className="text-xs text-[#d0c6ab] leading-relaxed mb-4">
            앱스토어 다운로드 없이 웹 URL 접근만으로 스마트폰 홈 화면에 아이콘을 생성하고 모바일 앱과 100% 동일한 Full-Screen 경험을 제공합니다.
          </p>

          {/* PWA Feature Highlights */}
          <div className="space-y-2.5 mb-6 text-xs">
            <div className="bg-[#201f1f] p-3 rounded-xl border border-[#353534] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ffd700]">fullscreen</span>
              <div>
                <p className="font-bold text-[#e5e2e1]">전체화면 디스플레이 (Standalone)</p>
                <p className="text-[#d0c6ab]">브라우저 주소창 없이 네이티브 앱 UX 구현</p>
              </div>
            </div>

            <div className="bg-[#201f1f] p-3 rounded-xl border border-[#353534] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1e95f2]">wifi_off</span>
              <div>
                <p className="font-bold text-[#e5e2e1]">Service Worker 오프라인 캐싱</p>
                <p className="text-[#d0c6ab]">네트워크 불안정 시에도 핵심 기능 즉시 응답</p>
              </div>
            </div>

            <div className="bg-[#201f1f] p-3 rounded-xl border border-[#353534] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ffd700]">vibration</span>
              <div>
                <p className="font-bold text-[#e5e2e1]">푸시 알림 및 오디오/진동 피드백</p>
                <p className="text-[#d0c6ab]">콜 수신 시 실시간 알림음 및 햅틱 진동 연동</p>
              </div>
            </div>
          </div>

          {/* Platform Specific Instructions */}
          <div className="bg-[#121212] p-3 rounded-xl border border-[#2a2a2a] text-xs text-[#d0c6ab] mb-6 space-y-1">
            <p className="font-bold text-[#ffd700] text-[11px] uppercase">실제 모바일 기기 설치 가이드:</p>
            <p>• <strong>iOS Safari:</strong> 공유 버튼 아이콘 클릭 ➔ [홈 화면에 추가] 선택</p>
            <p>• <strong>Android Chrome:</strong> 메뉴 버튼 클릭 ➔ [앱 설치] 또는 [홈 화면에 추가] 선택</p>
          </div>
        </div>

        {installedState ? (
          <div className="bg-[#1e95f2]/20 border border-[#1e95f2] text-[#1e95f2] p-3 rounded-xl text-center font-bold text-sm">
            ✓ PWA 앱 설치 시뮬레이션 완료!
          </div>
        ) : (
          <button
            onClick={handleSimulateInstall}
            className="w-full py-3.5 bg-[#ffd700] hover:bg-[#ffe16d] text-[#3a3000] font-extrabold text-base rounded-xl shadow-lg cursor-pointer transition-all active:scale-98"
          >
            홈 화면에 PWA 앱 추가 시뮬레이션
          </button>
        )}

      </div>
    </div>
  );
};
