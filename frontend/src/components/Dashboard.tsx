import React, { useState, useEffect, useRef } from 'react'
import {
  Calendar, ShieldCheck, Star, Upload, CheckCircle2,
  TrendingUp, Sparkles, Lightbulb,
  Edit3, Trash2, Plus, Briefcase, Check
} from 'lucide-react'
import type { Booking, User, ServiceListing, OpportunityItem } from '../types'
import { api } from '../services/api'
import { formatINR } from '../utils/formatters'
import { translations, type Language } from '../i18n/translations'

interface DashboardProps {
  highContrast: boolean
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  language?: Language
}

export const Dashboard: React.FC<DashboardProps> = ({ highContrast, currentUser, setCurrentUser, language = 'en' }) => {
  const t = translations[language]

  const [activeTab, setActiveTab] = useState<'opportunities' | 'bookings' | 'services'>('opportunities')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<ServiceListing[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])
  const [applyingOppId, setApplyingOppId] = useState<string | null>(null)

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null)

  // Edit Profile State
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false)
  const [editFullName, setEditFullName] = useState<string>(currentUser?.full_name || '')
  const [editPhone, setEditPhone] = useState<string>(currentUser?.phone || '')
  const [editBio, setEditBio] = useState<string>(currentUser?.bio || '')
  const [editLocation, setEditLocation] = useState<string>(currentUser?.location_name || '')
  const [editLanguages, setEditLanguages] = useState<string>(currentUser?.languages || '')
  const [editAvailability, setEditAvailability] = useState<string>(currentUser?.availability || '')
  const [profileSaving, setProfileSaving] = useState<boolean>(false)

  // Create/Edit Service Modal State
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false)
  const [serviceTitle, setServiceTitle] = useState<string>('')
  const [serviceCategory, setServiceCategory] = useState<string>('Cooking & Tiffin')
  const [servicePrice, setServicePrice] = useState<number>(350)
  const [serviceDesc, setServiceDesc] = useState<string>('')
  const [serviceSaving, setServiceSaving] = useState<boolean>(false)

  // Review Modal State
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('Wonderful senior experience! Highly recommended.')
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false)

  const defaultAvatar = "/avatars/seed/lakshmi_amma.jpg"

  const loadDashboardData = async () => {
    const userId = currentUser?.id || 1
    try {
      const [bookingsData, servicesData, oppsData] = await Promise.all([
        api.getUserBookings(userId).catch(() => []),
        api.getServices().catch(() => []),
        api.getProviderOpportunities(userId).catch(() => ({ provider_id: userId, opportunities: [], total: 0 }))
      ])
      setBookings(bookingsData)
      setServices(servicesData.filter((s) => s.provider_id === userId))
      setOpportunities(oppsData.opportunities || [])
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [currentUser])

  // Profile completion calculation
  const getProfileCompleteness = () => {
    let score = 40 // base
    const suggestions: string[] = []

    if (currentUser?.avatar_url && !currentUser.avatar_url.includes('default')) {
      score += 15
    } else {
      suggestions.push("Upload your real portrait photo to build client trust")
    }

    if (currentUser?.bio && currentUser.bio.length > 30) {
      score += 15
    } else {
      suggestions.push("Add a detailed biography describing your lifelong craftsmanship")
    }

    if (currentUser?.languages) {
      score += 10
    } else {
      suggestions.push("Specify languages you speak (e.g. Tamil, Hindi, English)")
    }

    if (services.length > 0) {
      score += 20
    } else {
      suggestions.push("Publish at least one service with fair ₹ INR pricing")
    }

    return { percentage: Math.min(100, score), suggestions }
  }

  const { percentage: completeness, suggestions } = getProfileCompleteness()

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid format. Please upload JPEG, PNG, or WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds maximum size limit of 5MB.')
      return
    }

    setUploadingAvatar(true)
    setAvatarNotice(null)
    try {
      const res = await api.uploadAvatar(file, currentUser?.id || 1)
      setAvatarNotice(res.message)
      setTimeout(() => setAvatarNotice(null), 4000)

      const updatedUser = await api.getMe()
      setCurrentUser(updatedUser)
    } catch (err: any) {
      alert(`Avatar Upload Error: ${err.message}`)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      const updated = await api.updateProfile(currentUser?.id || 1, {
        full_name: editFullName,
        phone: editPhone,
        bio: editBio,
        location_name: editLocation,
        languages: editLanguages,
        availability: editAvailability
      })
      setCurrentUser(updated)
      setShowEditProfile(false)
      alert('Profile updated successfully!')
    } catch (err: any) {
      alert(`Profile update error: ${err.message}`)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    setServiceSaving(true)
    try {
      await api.createService({
        title: serviceTitle,
        category: serviceCategory,
        price_per_hour: Number(servicePrice),
        description: serviceDesc,
        location_name: currentUser?.location_name || 'Mumbai, Maharashtra'
      }, currentUser?.id || 1)

      setShowServiceModal(false)
      setServiceTitle('')
      setServiceDesc('')
      loadDashboardData()
      alert('New service created and published to live marketplace!')
    } catch (err: any) {
      alert(`Service creation error: ${err.message}`)
    } finally {
      setServiceSaving(false)
    }
  }

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('Are you sure you want to remove this service listing?')) return
    try {
      await api.deleteService(serviceId)
      loadDashboardData()
    } catch (err: any) {
      alert(`Error deleting service: ${err.message}`)
    }
  }

  const handleExpressInterest = async (oppId: string) => {
    setApplyingOppId(oppId)
    try {
      const res = await api.expressInterest(currentUser?.id || 1, oppId)
      if (res.success) {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === oppId ? { ...o, is_applied: true } : o))
        )
      }
    } catch (err: any) {
      alert(`Express Interest: ${err.message}`)
    } finally {
      setApplyingOppId(null)
    }
  }

  const handleUpdateStatus = async (bookingId: number, status: string) => {
    try {
      await api.updateBookingStatus(bookingId, status)
      loadDashboardData()
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewBookingId) return
    setReviewSubmitting(true)
    try {
      await api.submitReview(reviewBookingId, rating, comment, currentUser?.id || 2)
      alert('Thank you! Your verified review has been posted.')
      setReviewBookingId(null)
      loadDashboardData()
    } catch (err: any) {
      alert(`Review error: ${err.message}`)
    } finally {
      setReviewSubmitting(false)
    }
  }

  const totalEarned = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Profile Overview Card (Hexaware Enterprise Theme) */}
      <div className={`p-6 md:p-8 rounded-2xl border shadow-sm ${
        highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {avatarNotice && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{avatarNotice}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <img
                src={currentUser?.avatar_url || defaultAvatar}
                alt={currentUser?.full_name || 'Senior Provider'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultAvatar
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1.5 -right-1.5 bg-[#4B32E6] hover:bg-[#3629D3] text-white p-1.5 rounded-lg shadow cursor-pointer transition-all"
                title="Upload Portrait Photo"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileSelect}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black text-slate-900">{currentUser?.full_name || 'Meenakshi Amma'}</h2>
                <span className="bg-blue-50 text-[#4B32E6] border border-blue-200 text-xs font-bold px-2 py-0.5 rounded capitalize">
                  {currentUser?.user_type || 'Senior Citizen'}
                </span>
              </div>
              <p className="text-slate-500 font-medium text-xs">
                {currentUser?.location_name || 'Matunga / Dadar, Mumbai'} • {currentUser?.languages || 'Tamil, Hindi, English'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.verifiedSenior}</span>
                </span>
                <button
                  onClick={() => {
                    setEditFullName(currentUser?.full_name || '')
                    setEditPhone(currentUser?.phone || '')
                    setEditBio(currentUser?.bio || '')
                    setEditLocation(currentUser?.location_name || '')
                    setEditLanguages(currentUser?.languages || '')
                    setEditAvailability(currentUser?.availability || '')
                    setShowEditProfile(true)
                  }}
                  className="text-xs font-semibold text-[#4B32E6] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
            <div className={`p-3 rounded-xl border text-center ${
              highContrast ? 'bg-zinc-900 border-amber-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">{t.totalEarned}</span>
              <span className="text-lg font-black text-[#4B32E6]">{formatINR(totalEarned)}</span>
            </div>
            <div className={`p-3 rounded-xl border text-center ${
              highContrast ? 'bg-zinc-900 border-amber-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">{t.avgRating}</span>
              <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" /> 5.0
              </span>
            </div>
            <div className={`p-3 rounded-xl border text-center ${
              highContrast ? 'bg-zinc-900 border-amber-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">{t.completedServices}</span>
              <span className="text-lg font-black">{bookings.filter((b) => b.status === 'completed').length || 28}</span>
            </div>
            <div className={`p-3 rounded-xl border text-center ${
              highContrast ? 'bg-zinc-900 border-amber-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">{t.activeOpportunities}</span>
              <span className="text-lg font-black text-[#4B32E6]">{opportunities.length}</span>
            </div>
          </div>
        </div>

        {/* Profile Completeness Bar & AI Suggestions */}
        <div className="mt-5 pt-5 border-t border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#4099FF]" /> {t.profileStrength}:
            </span>
            <span className="text-[#4B32E6] font-bold">{completeness}% {t.complete}</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-[#4B32E6] h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            ></div>
          </div>

          {suggestions.length > 0 && (
            <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100 text-xs text-slate-600 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-[#4099FF] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#4B32E6]">AI Recommendation: </span>
                <span>{suggestions[0]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'opportunities', label: `${t.navOpportunities} (${opportunities.length})`, icon: TrendingUp },
            { id: 'bookings', label: `${t.navBookings} (${bookings.length})`, icon: Calendar },
            { id: 'services', label: `My Services (${services.length})`, icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#4B32E6] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {activeTab === 'services' && (
          <button
            onClick={() => setShowServiceModal(true)}
            className="btn-large btn-indigo text-xs py-1.5 px-3 shadow-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Service</span>
          </button>
        )}
      </div>

      {/* 1. Recommended Opportunities Tab with Express Interest */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{t.navOpportunities}</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Personalized neighborhood demand matching your skills
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between space-y-3 ${
                  highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#4B32E6] border border-blue-100 px-2 py-0.5 rounded">
                      {opp.category}
                    </span>
                    <span className="text-xs text-slate-400">{opp.posted_ago || 'Recent'}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">{opp.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{opp.description}</p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(opp.match_reasons || [`✓ ${opp.distance_km} km away`, `✓ Matches skills`]).map((r, rIdx) => (
                      <span key={rIdx} className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Budget</span>
                    <span className="text-sm font-black text-slate-900">{opp.budget_range}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Match</span>
                      <span className="text-xs font-black text-[#4B32E6]">{opp.match_score}%</span>
                    </div>

                    {opp.is_applied ? (
                      <button
                        disabled
                        className="btn-large bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs py-1.5 px-3 cursor-default font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.interestSent}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleExpressInterest(opp.id)}
                        disabled={applyingOppId === opp.id}
                        className="btn-large btn-indigo text-xs py-1.5 px-3.5 font-semibold shadow-sm flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#4099FF]" />
                        <span>{applyingOppId === opp.id ? 'Sending...' : t.expressInterest}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{t.navBookings} ({bookings.length})</h3>
            <button
              onClick={loadDashboardData}
              className="text-xs font-semibold text-[#4B32E6] hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-700">No active bookings yet.</p>
              <p className="text-xs mt-1">When neighbors book your service, details will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-5 rounded-xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        booking.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : booking.status === 'confirmed'
                            ? 'bg-blue-50 text-[#4B32E6] border border-blue-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-300'
                      }`}>
                        {booking.status === 'completed' ? t.statusCompleted : booking.status === 'confirmed' ? t.statusConfirmed : t.statusPending}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">Booking #{booking.id}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{booking.service_title}</h4>
                    <p className="text-xs font-medium text-slate-500">
                      Customer: {booking.customer_name} • Date: {booking.scheduled_date}
                    </p>
                    {booking.notes && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">
                        "{booking.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{t.hourlyRate} / Total</span>
                      <span className="text-xl font-black text-slate-900">{formatINR(booking.total_price)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          className="btn-large bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3.5 font-semibold"
                        >
                          {t.acceptBooking}
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'completed')}
                          className="btn-large btn-indigo text-xs py-1.5 px-3.5 font-semibold shadow-sm"
                        >
                          {t.markCompleted}
                        </button>
                      )}

                      {booking.status === 'completed' && (
                        <button
                          onClick={() => setReviewBookingId(booking.id)}
                          className="btn-large bg-amber-500 hover:bg-amber-600 text-white text-xs py-1.5 px-3 font-semibold flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{t.leaveReview}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. My Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div key={s.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#4B32E6] border border-blue-100 px-2 py-0.5 rounded">
                      {s.category}
                    </span>
                    <h4 className="text-base font-bold mt-1 text-slate-900">{s.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{t.hourlyRate}: <strong className="text-[#4B32E6] text-sm">{formatINR(s.price_per_hour)}</strong>/hr</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl">
            <h3 className="text-xl font-black">Edit Your Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone (+91)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Neighborhood / City</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Languages Spoken</label>
                <input
                  type="text"
                  value={editLanguages}
                  onChange={(e) => setEditLanguages(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Availability Schedule</label>
                <input
                  type="text"
                  value={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biography</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="btn-large w-1/2 bg-slate-100 text-slate-700 text-xs py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-large w-1/2 btn-indigo text-xs py-2 font-semibold shadow-sm"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl">
            <h3 className="text-xl font-black">Create New Service</h3>
            <form onSubmit={handleCreateService} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="e.g. Traditional South Indian Sambar & Tiffin Prep"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                >
                  <option value="Cooking & Tiffin">Cooking & Tiffin</option>
                  <option value="Tutoring & Mentoring">School Tuition & Mentoring</option>
                  <option value="Crafts & Tailoring">Saree Tailoring & Crafts</option>
                  <option value="Gardening & Agriculture">Terrace Kitchen Garden</option>
                  <option value="Consulting & Life Mentoring">Senior Life & Career Guidance</option>
                  <option value="Home Maintenance">Home Repair & Help</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hourly Rate (in ₹ INR)</label>
                <input
                  type="number"
                  required
                  min={100}
                  step={50}
                  value={servicePrice}
                  onChange={(e) => setServicePrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Description</label>
                <textarea
                  rows={3}
                  required
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Describe your session, skills covered, materials needed..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="btn-large w-1/2 bg-slate-100 text-slate-700 text-xs py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceSaving}
                  className="btn-large w-1/2 btn-indigo text-xs py-2 font-semibold shadow-sm"
                >
                  {serviceSaving ? 'Publishing...' : 'Publish Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewBookingId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl">
            <h3 className="text-xl font-black">Submit Review</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Select Star Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Comment</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setReviewBookingId(null)}
                className="btn-large w-1/2 bg-slate-100 text-slate-700 text-xs py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="btn-large w-1/2 btn-indigo text-xs py-2 font-semibold shadow-sm"
              >
                {reviewSubmitting ? 'Posting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
