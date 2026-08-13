import { useEffect, useRef, useState } from 'react';
import { CallRequest } from '../types';
import { fetchRoadRoute } from '../services/directionsService';
import { loadKakaoMaps } from '../services/kakaoMapLoader';

interface Props {
  call: CallRequest;
  phase: 'picking_up' | 'passenger_onboard' | 'completed';
  driverLatitude: number;
  driverLongitude: number;
}

export function KakaoDriveMap({ call, phase, driverLatitude, driverLongitude }: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [routeStatus, setRouteStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    if (!mapElement.current) return;
    const controller = new AbortController();
    let disposed = false;

    const renderMap = async (maps: any) => {
      if (!mapElement.current) return;
      setRouteStatus('loading');

      const isPickingUp = phase === 'picking_up';
      const originCoordinates = isPickingUp
        ? { latitude: driverLatitude, longitude: driverLongitude }
        : { latitude: call.originLat, longitude: call.originLng };
      const destinationCoordinates = isPickingUp
        ? { latitude: call.originLat, longitude: call.originLng }
        : { latitude: call.destLat, longitude: call.destLng };
      const origin = new maps.LatLng(originCoordinates.latitude, originCoordinates.longitude);
      const destination = new maps.LatLng(destinationCoordinates.latitude, destinationCoordinates.longitude);
      const map = new maps.Map(mapElement.current, { center: origin, level: 7 });
      new maps.Marker({ map, position: origin });
      new maps.Marker({ map, position: destination });
      const bounds = new maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.setBounds(bounds, 48, 48, 48, 48);
      setIsConnected(true);

      try {
        const route = await fetchRoadRoute(originCoordinates, destinationCoordinates, controller.signal);
        if (disposed) return;
        const path = route.points.map((point) => new maps.LatLng(point.latitude, point.longitude));
        new maps.Polyline({
          map,
          path,
          strokeWeight: 10,
          strokeColor: '#17212b',
          strokeOpacity: 0.5,
        });
        new maps.Polyline({
          map,
          path,
          strokeWeight: 6,
          strokeColor: '#1e95f2',
          strokeOpacity: 1,
        });
        const routeBounds = new maps.LatLngBounds();
        path.forEach((point) => routeBounds.extend(point));
        map.setBounds(routeBounds, 64, 64, 64, 64);
        setRouteStatus('ready');
      } catch (error) {
        if (controller.signal.aborted || disposed) return;
        console.error('Road route rendering failed', error);
        setRouteStatus('failed');
      }
    };

    void loadKakaoMaps().then((maps) => {
      if (!maps || disposed) return;
      void renderMap(maps);
    });

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [call.destLat, call.destLng, call.originLat, call.originLng, driverLatitude, driverLongitude, phase]);

  return (
    <div className="absolute inset-0" aria-label="운행 경로 지도">
      <div
        id="kakao-drive-map"
        ref={mapElement}
        className="absolute inset-0"
        data-origin={`${call.originLat},${call.originLng}`}
        data-destination={`${call.destLat},${call.destLng}`}
      />
      {isConnected && (
        <div className="absolute left-3 top-24 rounded-full border border-[#353534] bg-[#131313]/90 px-3 py-1.5 text-xs font-bold shadow-lg">
          {routeStatus === 'loading' && <span className="text-[#d0c6ab]">도로 경로 확인 중</span>}
          {routeStatus === 'ready' && <span className="text-[#72d58c]">실제 도로 경로</span>}
          {routeStatus === 'failed' && <span className="text-[#ffb4ab]">경로를 불러오지 못했습니다</span>}
        </div>
      )}
      {!isConnected && (
        <div className="absolute inset-0 kakao-map-placeholder overflow-hidden">
          <div className="absolute left-[12%] top-[68%] w-[62%] h-2 rounded-full bg-[#1e95f2] rotate-[-28deg] shadow-[0_0_18px_rgba(30,149,242,0.65)]" />
          <div className="absolute left-[11%] top-[67%] w-5 h-5 rounded-full bg-[#1e95f2] border-4 border-white shadow-lg" />
          <div className="absolute right-[22%] top-[34%] w-6 h-6 rounded-full bg-[#ffd700] border-4 border-[#3a3000] shadow-lg" />
          <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-[#131313]/85 border border-[#353534] px-3 py-2 text-center">
            <p className="text-sm font-bold text-[#e5e2e1]">카카오맵 연결 대기</p>
            <p className="text-xs text-[#d0c6ab]">Kakao Developers에 현재 사이트 도메인을 등록하면 실제 지도로 자동 전환됩니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
