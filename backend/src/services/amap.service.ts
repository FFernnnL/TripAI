const BASE_URL = 'https://restapi.amap.com/v3';

function getAmapKey(): string {
  return process.env.AMAP_SERVICE_KEY || '';
}

interface GeoResult {
  lat: number;
  lng: number;
  address: string;
}

/**
 * 地理编码：地址 -> 坐标
 */
export async function geocode(address: string, city?: string): Promise<GeoResult | null> {
  try {
    const params = new URLSearchParams({
      key: getAmapKey(),
      address,
      output: 'JSON',
    });
    if (city) params.set('city', city);

    const res = await fetch(`${BASE_URL}/geocode/geo?${params}`);
    const data = await res.json() as any;

    if (data.status === '1' && data.geocodes?.length > 0) {
      const loc = data.geocodes[0].location;
      if (!loc) return null;
      const [lng, lat] = loc.split(',');
      return {
        lng: parseFloat(lng),
        lat: parseFloat(lat),
        address: data.geocodes[0].formatted_address || address,
      };
    }
    return null;
  } catch (e) {
    console.error(`[geocode] 地理编码失败: ${address}`, e);
    return null;
  }
}

/**
 * POI搜索：通过地点名称搜索坐标（比地理编码更适合景点/餐厅名称）
 */
async function poiSearch(name: string, city?: string): Promise<GeoResult | null> {
  try {
    const params = new URLSearchParams({
      key: getAmapKey(),
      keywords: name,
      output: 'JSON',
      offset: '1',
      page: '1',
    });
    if (city) params.set('city', city);

    const res = await fetch(`${BASE_URL}/place/text?${params}`);
    const data = await res.json() as any;

    if (data.status === '1' && data.pois?.length > 0) {
      const poi = data.pois[0];
      const loc = poi.location;
      if (!loc) return null;
      const [lng, lat] = loc.split(',');
      return {
        lng: parseFloat(lng),
        lat: parseFloat(lat),
        address: poi.address || poi.name || name,
      };
    }
    return null;
  } catch (e) {
    console.error(`[poiSearch] POI搜索失败: ${name}`, e);
    return null;
  }
}

/**
 * 智能地理编码：先尝试POI搜索，失败再用地理编码，再失败尝试组合查询
 */
async function smartGeocode(name: string, address: string, city?: string): Promise<GeoResult | null> {
  // 1. 先用POI搜索（景点/餐厅名称更适合POI）
  const cityQuery = city || '';
  let result = await poiSearch(cityQuery ? `${cityQuery} ${name}` : name, city);
  if (result) return result;

  // 2. 尝试用完整地址进行地理编码
  if (address && address !== name) {
    result = await geocode(address, city);
    if (result) return result;
  }

  // 3. 用城市+名称进行地理编码
  if (city) {
    result = await geocode(`${city}${name}`, city);
    if (result) return result;
  }

  // 4. 直接用名称搜索
  result = await poiSearch(name);
  if (result) return result;

  console.warn(`[smartGeocode] 所有方法均未找到坐标: name="${name}", address="${address}", city="${city}"`);
  return null;
}

/**
 * 批量智能地理编码
 */
export async function batchGeocode(places: Array<{ name: string; address: string; city?: string }>): Promise<Map<string, GeoResult>> {
  const results = new Map<string, GeoResult>();
  // Process in batches of 3 to avoid rate limiting
  for (let i = 0; i < places.length; i += 3) {
    const batch = places.slice(i, i + 3);
    const promises = batch.map(async (place) => {
      const result = await smartGeocode(place.name, place.address, place.city);
      if (result) {
        results.set(place.name, result);
      }
    });
    await Promise.all(promises);
    if (i + 3 < places.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`[batchGeocode] 成功编码 ${results.size}/${places.length} 个地点`);
  return results;
}

interface RouteResult {
  distance: number;
  duration: number;
  polyline: string;
}

export async function planRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints?: Array<{ lat: number; lng: number }>
): Promise<RouteResult | null> {
  try {
    const originStr = `${origin.lng},${origin.lat}`;
    const destStr = `${destination.lng},${destination.lat}`;

    const dist = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const mode = dist < 5000 ? 'walking' : 'driving';
    const url = mode === 'walking'
      ? `${BASE_URL}/direction/walking`
      : `${BASE_URL}/direction/driving`;

    const params = new URLSearchParams({
      key: getAmapKey(),
      origin: originStr,
      destination: destStr,
      output: 'JSON',
    });

    if (waypoints && waypoints.length > 0 && mode === 'driving') {
      params.set('waypoints', waypoints.map(w => `${w.lng},${w.lat}`).join(';'));
    }

    const res = await fetch(`${url}?${params}`);
    const data = await res.json() as any;

    if (data.status === '1' && data.route?.paths?.length > 0) {
      const path = data.route.paths[0];
      const polyline = path.steps.map((s: any) => s.polyline).join(';');
      return {
        distance: parseInt(path.distance),
        duration: parseInt(path.duration),
        polyline,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchPOI(keyword: string, city?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      key: getAmapKey(),
      keywords: keyword,
      output: 'JSON',
      offset: '10',
      page: '1',
    });
    if (city) params.set('city', city);

    const res = await fetch(`${BASE_URL}/place/text?${params}`);
    const data = await res.json() as any;

    if (data.status === '1' && data.pois) {
      return data.pois.map((poi: any) => {
        const [lng, lat] = poi.location?.split(',') || [0, 0];
        return {
          name: poi.name,
          address: poi.address,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          type: poi.type,
          tel: poi.tel,
        };
      });
    }
    return [];
  } catch {
    return [];
  }
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
