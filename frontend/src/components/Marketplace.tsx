import React, { useState, useEffect } from 'react'
import {
  Search, MapPin, Star, ShieldCheck, Clock,
  ChefHat, GraduationCap, Scissors, Sprout, Wrench, Calendar,
  CheckCircle2, AlertCircle, X, Sparkles, Map as MapIcon
} from 'lucide-react'
import type { ServiceListing, User } from '../types'
import { api } from '../services/api'

interface MarketplaceProps {
  highContrast: boolean
  currentUser: User | null
  onBookingSuccess: () => void
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  highContrast,
  onBookingSuccess
}) => {
  const [services, setServices] = useState<ServiceListing[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null)
  const [showMap, setShowMap] = useState<boolean>(false)

  // Booking Modal State
  const [bookingDate, setBookingDate] = useState<string>('2026-08-20')
  const [bookingHours, setBookingHours] = useState<number>(2)
  const [bookingNotes, setBookingNotes] = useState<string>('Looking forward to learning and meeting!')
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false)
  const [bookingMessage, setBookingMessage] = useState<string | null>(null)

  const categories = [
    { id: 'All', label: 'All Services', icon: Sparkles },
    { id: 'Cooking & Baking', label: 'Cooking & Baking', icon: ChefHat },
    { id: 'Tutoring & Mentoring', label: 'Tutoring & Mentoring', icon: GraduationCap },
    { id: 'Crafts & Tailoring', label: 'Crafts & Tailoring', icon: Scissors },
    { id: 'Gardening & Agriculture', label: 'Gardening & Agriculture', icon: Sprout },
    { id: 'Home Maintenance', label: 'Home Repair & Help', icon: Wrench },
  ]

  const loadServices = async () => {
    setLoading(true)
    try {
      const data = await api.getServices(selectedCategory, searchQuery)
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
        `${bookingDate} (Duration: ${bookingHours} hours)`,
        bookingNotes
      )
      setBookingMessage('Booking request sent successfully to senior provider!')
      setTimeout(() => {
        setBookingMessage(null)
        setSelectedService(null)
        onBookingSuccess()
      }, 2000)
    } catch (err: any) {
      setBookingMessage(`Booking Error: ${err.message}`)
    } finally {
      setBookingSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner for Senior Services */}
      <div className={`rounded-3xl p-8 shadow-sm border-2 ${
        highContrast ? 'bg-black text-amber-300 border-amber-400' : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white border-amber-400'
      }`}>
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>100% Verified Senior Craftsmen & Mentors</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black leading-tight">
            Discover Lifelong Expertise in Your Neighborhood
          </h2>
          <p className="text-lg opacity-95 leading-relaxed font-medium">
            Connect with experienced senior citizens and homemakers offering traditional home cooking, artisanal tailoring, academic tutoring, and organic garden consultation.
          </p>
        </div>
      </div>

      {/* Category Filter Chips & Search Bar */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services (e.g. sourdough, math tutoring, tailoring)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-13 pr-4 py-4 rounded-2xl border-2 text-lg font-semibold transition-all focus:outline-none ${
                highContrast
                  ? 'bg-zinc-900 border-amber-400 text-white focus:ring-2 focus:ring-amber-300'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 shadow-xs'
              }`}
            />
          </div>
          <button
            type="submit"
            className={`btn-large ${
              highContrast ? 'bg-amber-400 text-black border-2 border-white' : 'bg-slate-900 text-amber-400 hover:bg-slate-800'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Search Market</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className={`btn-large ${
              showMap
                ? 'bg-amber-500 text-white'
                : highContrast ? 'bg-zinc-800 text-amber-300 border border-amber-400' : 'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span>{showMap ? 'Hide Map View' : 'Show Map View'}</span>
          </button>
        </form>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? highContrast
                      ? 'bg-amber-400 text-black shadow-md border-2 border-white'
                      : 'bg-amber-500 text-white shadow-md'
                    : highContrast
                      ? 'bg-zinc-900 text-amber-300 border border-amber-400/40 hover:bg-zinc-800'
                      : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? (highContrast ? 'text-black' : 'text-white') : 'text-amber-600'}`} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Map View Indicator */}
      {showMap && (
        <div className={`card-senior overflow-hidden border-2 ${
          highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-white border-slate-300'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-amber-600" />
              <h3 className="text-xl font-extrabold">Senior Provider Neighborhood Locations</h3>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">Interactive OpenStreetMap</span>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  📍
                </div>
                <div>
                  <p className="font-extrabold text-sm text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{s.provider_name} • {s.location_name}</p>
                  <span className="inline-block mt-2 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    ${s.price_per_hour}/hr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="py-16 text-center text-slate-500 space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-bold">Loading senior marketplace listings...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-extrabold text-lg">Unable to load marketplace</h4>
            <p className="text-sm text-rose-700">{error}</p>
            <button
              onClick={loadServices}
              className="mt-3 px-4 py-2 bg-rose-600 text-white font-bold rounded-lg text-sm"
            >
              Retry Loading
            </button>
          </div>
        </div>
      )}

      {/* Services Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`card-senior flex flex-col justify-between transition-all duration-200 border-2 ${
                highContrast
                  ? 'bg-zinc-900 border-amber-400 text-white hover:border-white'
                  : 'bg-white border-slate-200 hover:border-amber-400'
              }`}
            >
              <div>
                {/* Header Profile Info */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={service.provider_avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                      alt={service.provider_name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-xs"
                    />
                    <div>
                      <h3 className="font-extrabold text-lg leading-snug">{service.provider_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-amber-700 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Verified Senior Craftsman</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-black px-3 py-1 rounded-xl text-sm">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{service.rating || 5.0}</span>
                    </span>
                  </div>
                </div>

                {/* Listing Details */}
                <div className="mt-4 space-y-3">
                  <div className="inline-block bg-slate-100 text-slate-800 text-xs font-black uppercase px-3 py-1 rounded-md">
                    {service.category}
                  </div>

                  <h4 className="text-xl font-black text-slate-900 leading-tight">
                    {service.title}
                  </h4>

                  <p className="text-slate-600 text-base leading-relaxed line-clamp-3">
                    {service.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm font-semibold text-slate-500 pt-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span>{service.location_name || 'Neighborhood'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Flexible Hours</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Hourly Rate</span>
                  <p className="text-2xl font-black text-amber-600">${service.price_per_hour} <span className="text-sm font-bold text-slate-500">/ hour</span></p>
                </div>

                <button
                  onClick={() => setSelectedService(service)}
                  className={`btn-large ${
                    highContrast ? 'bg-amber-400 text-black border-2 border-white' : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Service</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`card-senior max-w-xl w-full p-6 space-y-6 relative border-2 ${
            highContrast ? 'bg-zinc-900 text-white border-amber-400' : 'bg-white text-slate-900 border-slate-300'
          }`}>
            <button
              onClick={() => setSelectedService(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 border-b pb-4">
              <img
                src={selectedService.provider_avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                alt={selectedService.provider_name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h3 className="text-xl font-black">{selectedService.title}</h3>
                <p className="text-sm text-slate-500 font-bold">With {selectedService.provider_name}</p>
              </div>
            </div>

            {bookingMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{bookingMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Select Scheduled Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Duration (Hours)</label>
                <select
                  value={bookingHours}
                  onChange={(e) => setBookingHours(Number(e.target.value))}
                  className="w-full p-3 border-2 border-slate-300 rounded-xl font-bold"
                >
                  <option value={1}>1 Hour (${(selectedService.price_per_hour * 1).toFixed(2)})</option>
                  <option value={2}>2 Hours (${(selectedService.price_per_hour * 2).toFixed(2)})</option>
                  <option value={3}>3 Hours (${(selectedService.price_per_hour * 3).toFixed(2)})</option>
                  <option value={4}>4 Hours (${(selectedService.price_per_hour * 4).toFixed(2)})</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Notes for Senior Provider</label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between font-black text-amber-900">
                <span>Total Estimated Price:</span>
                <span className="text-2xl">${(selectedService.price_per_hour * bookingHours).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedService(null)}
                className="btn-large w-1/2 bg-slate-200 text-slate-800 hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={bookingSubmitting}
                className="btn-large w-1/2 bg-amber-500 text-white hover:bg-amber-600"
              >
                {bookingSubmitting ? 'Sending Request...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
