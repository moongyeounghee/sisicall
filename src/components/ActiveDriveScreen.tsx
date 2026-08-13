import React, { useState, useEffect } from 'react';
import { CallRequest } from '../types';
import { sounds } from '../utils/audio';
import { KakaoDriveMap } from './KakaoDriveMap';

interface Props {
  call: CallRequest;
  driverLatitude: number;
  driverLongitude: number;
  onFinishDrive: (earnedFare: number) => void;
  onCancelDrive: () => void;
}

export const ActiveDriveScreen: React.FC<Props> = ({ call, driverLatitude, driverLongitude, onFinishDrive, onCancelDrive }) => {
  const [driveStatus, setDriveStatus] = useState<'picking_up' | 'passenger_onboard' | 'completed'>('picking_up');
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [meterFare, setMeterFare] = useState<number>(4800);

  useEffect(() => {
    // Fare meter tick simulation
    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });

      if (driveStatus === 'passenger_onboard') {
        setMeterFare((prev) => Math.min(call.estFare, prev + 300));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [driveStatus, call.estFare]);

  const handleBoardPassenger = () => {
    sounds.playClick();
    setDriveStatus('passenger_onboard');
  };

  const handleCompleteRide = () => {
    sounds.playAcceptSound();
    setDriveStatus('completed');
  };

  const handleFinishAndCollect = () => {
    sounds.playAcceptSound();
    onFinishDrive(meterFare > 0 ? meterFare : call.estFare);
  };

  const displayedFare = driveStatus === 'picking_up' ? call.estFare : meterFare;

  return (
    <div className="absolute inset-0 z-50 bg-[#131313] text-[#e5e2e1] flex flex-col h-full overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* Top Header */}
      <header className="bg-[#1e95f2] text-white px-4 py-3 flex justify-between items-center z-10 shadow">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined icon-fill">navigation</span>
          <span className="font-bold text-lg">
            {driveStatus === 'picking_up'
              ? '승객 픽업 이동 중'
              : driveStatus === 'passenger_onboard'
              ? '목적지 운행 중'
              : '운행 완료'}
          </span>
        </div>
        <span className="bg-[#131313] text-[#ffd700] px-2.5 py-0.5 rounded-full text-xs font-mono-num font-bold border border-[#ffd700]">
          {call.callType}
        </span>
      </header>

      {/* Map canvas: automatically becomes a real Kakao Map when its SDK is connected. */}
      <div className="relative flex-1 bg-[#181818] overflow-hidden flex flex-col justify-between p-4">
        
        <KakaoDriveMap
          call={call}
          phase={driveStatus}
          driverLatitude={driverLatitude}
          driverLongitude={driverLongitude}
        />

        {/* Top Floating Turn-by-Turn Nav Box */}
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-3 shadow-xl z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1e95f2] text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-3xl">turn_right</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#d0c6ab]">
              {driveStatus === 'picking_up' ? '승객 위치로 이동' : '목적지로 이동'}
            </p>
            <h3 className="truncate text-lg font-bold text-[#e5e2e1]">
              {driveStatus === 'picking_up' ? call.originTitle : call.destTitle}
            </h3>
          </div>
        </div>

        {/* Compact fare panel kept near the bottom so the route remains visible. */}
        <div className="mt-auto flex items-center gap-3 rounded-xl border border-[#353534] bg-[#1c1b1b]/92 px-3 py-2 shadow-xl backdrop-blur z-10">
          <div className="shrink-0 text-left">
            <p className="text-xs font-mono-num text-[#d0c6ab]">
              {driveStatus === 'passenger_onboard' ? '실시간 요금' : '예상 결제'}
            </p>
            <p className="text-2xl font-extrabold font-mono-num leading-none text-[#ffd700]">
              ₩{displayedFare.toLocaleString()}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#353534]">
              <div
                className="h-full bg-[#1e95f2] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="truncate text-right text-xs font-bold text-[#d0c6ab]">
              {driveStatus === 'picking_up' ? call.originTitle : call.destTitle} 방면
            </p>
          </div>
        </div>

        {/* Bottom Passenger Info Sheet */}
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-4 shadow-xl z-10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#353534] flex items-center justify-center text-[#ffd700]">
                <span className="material-symbols-outlined icon-fill">person</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#e5e2e1]">승객 (일반 회원)</h4>
                <p className="text-xs text-[#d0c6ab]">안심번호 050-****-1234</p>
              </div>
            </div>

            <a
              href="tel:050-0000-0000"
              onClick={(e) => {
                e.preventDefault();
                alert('승객에게 안심번호 통화를 연결합니다.');
              }}
              className="w-10 h-10 rounded-full bg-[#353534] hover:bg-[#424240] flex items-center justify-center text-[#1e95f2] border border-[#4d4732]"
            >
              <span className="material-symbols-outlined icon-fill">call</span>
            </a>
          </div>

          {/* Context Action Buttons */}
          {driveStatus === 'picking_up' && (
            <div className="flex gap-2">
              <button
                onClick={onCancelDrive}
                className="flex-1 py-3 bg-[#2a2a2a] hover:bg-[#353534] text-[#d0c6ab] font-bold rounded-xl text-sm border border-[#3d3d3d]"
              >
                운행 취소
              </button>
              <button
                onClick={handleBoardPassenger}
                className="flex-[2] py-3 bg-[#ffd700] hover:bg-[#ffe16d] text-[#3a3000] font-extrabold rounded-xl text-base shadow-lg"
              >
                손님 탑승 완료
              </button>
            </div>
          )}

          {driveStatus === 'passenger_onboard' && (
            <button
              onClick={handleCompleteRide}
              className="w-full py-4 bg-[#ffd700] hover:bg-[#ffe16d] text-[#3a3000] font-extrabold rounded-xl text-lg shadow-xl"
            >
              목적지 도착 및 운행 종료
            </button>
          )}

          {driveStatus === 'completed' && (
            <div className="flex flex-col gap-2">
              <div className="bg-[#2a2a2a] p-3 rounded-xl text-center">
                <p className="text-xs text-[#d0c6ab]">결제 방법</p>
                <p className="text-sm font-bold text-[#ffd700]">카카오T 앱 자동 결제 완료</p>
              </div>
              <button
                onClick={handleFinishAndCollect}
                className="w-full py-4 bg-[#ffd700] hover:bg-[#ffe16d] text-[#3a3000] font-extrabold rounded-xl text-lg shadow-xl"
              >
                정산 및 대기 화면 복귀
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
