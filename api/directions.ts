interface VercelRequest {
  method?: string;
  url?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
  send: (body: string) => void;
}

function validCoordinate(value: string | null, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });

    const restKey = process.env.KAKAO_REST_API_KEY;
    if (!restKey) return response.status(503).json({ error: 'Directions service is not configured.' });

    const requestUrl = new URL(request.url ?? '/', 'https://sisicall.local');
    const originLng = validCoordinate(requestUrl.searchParams.get('originLng'), 124, 132);
    const originLat = validCoordinate(requestUrl.searchParams.get('originLat'), 33, 39.5);
    const destLng = validCoordinate(requestUrl.searchParams.get('destLng'), 124, 132);
    const destLat = validCoordinate(requestUrl.searchParams.get('destLat'), 33, 39.5);

    if ([originLng, originLat, destLng, destLat].some((value) => value === null)) {
      return response.status(400).json({ error: 'Valid Korean origin and destination coordinates are required.' });
    }

    const kakaoUrl = new URL('https://apis-navi.kakaomobility.com/v1/directions');
    kakaoUrl.searchParams.set('origin', `${originLng},${originLat}`);
    kakaoUrl.searchParams.set('destination', `${destLng},${destLat}`);
    kakaoUrl.searchParams.set('priority', 'RECOMMEND');
    kakaoUrl.searchParams.set('summary', 'false');

    try {
      const upstream = await fetch(kakaoUrl, {
        headers: {
          Authorization: `KakaoAK ${restKey}`,
          Accept: 'application/json',
        },
      });
      return response.status(upstream.status).send(await upstream.text());
    } catch {
      return response.status(502).json({ error: 'Directions service is temporarily unavailable.' });
    }
}
