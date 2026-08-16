import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import type { MapItem, MapResponse, User } from '../types'
import { api } from '../services/api'
import { translations, type Language } from '../i18n/translations'
import {
  MapPin,
  Search,
  Navigation,
  Store,
  Briefcase,
  Star,
  Clock,
  ShieldCheck,
  Compass,
  X,
  Phone,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'

interface MapViewProps {
  highContrast?: boolean
  currentUser?: User | null
  language?: Language
  onSelectProvider?: (providerId: number) => void
  onRequestBooking?: (serviceId: number, providerId: number) => void
}

const PRESET_CITIES = [
  { name: 'Mumbai, MH', lat: 19.0760, lng: 72.8777 },
  { name: 'Chennai, TN', lat: 13.0827, lng: 80.2707 },
  { name: 'Bengaluru, KA', lat: 12.9716, lng: 77.5946 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Coimbatore, TN', lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai, TN', lat: 9.9252, lng: 78.1198 }
]

const CATEGORIES = [
  'All',
  'Cooking',
  'Tutoring',
  'Crafts',
  'Gardening',
  'Consulting',
  'Care & Health'
]

export const MapView: React.FC<MapViewProps> = ({
  highContrast = false,
  currentUser,
  language = 'en',
  onSelectProvider,
  onRequestBooking
}) => {
  const t = translations[language] || translations.en

  // Geolocation & map state
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: currentUser?.latitude || 19.0760,
    lng: currentUser?.longitude || 72.8777
  })
  const [locationName, setLocationName] = useState<string>(currentUser?.location_name || 'Mumbai, Maharashtra')
  const [radius, setRadius] = useState<number>(10)
  const [category, setCategory] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [includeBusinesses, setIncludeBusinesses] = useState<boolean>(true)

  const [loading, setLoading] = useState<boolean>(false)
  const [mapData, setMapData] = useState<MapResponse | null>(null)
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle')
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [interestSuccess, setInterestSuccess] = useState<string | null>(null)

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const radiusCircleRef = useRef<L.Circle | null>(null)

  // 1. Fetch live map data from backend
  const fetchMapData = async (lat: number, lng: number, rad: number, cat: string, query: string, incBiz: boolean) => {
    setLoading(true)
    try {
      const data = await api.getNearbyMapData({
        lat,
        lng,
        radius: rad,
        category: cat === 'All' ? undefined : cat,
        search: query.trim() || undefined,
        include_businesses: incBiz
      })
      setMapData(data)
    } catch (err: any) {
      console.error('Error loading map places:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load & when filters change
  useEffect(() => {
    fetchMapData(coords.lat, coords.lng, radius, category, searchTerm, includeBusinesses)
  }, [coords.lat, coords.lng, radius, category, includeBusinesses])

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map)

      const markersGroup = L.layerGroup().addTo(map)
      markersLayerRef.current = markersGroup
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // 3. Update Markers and Radius on map
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersGroup = markersLayerRef.current
    if (!map || !markersGroup) return

    // Clear previous markers
    markersGroup.clearLayers()

    // Pan map to center
    map.setView([coords.lat, coords.lng], radius > 15 ? 11 : radius > 5 ? 13 : 14)

    // Remove previous circle if any
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current)
    }

    // Add service radius circle around user location
    radiusCircleRef.current = L.circle([coords.lat, coords.lng], {
      radius: radius * 1000,
      color: highContrast ? '#FACC15' : '#4099FF',
      fillColor: highContrast ? '#FACC15' : '#4099FF',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 8'
    }).addTo(map)

    // Add Live User Location Marker (Pulse Dot)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-rose-500/30 animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
    const userMarker = L.marker([coords.lat, coords.lng], { icon: userIcon })
    userMarker.bindTooltip(t.currentLocation || 'Your Live Location', { direction: 'top', offset: [0, -10] })
    userMarker.addTo(markersGroup)

    // Add Items from backend
    if (mapData?.items) {
      mapData.items.forEach((item) => {
        let iconHtml = ''
        let iconSize: [number, number] = [36, 36]

        if (item.marker_type === 'silverhands_provider') {
          iconHtml = `
            <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
              <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4B32E6] to-[#4099FF] p-0.5 shadow-lg border-2 border-white flex items-center justify-center text-white">
                <span class="text-xs font-black">SH</span>
              </div>
              <div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white"></div>
            </div>
          `
        } else if (item.marker_type === 'silverhands_opportunity') {
          iconHtml = `
            <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
              <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-lg border-2 border-white flex items-center justify-center text-white font-bold text-xs">
                ₹
              </div>
              <div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-300 rounded-full border border-white"></div>
            </div>
          `
        } else {
          // Real Nearby Business (OSM)
          iconHtml = `
            <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-105">
              <div class="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 p-1 shadow-md border border-slate-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
              </div>
            </div>
          `
        }

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: iconHtml,
          iconSize: iconSize,
          iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
        })

        const marker = L.marker([item.latitude, item.longitude], { icon: customIcon })
        marker.on('click', () => {
          setSelectedItem(item)
        })
        marker.bindTooltip(
          `<strong>${item.name || item.title}</strong><br/><span style="font-size:11px;color:#64748B;">${item.label} (${item.distance_km} km)</span>`,
          { direction: 'top', offset: [0, -12] }
        )
        marker.addTo(markersGroup)
      })
    }
  }, [mapData, coords, radius, highContrast])

  // 4. Handle "Use My Live Location" Browser API
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      setGpsError('Geolocation is not supported by your browser.')
      return
    }

    setGpsStatus('locating')
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
        setCoords(newCoords)
        setGpsStatus('success')
        setLocationName(`Current GPS (${newCoords.lat.toFixed(3)}, ${newCoords.lng.toFixed(3)})`)

        // Persist coordinates to backend if user is authenticated
        if (currentUser) {
          try {
            await api.updateLocation({
              latitude: newCoords.lat,
              longitude: newCoords.lng,
              service_radius: radius
            })
          } catch (e) {
            console.warn('Location sync failed:', e)
          }
        }
      },
      (err) => {
        setGpsStatus('error')
        if (err.code === 1) {
          setGpsError('Location permission was denied. Please select a city or enable GPS.')
        } else {
          setGpsError('Unable to retrieve current location. Please select a quick city below.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  // 5. Express Interest on selected opportunity
  const handleExpressInterest = async (oppId: string) => {
    try {
      const res = await api.expressInterest(currentUser?.id || 1, oppId)
      setInterestSuccess(res.message)
      setTimeout(() => setInterestSuccess(null), 4000)
    } catch (err: any) {
      alert(`Interest submission notice: ${err.message}`)
    }
  }

  return (
    <div className={`space-y-4 ${highContrast ? 'text-white' : 'text-slate-800'}`}>
      {/* Top Banner & Control Toolbar */}
      <div className={`p-4 md:p-6 rounded-2xl border transition-all ${
        highContrast 
          ? 'bg-black border-amber-400' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#4B32E6]/10 text-[#4B32E6] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                {t.navMap || 'Live Discovery Map'}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Explore nearby SilverHands providers, open opportunities, and verified local businesses in real-time.
            </p>
          </div>

          {/* Quick Actions & Live GPS Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUseMyLocation}
              disabled={gpsStatus === 'locating'}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold cursor-pointer transition-all shadow-sm ${
                highContrast
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-[#0A0F24] hover:bg-[#131838] text-white'
              }`}
            >
              <Navigation className={`w-4 h-4 text-[#4099FF] ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>{gpsStatus === 'locating' ? 'Locating...' : (t.useMyLocation || 'Use My Location')}</span>
            </button>

            {/* Quick City Dropdown */}
            <select
              value={locationName}
              onChange={(e) => {
                const selected = PRESET_CITIES.find(c => c.name === e.target.value)
                if (selected) {
                  setCoords({ lat: selected.lat, lng: selected.lng })
                  setLocationName(selected.name)
                  setGpsStatus('idle')
                  setGpsError(null)
                }
              }}
              className={`px-3 py-2 rounded-xl text-xs md:text-sm font-medium border transition-colors cursor-pointer ${
                highContrast
                  ? 'bg-zinc-900 border-amber-400 text-amber-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {PRESET_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* GPS Error / Fallback Banner */}
        {gpsError && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{gpsError}</span>
            </div>
            <button
              onClick={() => setGpsError(null)}
              className="text-amber-800 font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search, Category & Radius Filter Row */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchMapData(coords.lat, coords.lng, radius, category, searchTerm, includeBusinesses)
                  }
                }}
                placeholder={t.searchPlaceholder || 'Search providers, food, tailoring, schools...'}
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs md:text-sm border focus:outline-none focus:ring-2 transition-all ${
                  highContrast
                    ? 'bg-zinc-900 border-amber-400 text-white focus:ring-amber-400'
                    : 'bg-white border-slate-200 text-slate-800 focus:ring-[#4B32E6]'
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    fetchMapData(coords.lat, coords.lng, radius, category, '', includeBusinesses)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchMapData(coords.lat, coords.lng, radius, category, searchTerm, includeBusinesses)}
              className="px-3 py-2 bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
            >
              Search
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  category === cat
                    ? highContrast
                      ? 'bg-amber-400 text-black'
                      : 'bg-[#4B32E6] text-white shadow-sm'
                    : highContrast
                    ? 'bg-zinc-900 text-amber-300 border border-amber-400/40 hover:bg-zinc-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Radius Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{t.radiusKm || 'Radius'}:</span>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                highContrast
                  ? 'bg-zinc-900 border-amber-400 text-amber-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={25}>25 km</option>
            </select>
          </div>
        </div>

        {/* Legend / Marker Distinction Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#4B32E6] inline-block border border-white shadow-xs"></span>
              <strong className="text-slate-700 font-semibold">{t.silverhandsProvider || 'SilverHands Provider'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-white shadow-xs"></span>
              <strong className="text-slate-700 font-semibold">{t.silverhandsOpportunity || 'SilverHands Opportunity'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-800 inline-block border border-emerald-400 shadow-xs"></span>
              <strong className="text-slate-700 font-semibold">{t.realNearbyBusiness || 'Real Nearby Business (OSM)'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-white animate-pulse"></span>
              <span className="text-slate-600">{t.currentLocation || 'Current Location'}</span>
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={includeBusinesses}
              onChange={(e) => setIncludeBusinesses(e.target.checked)}
              className="rounded border-slate-300 text-[#4B32E6] focus:ring-[#4B32E6]"
            />
            <span>Include Real Local Places (OSM)</span>
          </label>
        </div>
      </div>

      {/* Main Map Viewport & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[560px]">
        {/* Left / Top 2-Cols: Interactive Leaflet Map */}
        <div className={`lg:col-span-2 relative rounded-2xl overflow-hidden border shadow-sm flex flex-col ${
          highContrast ? 'border-amber-400 bg-zinc-950' : 'border-slate-200 bg-slate-100'
        }`}>
          {loading && (
            <div className="absolute top-3 right-3 z-[1000] px-3 py-1.5 bg-[#0A0F24]/90 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4099FF]" />
              <span>Scanning live area ({radius}km)...</span>
            </div>
          )}

          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[480px] lg:min-h-[580px] z-0"
          />
        </div>

        {/* Right 1-Col: Place / Provider Detail Sidebar & Feed */}
        <div className="space-y-4 flex flex-col">
          {/* Selected Item Detail Card */}
          {selectedItem ? (
            <div className={`p-5 rounded-2xl border transition-all animate-in fade-in slide-in-from-right-4 duration-200 ${
              highContrast 
                ? 'bg-black border-amber-400' 
                : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="flex items-start justify-between gap-3">
                {/* Marker Type Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                  selectedItem.marker_type === 'silverhands_provider'
                    ? 'bg-[#4B32E6]/10 text-[#4B32E6] border border-[#4B32E6]/20'
                    : selectedItem.marker_type === 'silverhands_opportunity'
                    ? 'bg-amber-50 text-amber-700 border border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                }`}>
                  {selectedItem.marker_type === 'silverhands_provider' && <ShieldCheck className="w-3.5 h-3.5" />}
                  {selectedItem.marker_type === 'silverhands_opportunity' && <Briefcase className="w-3.5 h-3.5" />}
                  {selectedItem.marker_type === 'real_business' && <Store className="w-3.5 h-3.5" />}
                  {selectedItem.label}
                </span>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Distance */}
              <div className="mt-3">
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {selectedItem.name || selectedItem.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#4099FF]" />
                  <span>{selectedItem.location_name || selectedItem.address || selectedItem.customer_location || 'Local Area'}</span>
                  <span className="mx-1">•</span>
                  <strong className="text-slate-700">{selectedItem.distance_km} km away</strong>
                </p>
              </div>

              {/* Specific Content by Marker Type */}
              {selectedItem.marker_type === 'silverhands_provider' && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {selectedItem.rating || 4.9} ({selectedItem.review_count || 5} reviews)
                    </span>
                    <span className="font-extrabold text-[#4B32E6] text-sm">
                      ₹{selectedItem.hourly_rate || 350}/hr
                    </span>
                  </div>

                  {selectedItem.bio && (
                    <p className="text-xs text-slate-600 line-clamp-3">
                      "{selectedItem.bio}"
                    </p>
                  )}

                  {selectedItem.skills && selectedItem.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedItem.skills.map((s: any, idx: number) => (
                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {s.title || s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => onSelectProvider && onSelectProvider(Number(selectedItem.id))}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0A0F24] hover:bg-[#131838] text-white cursor-pointer transition-colors text-center"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => onRequestBooking && onRequestBooking(1, Number(selectedItem.id))}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#4B32E6] hover:bg-[#3629D3] text-white cursor-pointer transition-colors text-center shadow-xs"
                    >
                      Book Service
                    </button>
                  </div>
                </div>
              )}

              {selectedItem.marker_type === 'silverhands_opportunity' && (
                <div className="mt-4 space-y-3">
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-800 font-bold uppercase text-[10px]">Client Budget</span>
                      <span className="text-amber-900 font-black text-sm">{selectedItem.budget_range}</span>
                    </div>
                    <p className="text-slate-700 text-xs mt-1">
                      {selectedItem.description}
                    </p>
                  </div>

                  {interestSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{interestSuccess}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleExpressInterest(String(selectedItem.id))}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#4B32E6] to-[#4099FF] text-white cursor-pointer hover:opacity-95 shadow-sm transition-all text-center"
                  >
                    Express Interest in Gig
                  </button>
                </div>
              )}

              {selectedItem.marker_type === 'real_business' && (
                <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Category Type:</span>
                      <span className="font-bold text-slate-800">{selectedItem.sub_type || selectedItem.category}</span>
                    </div>
                    {selectedItem.phone && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedItem.phone}</span>
                      </div>
                    )}
                    {selectedItem.opening_hours && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedItem.opening_hours}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    * Sourced from OpenStreetMap live places API. This is an independent local merchant / venue in your community.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-5 rounded-2xl border text-center space-y-2 ${
              highContrast ? 'bg-zinc-950 border-amber-400/40 text-amber-300' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Select Any Pin on Map</h4>
              <p className="text-xs text-slate-500">
                Click any provider, opportunity, or merchant marker to view detailed information, distances, and direct actions.
              </p>
            </div>
          )}

          {/* Quick List Feed of Nearest Highlights */}
          <div className={`p-4 rounded-2xl border flex-1 overflow-y-auto max-h-[380px] space-y-2.5 ${
            highContrast ? 'bg-black border-amber-400' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider">
                Nearest Matches ({mapData?.counts?.total || 0})
              </span>
              <span className="text-slate-400 text-[11px]">Sorted by distance</span>
            </div>

            {mapData?.items && mapData.items.length > 0 ? (
              mapData.items.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                    selectedItem?.id === item.id
                      ? 'bg-[#4B32E6]/5 border-[#4B32E6]'
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        item.marker_type === 'silverhands_provider'
                          ? 'bg-[#4B32E6]'
                          : item.marker_type === 'silverhands_opportunity'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`} />
                      <span className="font-bold text-slate-800 truncate">{item.name || item.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 ml-3.5 block">{item.label}</span>
                  </div>

                  <span className="text-xs font-black text-slate-600 shrink-0">
                    {item.distance_km} km
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No items found within {radius} km. Try expanding the radius or clearing filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
