# sisicall 기사앱

기사의 현재 위치, 운행 목적, 차량 조건에 따라 주변 콜을 다시 선별하는 택시 기사용 PWA 데모입니다. 수익 최대화보다 **지금 원하는 운행 방식에 맞는 콜만 보여주는 것**에 초점을 맞췄습니다.

## 주요 기능

- 일반·귀가·장거리·단거리·전기차 운행 모드
- 서울 출발, 서울·경기·인천 도착 기준 합성 콜 3,000건
- 모드별 적합성 판정, 추천 순위와 설명 가능한 AI 점수
- 콜 수락부터 승객 탑승·목적지 도착·정산까지 이어지는 시뮬레이션
- 운행 완료 후 기사 위치와 가상 시각 자동 변경
- 가상 날짜 변경 시 일일 수익·완료 건수·활동 시간·수락률 초기화
- 카카오맵과 카카오모빌리티 자동차 길찾기 기반 실제 도로 경로 표시
- 모바일 프레임 중심의 고가독성 UI와 설치형 PWA

## 기술 구성

- React 19, TypeScript, Vite, Tailwind CSS
- Kakao Maps JavaScript SDK
- Kakao Mobility 자동차 길찾기 REST API
- Vercel Function: `api/directions.ts`
- 브라우저 저장소: 모드, 시뮬레이션 위치·시각, 통계, 학습 이력

## 로컬 실행

Node.js 20 이상을 권장합니다.

```bash
npm install
```

`.env.example`을 참고해 프로젝트 루트에 `.env.local`을 만들고 키를 입력합니다.

```env
KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY
VITE_KAKAO_MAP_KEY=YOUR_KAKAO_JAVASCRIPT_KEY
```

두 키의 성격이 다릅니다. `KAKAO_REST_API_KEY`는 `/api/directions` 안에서만 쓰이므로 브라우저로 내려가지 않습니다. `VITE_KAKAO_MAP_KEY`는 지도를 브라우저가 직접 그리기 때문에 공개되며, 도용은 카카오 개발자 콘솔의 도메인 등록으로 막습니다. 값을 비워두면 지도 자리에 "카카오맵 연결 대기" 화면이 표시되고 나머지 기능은 그대로 동작합니다.

```bash
npm run dev
```

기본 주소는 `http://localhost:3000`입니다. `.env.local`은 Git에 포함되지 않습니다.

## 검증과 빌드

```bash
npm run lint
npm run test:logic
npm run build
npm run preview
```

`npm run build`는 GitHub/Vercel 공유용 프로덕션 빌드를 생성합니다.

## Vercel 배포

1. 이 폴더를 GitHub 저장소에 푸시합니다.
2. Vercel에서 해당 저장소를 Import합니다.
3. Project Settings → Environment Variables에 `KAKAO_REST_API_KEY`와 `VITE_KAKAO_MAP_KEY`를 추가합니다.
4. Production에 적용하고, Preview에서도 경로를 테스트한다면 Preview에도 적용합니다.
5. 환경변수를 추가하거나 바꾼 뒤에는 Deployments에서 **Redeploy**를 한 번 눌러야 반영됩니다.
6. 카카오디벨로퍼스의 JavaScript 키 설정에 Vercel 운영 도메인을 추가합니다.

```text
https://YOUR_PROJECT.vercel.app
```

사용자 지정 도메인이 있다면 해당 `https://` 주소도 추가합니다. REST API 키에는 웹 도메인을 등록하지 않으며, 절대로 `VITE_` 접두사를 붙이거나 프런트엔드 코드에 넣지 않습니다.

`vercel.json`이 Vite 빌드 출력과 Vercel Function 구성을 사용하도록 설정되어 있습니다.

## GitHub에 처음 올리기

```bash
git init
git add .
git commit -m "Initial sisicall release"
git branch -M main
git remote add origin https://github.com/USER/REPOSITORY.git
git push -u origin main
```

공유용 폴더에는 `.git`이 이미 준비되어 있을 수 있습니다. 이 경우 `git init`, `git add`, `git commit`은 생략하고 원격 저장소만 연결하면 됩니다.

```bash
git remote add origin https://github.com/USER/REPOSITORY.git
git push -u origin main
```

## 추천 로직

- 일반 모드: 전체 주변 콜을 픽업 편의·수요·시간 효율로 정렬
- 귀가 모드: 자택 방향, 운행 후 자택까지 거리, 희망 종료 시각
- 장거리 모드: 운행 거리, 간선·고속도로 비중, 복귀 부담
- 단거리 모드: 짧은 운행 거리, 가까운 픽업, 빠른 회전
- 전기차 모드: 운행 후 배터리, 충전소 접근성, 안전 잔량

추천 엔진은 `src/services/recommendationEngine.ts`, 시뮬레이션은 `src/services/simulationEngine.ts`, 길찾기 프록시는 `api/directions.ts`에서 확인할 수 있습니다.

## 보안 확인

- REST API 키는 `.env.local` 또는 Vercel 환경변수에만 저장합니다.
- `.env`, `.env.local`, Vercel 로컬 설정, 빌드 결과와 `node_modules`는 Git에서 제외됩니다.
- 카카오 JavaScript 키는 브라우저용 공개 식별자이며, 카카오디벨로퍼스에서 허용 도메인을 제한해야 합니다.
