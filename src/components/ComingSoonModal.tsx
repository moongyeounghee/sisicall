interface Props {
  onClose: () => void;
}

export function ComingSoonModal({ onClose }: Props) {
  return (
    <div className="absolute inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-labelledby="coming-soon-title">
      <div className="w-full rounded-2xl border border-[#4d4732] bg-[#201f1f] p-6 text-center shadow-2xl">
        <span className="material-symbols-outlined text-5xl text-[#1e95f2]" aria-hidden="true">map</span>
        <h2 id="coming-soon-title" className="mt-3 text-2xl font-extrabold">수요지도</h2>
        <p className="mt-2 text-base leading-relaxed text-[#d0c6ab]">아직 구현 중입니다.<br />완성되는 대로 제공하겠습니다.</p>
        <button onClick={onClose} autoFocus className="mt-6 w-full min-h-14 rounded-xl bg-[#ffd700] text-lg font-extrabold text-[#3a3000]">확인</button>
      </div>
    </div>
  );
}
