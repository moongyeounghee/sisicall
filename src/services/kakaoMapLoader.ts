// 카카오맵 SDK 로더 — 앱 키를 환경변수에서 읽어 필요할 때 한 번만 불러온다

declare global {
  interface Window {
    kakao?: { maps?: any };
  }
}

let pendingLoad: Promise<any | null> | null = null;

/**
 * 카카오맵 maps 객체를 돌려준다.
 * VITE_KAKAO_MAP_KEY가 없거나 SDK를 불러오지 못하면 null이다.
 */
export function loadKakaoMaps(): Promise<any | null> {
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps);
  if (pendingLoad) return pendingLoad;

  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!appKey) return Promise.resolve(null);

  pendingLoad = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        resolve(null);
        return;
      }
      if (typeof maps.load === 'function') maps.load(() => resolve(maps));
      else resolve(maps);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return pendingLoad;
}
