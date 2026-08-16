import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Check, AlertTriangle, Loader2, X, Navigation } from 'lucide-react'
import type { LocationSuggestion } from '../types'
import { api } from '../services/api'
import type { Language } from '../i18n/translations'

export interface SelectedLocation {
  locationName: string
  latitude?: number
  longitude?: number
  isGeocoded: boolean
}

interface LocationAutocompleteProps {
  value: string
  initialLatitude?: number
  initialLongitude?: number
  onLocationChange: (loc: SelectedLocation) => void
  placeholder?: string
  highContrast?: boolean
  language?: Language
  label?: string
  required?: boolean
  className?: string
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  initialLatitude,
  initialLongitude,
  onLocationChange,
  placeholder,
  highContrast = false,
  language = 'en',
  label = 'City / Neighborhood Location',
  required = false,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState<string>(value || '')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [isGeocoded, setIsGeocoded] = useState<boolean>(Boolean(initialLatitude && initialLongitude))
  const [hasInteracted, setHasInteracted] = useState<boolean>(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<any>(null)

  // Sync with prop changes
  useEffect(() => {
    setInputValue(value || '')
    if (initialLatitude && initialLongitude) {
      setIsGeocoded(true)
    }
  }, [value, initialLatitude, initialLongitude])

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const results = await api.getLocationAutocomplete(query, 6)
      setSuggestions(results)
      setIsOpen(results.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value
    setInputValue(nextVal)
    setHasInteracted(true)
    setIsGeocoded(false)

    // Notify parent of raw text change (un-geocoded until selected)
    onLocationChange({
      locationName: nextVal,
      isGeocoded: false
    })

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(nextVal)
    }, 280)
  }

  const handleSelectSuggestion = (s: LocationSuggestion) => {
    setInputValue(s.formatted_address)
    setIsGeocoded(true)
    setIsOpen(false)
    setSuggestions([])

    onLocationChange({
      locationName: s.formatted_address,
      latitude: s.latitude,
      longitude: s.longitude,
      isGeocoded: true
    })
  }

  const handleClear = () => {
    setInputValue('')
    setSuggestions([])
    setIsGeocoded(false)
    setIsOpen(false)
    onLocationChange({
      locationName: '',
      isGeocoded: false
    })
  }

  const getPlaceholderText = () => {
    if (placeholder) return placeholder
    if (language === 'ta') return 'நகரம் அல்லது பகுதியை தட்டச்சு செய்க (எ.கா. கோயம்புத்தூர்)'
    if (language === 'hi') return 'शहर या इलाका टाइप करें (उदा. दादर, मुंबई)'
    return 'Type city or area (e.g. Coimbatore, Tamil Nadu or Dadar, Mumbai)'
  }

  return (
    <div className={`relative space-y-1 ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>

          {isGeocoded && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>GPS Coordinates Synced</span>
            </span>
          )}
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <MapPin className={`w-4 h-4 ${isGeocoded ? 'text-[#4B32E6]' : 'text-slate-400'}`} />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
            else if (inputValue.trim().length >= 2) fetchSuggestions(inputValue)
          }}
          required={required}
          placeholder={getPlaceholderText()}
          className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs font-medium border transition-all focus:outline-none focus:ring-2 ${
            highContrast
              ? 'bg-zinc-900 border-amber-400 text-white focus:ring-amber-400'
              : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#4B32E6] focus:ring-[#4B32E6]/20'
          }`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 text-[#4B32E6] animate-spin" />}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className={`absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
          highContrast ? 'bg-black border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="p-1.5 space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Matching Geocoded Locations (OSM)
            </div>
            {suggestions.map((s, idx) => (
              <button
                key={`${s.formatted_address}-${idx}`}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  highContrast
                    ? 'hover:bg-amber-400 hover:text-black'
                    : 'hover:bg-blue-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-[#4B32E6] shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{s.formatted_address}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{s.display_name}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 shrink-0">
                  {s.latitude.toFixed(2)}°, {s.longitude.toFixed(2)}°
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warning if un-geocoded and user entered custom text */}
      {hasInteracted && inputValue.trim().length >= 3 && !isGeocoded && !isOpen && (
        <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[11px] font-medium flex items-start gap-1.5 mt-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Manual location:</strong> Not matched to OpenStreetMap index. Map radar and distance matching will use default regional coordinates. Pick a suggested city above for exact positioning.
          </span>
        </div>
      )}
    </div>
  )
}
