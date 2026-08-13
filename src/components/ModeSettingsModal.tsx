import React, { useMemo, useState } from 'react';
import { DriverPreferences, OperationMode } from '../types';
import { MODE_META } from '../services/recommendationEngine';
import { sounds } from '../utils/audio';

interface Props {
  activeMode: OperationMode;
  preferences: DriverPreferences;
  onSaveMode: (mode: OperationMode, preferences: DriverPreferences) => void;
  onClose: () => void;
}

const MODES: OperationMode[] = ['normal', 'home', 'long', 'short', 'ev'];
const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = ['00', '10', '20', '30', '40', '50'];

function from24Hour(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return {
    period: hours < 12 ? '오전' : '오후',
    hour: hours % 12 || 12,
    minute: Math.round(minutes / 10) * 10 % 60,
  } as const;
}

function to24Hour(period: '오전' | '오후', hour: number, minute: number) {
  const hours = period === '오전' ? hour % 12 : hour % 12 + 12;
  return `${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export const ModeSettingsModal: React.FC<Props> = ({ activeMode, preferences, onSaveMode, onClose }) => {
  const [selectedMode, setSelectedMode] = useState<OperationMode>(activeMode);
  const [draft, setDraft] = useState<DriverPreferences>(preferences);
  const selectedTime = useMemo(() => from24Hour(draft.desiredEndTime), [draft.desiredEndTime]);

  const selectMode = (mode: OperationMode) => {
    sounds.playClick();
    setSelectedMode(mode);
  };

  const updateNumber = (key: keyof DriverPreferences, value: number) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const updateTime = (period: '오전' | '오후', hour: number, minute: number) => {
    setDraft((previous) => ({ ...previous, desiredEndTime: to24Hour(period, hour, minute) }));
  };

  const apply = () => {
    sounds.playAcceptSound();
    onSaveMode(selectedMode, draft);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#131313] text-[#e5e2e1] flex flex-col h-full overflow-hidden select-none">
      <header className="border-b border-[#353534] flex items-center justify-between px-4 min-h-16 shrink-0">
        <button onClick={onClose} className="text-[#d0c6ab] p-2 rounded-full" aria-label="뒤로">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </button>
        <div className="text-center">
          <h1 className="text-xl font-extrabold">모드 선택</h1>
          <p className="text-sm text-[#b8b09a]">원하는 운행 방식을 선택하세요</p>
        </div>
        <span className="material-symbols-outlined text-3xl text-[#ffd700]">tune</span>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden p-3 pb-24">
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((mode) => {
            const meta = MODE_META[mode];
            const selected = selectedMode === mode;
            return (
              <button
                type="button"
                key={mode}
                onClick={() => selectMode(mode)}
                className={`text-center p-2 rounded-xl border min-h-[76px] transition-all ${
                  selected
                    ? 'bg-[#29281f] border-[#ffd700] shadow-[0_0_16px_rgba(255,215,0,0.14)]'
                    : 'bg-[#1c1b1b] border-[#3d3d3d]'
                }`}
              >
                <div className="flex justify-center">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? 'bg-[#ffd700] text-[#3a3000]' : 'bg-[#2a2a2a] text-[#d0c6ab]'}`}>
                    <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                  </span>
                </div>
                <p className="font-extrabold mt-1.5 text-sm">{meta.shortLabel}</p>
              </button>
            );
          })}
        </div>

        <section className="mt-3 bg-[#1c1b1b] border border-[#353534] rounded-2xl p-3">
          <div className="mb-3">
            <p className="text-base font-extrabold">{MODE_META[selectedMode].shortLabel} 조건</p>
            <p className="text-xs text-[#b8b09a]">변경한 값은 확인을 누르면 적용됩니다.</p>
          </div>

          {selectedMode === 'normal' && (
            <div className="rounded-xl bg-[#1e95f2]/10 border border-[#1e95f2]/30 p-4 flex gap-3">
              <span className="material-symbols-outlined text-2xl text-[#72d6ff]">visibility</span>
              <p className="text-base leading-relaxed text-[#d7efff]">별도 선호 조건을 적용하지 않고 주변 콜을 모두 보여줍니다.</p>
            </div>
          )}

          {selectedMode === 'home' && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-base font-bold text-[#d0c6ab]">자택 위치</span>
                <input
                  value={draft.homeLocationName}
                  onChange={(event) => setDraft((previous) => ({ ...previous, homeLocationName: event.target.value }))}
                  className="mt-2 w-full min-h-12 bg-[#131313] border border-[#4d4732] rounded-xl px-4 py-3 text-base outline-none focus:border-[#ffd700]"
                />
              </label>

              <div>
                <p className="text-base font-bold text-[#d0c6ab]">희망 운행 종료 시각</p>
                <div className="mt-2 grid grid-cols-[1.25fr_1fr_1fr] gap-2" aria-label="희망 운행 종료 시각 다이얼">
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#131313] border border-[#4d4732] p-1">
                    {(['오전', '오후'] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => updateTime(period, selectedTime.hour, selectedTime.minute)}
                        className={`min-h-12 rounded-lg text-base font-extrabold ${selectedTime.period === period ? 'bg-[#ffd700] text-[#3a3000]' : 'text-[#d0c6ab]'}`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                  <label className="relative">
                    <span className="sr-only">시간</span>
                    <select
                      aria-label="희망 종료 시간"
                      value={selectedTime.hour}
                      onChange={(event) => updateTime(selectedTime.period, Number(event.target.value), selectedTime.minute)}
                      className="w-full min-h-14 appearance-none rounded-xl bg-[#131313] border border-[#4d4732] px-3 text-center text-xl font-black text-[#ffd700] outline-none focus:border-[#ffd700]"
                    >
                      {HOURS.map((hour) => <option key={hour} value={hour}>{hour}시</option>)}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-2 top-4 text-[#d0c6ab]">expand_more</span>
                  </label>
                  <label className="relative">
                    <span className="sr-only">분</span>
                    <select
                      aria-label="희망 종료 분"
                      value={String(selectedTime.minute).padStart(2, '0')}
                      onChange={(event) => updateTime(selectedTime.period, selectedTime.hour, Number(event.target.value))}
                      className="w-full min-h-14 appearance-none rounded-xl bg-[#131313] border border-[#4d4732] px-3 text-center text-xl font-black text-[#ffd700] outline-none focus:border-[#ffd700]"
                    >
                      {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}분</option>)}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-2 top-4 text-[#d0c6ab]">expand_more</span>
                  </label>
                </div>
                <p className="mt-2 text-sm text-[#b8b09a]">각 칸을 누르면 휴대폰 다이얼로 선택할 수 있습니다.</p>
              </div>
            </div>
          )}

          {selectedMode === 'long' && (
            <RangeSetting label="최대 운행 가능 시간" value={draft.maxDrivingMinutes} min={45} max={180} step={15} suffix="분" onChange={(value) => updateNumber('maxDrivingMinutes', value)} />
          )}

          {selectedMode === 'short' && (
            <RangeSetting label="선호 최대 운행 거리" value={draft.maxShortTripKm} min={3} max={15} step={1} suffix="km" onChange={(value) => updateNumber('maxShortTripKm', value)} />
          )}

          {selectedMode === 'ev' && (
            <div className="space-y-6">
              <RangeSetting label="현재 배터리" value={draft.batteryLevel} min={10} max={100} step={1} suffix="%" onChange={(value) => updateNumber('batteryLevel', value)} />
              <RangeSetting label="안전 잔여 배터리" value={draft.safetyReserve} min={5} max={30} step={1} suffix="%" onChange={(value) => updateNumber('safetyReserve', value)} />
              <div className="bg-[#93000a]/15 border border-[#ffb4ab]/25 rounded-xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-2xl text-[#ffb4ab]">verified_user</span>
                <p className="text-sm text-[#ffdad6] leading-relaxed">운행 후 예상 배터리가 안전 잔량보다 낮거나 충전소가 없으면 자동 제외됩니다.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <div className="absolute bottom-0 left-0 w-full bg-[#201f1f] border-t border-[#353534] p-4 flex gap-3">
        <button onClick={onClose} className="flex-1 min-h-14 rounded-xl text-base font-bold bg-[#2c2c2c] border border-[#444]">취소</button>
        <button onClick={apply} className="flex-[2] min-h-14 rounded-xl text-lg font-extrabold text-[#3a3000] bg-[#ffd700] shadow-lg">확인</button>
      </div>
    </div>
  );
};

interface RangeSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}

const RangeSetting: React.FC<RangeSettingProps> = ({ label, value, min, max, step, suffix, onChange }) => (
  <label className="block">
    <span className="flex justify-between items-center text-base text-[#d0c6ab]">
      <span className="font-bold">{label}</span>
      <span className="flex items-center text-[#ffd700] font-mono-num font-bold">
        <input aria-label={`${label} 직접 입력`} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value))))} className="w-16 min-h-11 bg-[#131313] rounded-lg text-right px-2 text-lg text-[#ffd700] outline-none border border-[#4d4732] focus:border-[#ffd700]" />
        <span className="ml-1">{suffix}</span>
      </span>
    </span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full mt-4 h-3 accent-[#ffd700]" />
    <span className="mt-2 flex justify-between text-sm text-[#8f8877]"><span>{min}{suffix}</span><span>{max}{suffix}</span></span>
  </label>
);
