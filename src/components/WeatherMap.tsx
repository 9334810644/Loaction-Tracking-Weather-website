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
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarTime, setRadarTime] = useState<string>('');

  // Fetch latest RainViewer radar timestamp
  useEffect(() => {
    let active = true;
    const fetchRadarTimestamp = async () => {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!response.ok) return;
        const data = await response.json();
        if (active && data && data.radar && data.radar.past && data.radar.past.length > 0) {
          // get most recent past frame
          const latestFrame = data.radar.past[data.radar.past.length - 1];
          setRadarTime(new Date(latestFrame.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          
          if (mapRef.current) {
            // Remove old radar layer
            if (radarLayerRef.current) {
              mapRef.current.removeLayer(radarLayerRef.current);
            }

            // Create new radar layer with retrieved timestamp
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
        console.warn('Could not fetch RainViewer timestamp, fallback to default', err);
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

    // Select tile URL based on current active theme
    const tileUrl = theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 9,
      zoomControl: false,
      layers: [
        L.tileLayer(tileUrl, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }),
      ],
    });

    mapRef.current = map;

    // Custom premium pulsing SVG marker (avoid standard Leaflet icon paths breaking)
    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute w-10 h-10 rounded-full bg-sky-500/25 animate-ping"></div>
          <div class="relative w-5 h-5 bg-sky-500 border-2 border-white rounded-full shadow-lg shadow-sky-500/50 flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b class="font-sans font-semibold text-slate-900">${cityName}</b><br><span class="text-xs text-slate-500 font-medium">Center Forecast Spot</span>`, {
        closeButton: false,
        className: 'custom-leaflet-popup',
      });

    markerRef.current = marker;

    // Add zoom buttons on the bottom-right for clean visual layout
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Watch resize
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
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, [theme]); // Re-initialize map whenever theme changes to load voyager/dark-all tiles!

  // Update map center when latitude/longitude changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], 9);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
        markerRef.current.getPopup()?.setContent(`<b class="font-sans font-semibold text-slate-900">${cityName}</b><br><span class="text-xs text-slate-500 font-medium">Center Forecast Spot</span>`);
      }
    }
  }, [latitude, longitude, cityName]);

  // Toggle radar layer visibility
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
    <div className={`relative w-full h-[320px] rounded-3xl overflow-hidden border shadow-xl group transition-all ${
      theme === 'light' ? 'border-slate-200' : 'border-white/10'
    }`}>
      
      {/* Map Target Node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Glassmorphic Layer Controller Card */}
      <div className={`absolute top-4 left-4 z-[1000] flex flex-col gap-2 p-3 rounded-2xl border shadow-xl max-w-xs transition-all ${
        theme === 'light' ? 'sleek-card-light text-slate-800' : 'sleek-card-dark text-slate-200'
      }`}>
        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
          theme === 'light' ? 'text-slate-900' : 'text-white'
        }`}>
          <Layers className="w-4 h-4 text-sky-500" />
          <span>Interactive Radar Map</span>
        </div>
        
        <p className={`text-[11px] leading-tight ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
          Visualizing global weather conditions, live rainfall maps, and radar projections.
        </p>

        <div className={`flex items-center justify-between gap-4 mt-1 border-t pt-2 ${
          theme === 'light' ? 'border-slate-950/10' : 'border-white/5'
        }`}>
          <button
            onClick={handleToggleRadar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              radarVisible
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : theme === 'light' 
                  ? 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Radar Overlay</span>
          </button>

          {radarVisible && radarTime && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/20 shadow-sm">
              <Zap className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              <span>{radarTime}</span>
            </span>
          )}
        </div>
      </div>

      {/* Floating Center Mappin Indicator */}
      <div className={`absolute bottom-4 left-4 z-[1000] pointer-events-none flex items-center gap-2 border px-3 py-1.5 rounded-xl text-[11px] shadow-md transition-all ${
        theme === 'light' ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-white/5 text-slate-300'
      }`}>
        <MapPin className="w-3.5 h-3.5 text-sky-500" />
        <span className="font-medium">{cityName} radar region</span>
      </div>

    </div>
  );
}
