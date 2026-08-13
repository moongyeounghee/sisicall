import { useId, useState } from 'react';

interface Props {
  score: number;
  reasons: string[];
  warnings?: string[];
  compact?: boolean;
  dense?: boolean;
}

export function RecommendationScore({ score, reasons, warnings = [], compact = false, dense = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();
  const showFloatingDetails = compact && !dense;

  return (
    <div className={`relative shrink-0 rounded-xl border border-[#4d4732] bg-[#201f1f] ${showFloatingDetails ? 'overflow-visible' : 'overflow-hidden'} ${isOpen && showFloatingDetails ? 'z-40' : ''}`}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={detailsId}
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full flex items-center justify-between gap-3 text-left ${dense ? 'px-3 py-2' : compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}
      >
        <span>
          <span className={`${dense || compact ? 'text-sm' : 'text-base'} block font-extrabold text-[#e5e2e1]`}>{dense ? 'AI 추천' : 'AI 추천 점수'}</span>
          {!dense && <span className="text-sm text-[#d0c6ab]">눌러서 추천 이유 보기</span>}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <strong className={`${dense ? 'text-xl' : compact ? 'text-2xl' : 'text-3xl'} font-black font-mono-num text-[#ffd700]`}>{Math.round(score)}점</strong>
          <span className="material-symbols-outlined text-[#ffd700]" aria-hidden="true">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </span>
      </button>

      {isOpen && (
        <div id={detailsId} className={`${showFloatingDetails ? 'absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl border border-[#4d4732] bg-[#201f1f] shadow-2xl' : 'border-t border-[#4d4732]'} ${dense ? 'px-3 py-2 space-y-1' : 'px-4 py-3 space-y-2'}`} role="region" aria-label="AI 추천 이유">
          {reasons.slice(0, 3).map((reason) => (
            <p key={reason} className="text-sm leading-relaxed flex items-start gap-2 text-[#e5e2e1]">
              <span className="material-symbols-outlined text-[20px] text-[#5ed18b] mt-0.5" aria-hidden="true">check_circle</span>
              <span>{reason}</span>
            </p>
          ))}
          {warnings.slice(0, 2).map((warning) => (
            <p key={warning} className="text-sm leading-relaxed flex items-start gap-2 text-[#ffcf9d]">
              <span className="material-symbols-outlined text-[20px] mt-0.5" aria-hidden="true">warning</span>
              <span>{warning}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
