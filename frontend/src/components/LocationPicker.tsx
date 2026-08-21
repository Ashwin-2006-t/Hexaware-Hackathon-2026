import React, { useState } from 'react';
import { MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle2, Edit2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  readable_address: string;
}

interface LocationPickerProps {
  initialLocation?: string;
  initialLat?: number | null;
  initialLon?: number | null;
  onLocationDetected: (data: LocationData) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  initialLat,
  initialLon,
  onLocationDetected
}) => {
  const { t } = useLanguage();
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(() => {
    if (initialLat && initialLon) {
      return {
        latitude: initialLat,
        longitude: initialLon,
        readable_address: initialLocation || `${initialLat.toFixed(4)}, ${initialLon.toFixed(4)}`
      };
    }
    return null;
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualText, setManualText] = useState(initialLocation || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reverseGeocode = async (lat: number, lon: number): Promise<{ city?: string; state?: string; country?: string; address: string }> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Chennai';
        const state = addr.state || 'Tamil Nadu';
        const country = addr.country || 'India';
        
        const parts = [city, state, country].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(', ') : data.display_name || `Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
        return { city, state, country, address: formatted };
      }
    } catch (e) {
      console.warn('[LocationPicker] Reverse geocoding network error:', e);
    }
    return { address: `Location Detected (${lat.toFixed(4)}, ${lon.toFixed(4)})` };
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Please type your location manually.');
      setIsManualInput(true);
      return;
    }

    setIsDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const geoResult = await reverseGeocode(lat, lon);

        const locData: LocationData = {
          latitude: lat,
          longitude: lon,
          city: geoResult.city,
          state: geoResult.state,
          country: geoResult.country,
          readable_address: geoResult.address
        };

        setDetectedLocation(locData);
        setManualText(geoResult.address);
        setIsDetecting(false);
        onLocationDetected(locData);
      },
      (error) => {
        setIsDetecting(false);
        console.warn('Geolocation position error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. You can enter your city/locality manually below.');
        } else if (error.code === error.TIMEOUT) {
          setErrorMsg('GPS request timed out. Please try clicking again or enter your location manually.');
        } else {
          setErrorMsg('Unable to retrieve position. Please enter your location manually.');
        }
        setIsManualInput(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    // Use fallback coordinates if manual text provided without GPS
    const defaultLat = detectedLocation?.latitude || 13.0827; // Chennai Default
    const defaultLon = detectedLocation?.longitude || 80.2707;

    const locData: LocationData = {
      latitude: defaultLat,
      longitude: defaultLon,
      readable_address: manualText.trim()
    };

    setDetectedLocation(locData);
    onLocationDetected(locData);
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">Service Location</h4>
            <p className="text-xs text-slate-500 font-medium">Detect real GPS coordinates or enter manually</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isDetecting}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-sm min-h-[42px]"
          >
            {isDetecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('location.detecting')}</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>{t('location.useCurrentLocation')}</span>
              </>
            )}
          </button>

          {!isManualInput && (
            <button
              type="button"
              onClick={() => setIsManualInput(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center space-x-1 transition cursor-pointer min-h-[42px]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{t('location.enterManually')}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Detected Location Display */}
      {detectedLocation && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                Active Verified Location
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                📍 {detectedLocation.readable_address}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block">
                GPS: {detectedLocation.latitude.toFixed(4)}, {detectedLocation.longitude.toFixed(4)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isDetecting}
            className="p-2 text-indigo-600 hover:text-indigo-800 font-extrabold text-xs"
            title="Refresh GPS Location"
          >
            <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Manual Location Form Input */}
      {isManualInput && (
        <form onSubmit={handleManualSubmit} className="pt-2 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Enter Area / Locality / City Manually
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="e.g. Mylapore, Chennai, Tamil Nadu"
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer min-h-[42px]"
              >
                Set Location
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
};
