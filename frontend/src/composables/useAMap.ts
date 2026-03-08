import { ref, onMounted, onUnmounted } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';

export function useAMap(containerId: string) {
  const map = ref<any>(null);
  const AMap = ref<any>(null);
  const markers = ref<any[]>([]);
  const polylines = ref<any[]>([]);
  const loaded = ref(false);

  // Set security config
  (window as any)._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_KEY,
  };

  async function initMap(center?: [number, number]) {
    try {
      const amap = await AMapLoader.load({
        key: import.meta.env.VITE_AMAP_WEB_KEY,
        version: '2.0',
        plugins: ['AMap.Scale', 'AMap.ToolBar'],
      });
      AMap.value = amap;

      map.value = new amap.Map(containerId, {
        zoom: 12,
        center: center || [116.397428, 39.90923],
        mapStyle: 'amap://styles/whitesmoke',
        resizeEnable: true,
      });

      map.value.addControl(new amap.Scale());
      map.value.addControl(new amap.ToolBar({ position: 'RB' }));

      loaded.value = true;
    } catch (e) {
      console.error('AMap load failed:', e);
    }
  }

  function clearAll() {
    clearMarkers();
    clearPolylines();
  }

  function clearMarkers() {
    markers.value.forEach((m) => map.value?.remove(m));
    markers.value = [];
  }

  function clearPolylines() {
    polylines.value.forEach((p) => map.value?.remove(p));
    polylines.value = [];
  }

  function addMarker(options: {
    position: [number, number];
    label: string;
    type: string;
    color: string;
    index?: number;
    onClick?: () => void;
  }) {
    if (!AMap.value || !map.value) return;

    const typeIcons: Record<string, string> = {
      spot: 'M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z',
      restaurant: 'M3 3h2v10H3zM7 3h2v4a4 4 0 004 4h0V3h2v18h-2v-7h0a6 6 0 01-6-6V3z',
      hotel: 'M3 21V7l9-4 9 4v14H3zM9 21v-6h6v6',
      shopping: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0',
      entertainment: 'M12 2a10 10 0 110 20 10 10 0 010-20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
    };
    const iconPath = typeIcons[options.type] || typeIcons.spot;

    const content = `
      <div style="position:relative;cursor:pointer;">
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:${options.color};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.15);
          border:2px solid white;
        ">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="${iconPath}"/>
          </svg>
        </div>
        ${options.index !== undefined ? `<div style="
          position:absolute;top:-8px;right:-8px;
          width:18px;height:18px;border-radius:50%;
          background:var(--morandi-text);color:white;
          font-size:10px;font-weight:600;
          display:flex;align-items:center;justify-content:center;
        ">${options.index + 1}</div>` : ''}
      </div>
    `;

    const marker = new AMap.value.Marker({
      position: options.position,
      content,
      offset: new AMap.value.Pixel(-18, -18),
      label: {
        content: `<div style="
          background:white;padding:2px 8px;border-radius:8px;
          font-size:12px;color:#6B5E52;white-space:nowrap;
          box-shadow:0 1px 4px rgba(0,0,0,0.1);
          border:1px solid #E8E2DB;
        ">${options.label}</div>`,
        offset: new AMap.value.Pixel(0, 4),
        direction: 'bottom',
      },
    });

    if (options.onClick) {
      marker.on('click', options.onClick);
    }

    map.value.add(marker);
    markers.value.push(marker);
    return marker;
  }

  function drawPolyline(path: [number, number][], color: string) {
    if (!AMap.value || !map.value) return;

    const polyline = new AMap.value.Polyline({
      path,
      strokeColor: color,
      strokeWeight: 4,
      strokeOpacity: 0.7,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true,
    });

    map.value.add(polyline);
    polylines.value.push(polyline);
    return polyline;
  }

  function parsePolyline(polylineStr: string): [number, number][] {
    // AMap polyline format: "lng1,lat1;lng2,lat2;..."
    return polylineStr.split(';').map((p) => {
      const [lng, lat] = p.split(',').map(Number);
      return [lng, lat] as [number, number];
    }).filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat));
  }

  function fitView(padding?: number[]) {
    if (map.value) {
      map.value.setFitView(null, false, padding || [60, 60, 60, 60]);
    }
  }

  function panTo(position: [number, number]) {
    if (map.value) {
      map.value.panTo(position);
      map.value.setZoom(15);
    }
  }

  function destroy() {
    if (map.value) {
      map.value.destroy();
      map.value = null;
    }
  }

  onUnmounted(() => {
    destroy();
  });

  return {
    map,
    AMap,
    loaded,
    initMap,
    clearAll,
    clearMarkers,
    clearPolylines,
    addMarker,
    drawPolyline,
    parsePolyline,
    fitView,
    panTo,
    destroy,
  };
}
