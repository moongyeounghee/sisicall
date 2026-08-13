import { RawCall } from '../types';

// Legacy export retained for components that may still import this module.
// The production demo now uses the 3,000-row development dataset.
export const INITIAL_CALL_REQUESTS: RawCall[] = [];

export const DESTINATION_BOOSTER_LOCATIONS = [
  { name: '서울 강남역', area: '강남/서초', demand: '매우 높음', surge: '1.4x' },
  { name: '경기도 판교역', area: '분당/판교', demand: '높음', surge: '1.2x' },
  { name: '홍대입구역', area: '마포/서대문', demand: '매우 높음', surge: '1.5x' },
  { name: '여의도역', area: '영등포', demand: '보통', surge: '1.0x' },
  { name: '인천국제공항', area: '인천/공항', demand: '높음', surge: '1.3x' },
  { name: '성수역', area: '성동구', demand: '높음', surge: '1.2x' }
];
