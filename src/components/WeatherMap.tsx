import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, Eye, Zap } from 'lucide-react';

interface WeatherMapProps {
  latitude: number;
  longitude: number;
  cityName: string;
  theme?: 'light' | 'dark';
}

export function WeatherMap({ latitude, longitude, cityName, theme = 'dark' }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  const [radarVisible, setRadarVisible] = useState(true);
  const [radarTime, setRadarTime] = useState<string>('');

  const isLight = theme === 'light';

  // Fetch latest RainViewer radar timestamp
  useEffect(() => {
    let active = true;
    const fetchRadarTimestamp = async () => {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!response.ok) return;
        const data = await response.json();
        if (active && data?.radar?.past?.length > 0) {
          const latestFrame = data.radar.past[data.radar.past.length - 1];
          setRadarTime(new Date(latestFrame.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          
          if (mapRef.current) {
            if (radarLayerRef.current) {
              mapRef.current.removeLayer(radarLayerRef.current);
            }

            const radarUrl = `https://tilecache.rainviewer.com/v2/radar/${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
            const radarTileLayer = L.tileLayer(radarUrl, {
              opacity: 0.65,
              zIndex: 100,
            });

            radarLayerRef.current = radarTileLayer;

            if (radarVisible) {
              radarTileLayer.addTo(mapRef.current);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch RainViewer timestamp:', err);
      }
    };

    fetchRadarTimestamp();
    return () => {
      active = false;
    };
  }, [latitude, longitude, radarVisible]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 9,
      zoomControl: false,
      attributionControl: false,
      layers: [
        L.tileLayer(tileUrl, {
          maxZoom: 19,
          className: isLight ? 'map-tiles-light' : 'map-tiles-dark',
        }),
      ],
    });

    mapRef.current = map;

    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-sky-500/25 animate-ping"></div>
          <div class="relative w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-md flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b style="font-family: inherit;">${cityName}</b>`, {
        closeButton: false,
        className: 'custom-leaflet-popup',
      });

    markerRef.current = marker;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isLight]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], 9);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
        markerRef.current.getPopup()?.setContent(`<b style="font-family: inherit;">${cityName}</b>`);
      }
    }
  }, [latitude, longitude, cityName]);

  const handleToggleRadar = () => {
    if (!mapRef.current) return;
    const nextState = !radarVisible;
    setRadarVisible(nextState);

    if (radarLayerRef.current) {
      if (nextState) {
        radarLayerRef.current.addTo(mapRef.current);
      } else {
        mapRef.current.removeLayer(radarLayerRef.current);
      }
    }
  };

  return (
    <div className={`relative w-full h-[420px] rounded-2xl overflow-hidden border transition-all ${
      isLight ? 'border-slate-200 shadow-sm' : 'border-white/10 shadow-lg'
    }`}>
      {/* Leaflet Mount */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Minimalist Header Card */}
      <div className={`absolute top-3 left-3 z-[1000] flex items-center gap-2.5 px-3.5 py-2 rounded-xl border backdrop-blur-xl transition-all shadow-md ${
        isLight ? 'bg-white/90 border-slate-200 text-slate-800' : 'bg-slate-900/90 border-white/10 text-slate-100'
      }`}>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Radar</span>
        </div>

        <div className="w-[1px] h-3.5 bg-slate-500/20" />

        <button
          type="button"
          onClick={handleToggleRadar}
          className={`text-xs font-medium px-2 py-0.5 rounded-md transition-colors ${
            radarVisible
              ? 'bg-sky-500 text-white'
              : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-slate-300'
          }`}
        >
          {radarVisible ? 'Rain On' : 'Rain Off'}
        </button>

        {radarVisible && radarTime && (
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            {radarTime}
          </span>
        )}
      </div>

      {/* Location Badge */}
      <div className={`absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-xl text-xs font-medium shadow-md ${
        isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-white/10 text-slate-300'
      }`}>
        <MapPin className="w-3.5 h-3.5 text-sky-400" />
        <span>{cityName}</span>
      </div>
    </div>
  );
}
