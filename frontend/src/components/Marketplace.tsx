import React, { useState, useEffect } from 'react'
import {
  Search, MapPin, Star, ShieldCheck, Clock,
  ChefHat, GraduationCap, Scissors, Sprout, Wrench, Calendar,
  CheckCircle2, AlertCircle, X, Sparkles, Map as MapIcon,
  SlidersHorizontal, UserCheck
} from 'lucide-react'
import type { ServiceListing, User } from '../types'
import { api } from '../services/api'
import { formatINR } from '../utils/formatters'
import { translations, type Language } from '../i18n/translations'

interface MarketplaceProps {
  highContrast: boolean
  currentUser: User | null
  onBookingSuccess: () => void
  language?: Language
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  highContrast,
  currentUser,
  onBookingSuccess,
  language = 'en'
}) => {
  const t = translations[language]

  const [services, setServices] = useState<ServiceListing[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<number>(1000)
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null)
  const [showMap, setShowMap] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState<boolean>(false)

  // Booking Modal State
  const [bookingDate, setBookingDate] = useState<string>('2026-08-25')
  const [bookingHours, setBookingHours] = useState<number>(2)
  const [bookingNotes, setBookingNotes] = useState<string>('Looking forward to learning authentic recipes and meeting!')
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false)
  const [bookingMessage, setBookingMessage] = useState<string | null>(null)

  const defaultAvatar = "/avatars/seed/lakshmi_amma.jpg"

  const categories = [
    { id: 'All', label: t.allCategories, icon: Sparkles },
    { id: 'Cooking & Tiffin', label: t.cookingTiffin, icon: ChefHat },
    { id: 'Tutoring & Mentoring', label: t.tutoringMentoring, icon: GraduationCap },
    { id: 'Crafts & Tailoring', label: t.craftsTailoring, icon: Scissors },
    { id: 'Gardening & Agriculture', label: t.gardeningAgri, icon: Sprout },
    { id: 'Home Maintenance', label: t.homeMaintenance, icon: Wrench },
  ]

  const loadServices = async () => {
    setLoading(true)
    try {
      const data = await api.getServices(
        selectedCategory,
        searchQuery,
        undefined,
        maxPrice < 1000 ? maxPrice : undefined
      )
      setServices(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [selectedCategory])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadServices()
  }

  const handleConfirmBooking = async () => {
    if (!selectedService) return
    setBookingSubmitting(true)
    try {
      const totalPrice = selectedService.price_per_hour * bookingHours
      await api.createBooking(
        selectedService.id,
        selectedService.provider_id,
        totalPrice,
        `${bookingDate} (${bookingHours} Hours)`,
        bookingNotes,
        currentUser?.id || 1
      )
      setBookingMessage('Booking request sent successfully to senior provider!')
      setTimeout(() => {
        setBookingMessage(null)
        setSelectedService(null)
        onBookingSuccess()
      }, 1500)
    } catch (err: any) {
      setBookingMessage(`Booking Error: ${err.message}`)
    } finally {
      setBookingSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Filter Chips & Search Bar */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${
                highContrast
                  ? 'bg-zinc-900 border-amber-400 text-white focus:ring-2 focus:ring-amber-300'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-[#4B32E6] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400'
              }`}
            />
          </div>

          <button
            type="submit"
            className={`btn-large ${
              highContrast 
                ? 'bg-amber-400 text-black border-2 border-white' 
                : 'btn-indigo text-xs py-2 px-4 shadow-sm'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{t.searchBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-large text-xs ${
              showFilters
                ? 'bg-blue-50 text-[#4B32E6] font-bold border border-blue-200'
                : highContrast ? 'bg-zinc-800 text-amber-300 border border-amber-400' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showFilters ? t.hideFilters : t.filters}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className={`btn-large text-xs ${
              showMap
                ? 'bg-blue-50 text-[#4B32E6] font-bold border border-blue-200'
                : highContrast ? 'bg-zinc-800 text-amber-300 border border-amber-400' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{showMap ? t.hideMap : t.mapView}</span>
          </button>
        </form>

        {/* Filter Sliders */}
        {showFilters && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[220px]">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Maximum Hourly Rate</span>
                <span className="text-[#4B32E6] font-bold">{formatINR(maxPrice)}/hr</span>
              </div>
              <input
                type="range"
                min={200}
                max={1000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#4B32E6] cursor-pointer"
              />
            </div>

            <button
              onClick={loadServices}
              className="btn-large btn-indigo text-xs py-1.5 px-3.5 font-semibold"
            >
              Apply Filter
            </button>
          </div>
        )}

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? highContrast
                      ? 'bg-amber-400 text-black shadow-sm border-2 border-white'
                      : 'bg-[#4B32E6] text-white shadow-sm font-semibold'
                    : highContrast
                      ? 'bg-zinc-900 text-amber-300 border border-amber-400/40 hover:bg-zinc-800'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#4099FF]'}`} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Map View Indicator */}
      {showMap && (
        <div className={`p-5 rounded-xl border shadow-sm ${
          highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4099FF]" />
              <h3 className="text-base font-bold">Senior Provider Neighborhood Network (India)</h3>
            </div>
            <span className="text-xs font-semibold bg-blue-50 text-[#4B32E6] border border-blue-200 px-2.5 py-0.5 rounded">
              Interactive Locality View
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            {services.map((s) => (
              <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#4B32E6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  📍
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">{s.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.provider_name} • {s.location_name}</p>
                  <span className="inline-block mt-1 text-[11px] font-bold text-[#4B32E6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {formatINR(s.price_per_hour)}/hr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-3 border-[#4B32E6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading verified senior marketplace listings...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-center gap-3 text-xs">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Unable to load marketplace</h4>
            <p>{error}</p>
            <button
              onClick={loadServices}
              className="mt-2 px-3 py-1 bg-rose-600 text-white font-semibold rounded text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Services Grid (White Cards with subtle border & hover lift) */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`card-enterprise flex flex-col justify-between ${
                highContrast
                  ? 'bg-black border-2 border-amber-400 text-white'
                  : 'bg-white text-slate-900'
              }`}
            >
              <div>
                {/* Header Profile Info */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={service.provider_avatar || defaultAvatar}
                      alt={service.provider_name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultAvatar
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{service.provider_name}</h3>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{service.provider_user_type || t.verifiedSenior}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 font-bold px-2.5 py-0.5 rounded-lg text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{service.rating || 5.0}</span>
                    </span>
                  </div>
                </div>

                {/* Listing Details */}
                <div className="mt-3 space-y-2">
                  <div className="inline-block bg-blue-50 text-[#4B32E6] border border-blue-100 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                    {service.category}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {service.title}
                  </h4>

                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                    {service.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{service.location_name || 'Mumbai, Maharashtra'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{service.availability || 'Flexible'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{service.completed_services || 12} {t.completedJobs}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">{t.hourlyRate}</span>
                  <p className="text-xl font-black text-slate-900">{formatINR(service.price_per_hour)} <span className="text-xs font-normal text-slate-500">/ hr</span></p>
                </div>

                <button
                  onClick={() => setSelectedService(service)}
                  className={`btn-large ${
                    highContrast 
                      ? 'bg-amber-400 text-black border-2 border-white' 
                      : 'btn-indigo text-xs py-1.5 px-3.5 shadow-sm'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t.requestService}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 space-y-4 rounded-2xl relative border shadow-xl bg-white text-slate-900 border-slate-200">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <img
                src={selectedService.provider_avatar || defaultAvatar}
                alt={selectedService.provider_name}
                className="w-11 h-11 rounded-lg object-cover border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultAvatar
                }}
              />
              <div>
                <h3 className="text-lg font-bold">{selectedService.title}</h3>
                <p className="text-xs text-slate-500">With {selectedService.provider_name}</p>
              </div>
            </div>

            {bookingMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bookingMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#4B32E6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Duration (Hours)</label>
                <select
                  value={bookingHours}
                  onChange={(e) => setBookingHours(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-[#4B32E6]"
                >
                  <option value={1}>1 Hour ({formatINR(selectedService.price_per_hour * 1)})</option>
                  <option value={2}>2 Hours ({formatINR(selectedService.price_per_hour * 2)})</option>
                  <option value={3}>3 Hours ({formatINR(selectedService.price_per_hour * 3)})</option>
                  <option value={4}>4 Hours ({formatINR(selectedService.price_per_hour * 4)})</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes for Senior Provider</label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Share details about what you'd like to learn or schedule..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#4B32E6]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between font-bold text-slate-900">
                <span className="text-xs uppercase tracking-wider text-slate-500">Total Estimate:</span>
                <span className="text-xl text-[#4B32E6]">{formatINR(selectedService.price_per_hour * bookingHours)}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setSelectedService(null)}
                className="btn-large w-1/2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={bookingSubmitting}
                className="btn-large w-1/2 btn-indigo text-xs py-2 font-semibold shadow-sm"
              >
                {bookingSubmitting ? 'Sending Request...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
