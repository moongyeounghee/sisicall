import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

function kakaoDirectionsDevProxy(restKey: string): Plugin {
  return {
    name: 'sisicall-kakao-directions-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/directions', async (request, response, next) => {
        if (request.method !== 'GET') return next();
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.setHeader('cache-control', 'no-store');

        if (!restKey) {
          response.statusCode = 503;
          response.end(JSON.stringify({ error: 'Set KAKAO_REST_API_KEY in .env.local.' }));
          return;
        }

        const requestUrl = new URL(request.url ?? '/', 'http://localhost');
        const params = requestUrl.searchParams;
        const kakaoUrl = new URL('https://apis-navi.kakaomobility.com/v1/directions');
        kakaoUrl.searchParams.set('origin', `${params.get('originLng')},${params.get('originLat')}`);
        kakaoUrl.searchParams.set('destination', `${params.get('destLng')},${params.get('destLat')}`);
        kakaoUrl.searchParams.set('priority', 'RECOMMEND');
        kakaoUrl.searchParams.set('summary', 'false');

        try {
          const upstream = await fetch(kakaoUrl, {
            headers: { Authorization: `KakaoAK ${restKey}`, Accept: 'application/json' },
          });
          response.statusCode = upstream.status;
          response.end(await upstream.text());
        } catch {
          response.statusCode = 502;
          response.end(JSON.stringify({ error: 'Directions service is temporarily unavailable.' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), kakaoDirectionsDevProxy(environment.KAKAO_REST_API_KEY || '')],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR can be disabled in constrained editing environments.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
