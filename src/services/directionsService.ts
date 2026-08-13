export interface RoadRoute {
  points: Array<{ latitude: number; longitude: number }>;
  distanceMeters: number;
  durationSeconds: number;
}

interface KakaoDirectionsResponse {
  routes?: Array<{
    result_code?: number;
    result_msg?: string;
    summary?: { distance?: number; duration?: number };
    sections?: Array<{
      roads?: Array<{ vertexes?: number[] }>;
    }>;
  }>;
}

export async function fetchRoadRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<RoadRoute> {
  const query = new URLSearchParams({
    originLng: String(origin.longitude),
    originLat: String(origin.latitude),
    destLng: String(destination.longitude),
    destLat: String(destination.latitude),
  });
  const response = await fetch(`/api/directions?${query.toString()}`, { signal });
  if (!response.ok) throw new Error(`Directions request failed: ${response.status}`);

  const payload = await response.json() as KakaoDirectionsResponse;
  const route = payload.routes?.[0];
  if (!route || route.result_code !== 0) {
    throw new Error(route?.result_msg || 'No route was returned.');
  }

  const points: RoadRoute['points'] = [];
  for (const section of route.sections ?? []) {
    for (const road of section.roads ?? []) {
      const vertexes = road.vertexes ?? [];
      for (let index = 0; index + 1 < vertexes.length; index += 2) {
        const longitude = vertexes[index];
        const latitude = vertexes[index + 1];
        const previous = points[points.length - 1];
        if (!previous || previous.latitude !== latitude || previous.longitude !== longitude) {
          points.push({ latitude, longitude });
        }
      }
    }
  }

  if (points.length < 2) throw new Error('The route contained no drawable road geometry.');

  return {
    points,
    distanceMeters: route.summary?.distance ?? 0,
    durationSeconds: route.summary?.duration ?? 0,
  };
}

