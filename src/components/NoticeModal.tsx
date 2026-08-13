import React from 'react';

interface Props {
  onClose: () => void;
}

export const NoticeModal: React.FC<Props> = ({ onClose }) => {
  const notices = [
    {
      id: 1,
      title: '[안내] 2026 심야 시간대 특별 할증 정책 적용',
      date: '2026.08.12',
      content: '23:00 ~ 04:00 시간대 기본 할증율 20% ➔ 30%로 인상 적용됩니다.'
    },
    {
      id: 2,
      title: '[기사혜택] 전기차 충전소 전용 제휴 쿠폰 발급',
      date: '2026.08.10',
      content: '전기차 모드 사용 기사님 대상 급속 충전 20% 할인 쿠폰이 매월 지급됩니다.'
    },
    {
      id: 3,
      title: '[업데이트] PWA 앱 오프라인 캐시 및 햅틱 알림 시스템',
      date: '2026.08.01',
      content: '터널 및 지하주차장 등 네트워크 음영 지역에서도 신속한 응답이 유지됩니다.'
    }
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1c1b1b] border border-[#353534] rounded-2xl p-5 text-[#e5e2e1] max-h-[90vh] overflow-hidden flex flex-col justify-between shadow-2xl relative">
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#ffd700] flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill">campaign</span>
              기사 공지사항
            </h2>
            <button
              onClick={onClose}
              className="text-[#d0c6ab] hover:text-white p-1 rounded-full cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-3">
            {notices.map((notice) => (
              <div key={notice.id} className="bg-[#201f1f] p-4 rounded-xl border border-[#353534]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#1e95f2]">공지</span>
                  <span className="text-[11px] text-[#d0c6ab] font-mono-num">{notice.date}</span>
                </div>
                <h3 className="text-sm font-bold text-[#e5e2e1] mb-1">{notice.title}</h3>
                <p className="text-xs text-[#d0c6ab] leading-relaxed">{notice.content}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 mt-4 bg-[#2a2a2a] text-[#e5e2e1] font-bold rounded-xl text-sm border border-[#3d3d3d] cursor-pointer"
        >
          확인
        </button>

      </div>
    </div>
  );
};
