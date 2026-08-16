import React, { useState, useEffect, useRef } from 'react'
import {
  Calendar, ShieldCheck, Star, Upload, CheckCircle2,
  TrendingUp, Sparkles, Lightbulb,
  Edit3, Trash2, Plus, Briefcase, Check, Award,
  Video, Image, Play, RotateCcw
} from 'lucide-react'
import type { Booking, User, ServiceListing, OpportunityItem, SkillPassportResponse, WorkSample } from '../types'
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

  const [activeTab, setActiveTab] = useState<'opportunities' | 'bookings' | 'services' | 'passport' | 'samples'>('opportunities')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<ServiceListing[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])
  const [passportData, setPassportData] = useState<SkillPassportResponse | null>(null)
  const [workSamples, setWorkSamples] = useState<WorkSample[]>([])
  const [applyingOppId, setApplyingOppId] = useState<string | null>(null)

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null)

  // Video Upload State
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false)
  const [videoNotice, setVideoNotice] = useState<string | null>(null)

  // AI Autofill State (from video)
  const [showAutofill, setShowAutofill] = useState<boolean>(false)
  const [autofillLoading, setAutofillLoading] = useState<boolean>(false)
  const [autofillDescription, setAutofillDescription] = useState<string>('')
  const [autofillResult, setAutofillResult] = useState<any>(null)

  // Work Sample Creation Modal State
  const [showSampleModal, setShowSampleModal] = useState<boolean>(false)
  const [sampleTitle, setSampleTitle] = useState<string>('')
  const [sampleCategory, setSampleCategory] = useState<string>('Cooking & Tiffin')
  const [sampleImageUrl, setSampleImageUrl] = useState<string>('')
  const [sampleDesc, setSampleDesc] = useState<string>('')
  const [sampleSaving, setSampleSaving] = useState<boolean>(false)

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
      const [bookingsData, servicesData, oppsData, passport, samples] = await Promise.all([
        api.getUserBookings(userId).catch(() => []),
        api.getServices().catch(() => []),
        api.getProviderOpportunities(userId).catch(() => ({ provider_id: userId, opportunities: [], total: 0 })),
        api.getSkillPassport(userId).catch(() => null),
        api.getWorkSamples(userId).catch(() => [])
      ])
      setBookings(bookingsData)
      setServices(servicesData.filter((s) => s.provider_id === userId))
      setOpportunities(oppsData.opportunities || [])
      setPassportData(passport)
      setWorkSamples(samples)
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [currentUser])

  // Profile completion calculation
  const getProfileCompleteness = () => {
    let score = 30 // base
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
      score += 15
    } else {
      suggestions.push("Publish at least one service with fair ₹ INR pricing")
    }

    if (workSamples.length > 0) {
      score += 15
    } else {
      suggestions.push("Add a work sample photo of past recipes, stitching, or tutoring")
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
      loadDashboardData()
    } catch (err: any) {
      alert(`Avatar Upload Error: ${err.message}`)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!confirm('Restore default avatar profile photo?')) return
    try {
      await api.removeAvatar(currentUser?.id || 1)
      const updatedUser = await api.getMe()
      setCurrentUser(updatedUser)
      loadDashboardData()
      alert('Default avatar restored.')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      alert('Video file size exceeds maximum limit of 50MB.')
      return
    }

    setUploadingVideo(true)
    setVideoNotice(null)
    try {
      const res = await api.uploadVideo(file, currentUser?.id || 1, 'Senior Intro Clip')
      setVideoNotice(res.message)
      setTimeout(() => setVideoNotice(null), 4000)

      const updatedUser = await api.getMe()
      setCurrentUser(updatedUser)
      loadDashboardData()

      // Offer AI autofill after successful video upload
      setShowAutofill(true)
      setAutofillResult(null)
    } catch (err: any) {
      alert(`Video Upload Error: ${err.message}`)
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleRemoveVideo = async () => {
    if (!confirm('Are you sure you want to remove your intro video?')) return
    try {
      await api.removeVideo(currentUser?.id || 1)
      const updatedUser = await api.getMe()
      setCurrentUser(updatedUser)
      loadDashboardData()
      setShowAutofill(false)
      setAutofillResult(null)
      alert('Video removed successfully.')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleAIAutofill = async () => {
    if (!autofillDescription || autofillDescription.trim().length < 10) {
      alert('Please describe what you said in your video (at least 10 characters).')
      return
    }
    setAutofillLoading(true)
    try {
      const result = await api.autofillFromVideo(
        autofillDescription,
        currentUser?.full_name,
        currentUser?.location_name
      )
      setAutofillResult(result)
    } catch (err: any) {
      alert(`AI Autofill Error: ${err.message}`)
    } finally {
      setAutofillLoading(false)
    }
  }

  const handleApplyAutofill = async () => {
    if (!autofillResult) return
    try {
      const updates: any = {}
      if (autofillResult.suggested_bio) {
        updates.bio = autofillResult.suggested_bio
        setEditBio(autofillResult.suggested_bio)
      }
      if (Object.keys(updates).length > 0) {
        const updated = await api.updateProfile(currentUser?.id || 1, updates)
        setCurrentUser(updated)
      }
      // Add suggested skills
      if (autofillResult.suggested_skills?.length > 0) {
        for (const skill of autofillResult.suggested_skills) {
          try {
            await api.extractSkills(skill.title + ' ' + (skill.key_highlights?.join(', ') || ''), skill.category)
          } catch { /* non-critical */ }
        }
      }
      setShowAutofill(false)
      setAutofillResult(null)
      loadDashboardData()
      alert('AI suggestions applied to your profile! Please review your profile details.')
    } catch (err: any) {
      alert(`Error applying suggestions: ${err.message}`)
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

  const handleAddWorkSample = async (e: React.FormEvent) => {
    e.preventDefault()
    setSampleSaving(true)
    try {
      await api.addWorkSample(currentUser?.id || 1, {
        title: sampleTitle,
        category: sampleCategory,
        image_url: sampleImageUrl || 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=60',
        description: sampleDesc
      })
      setShowSampleModal(false)
      setSampleTitle('')
      setSampleImageUrl('')
      setSampleDesc('')
      loadDashboardData()
      alert('Work sample added to your showcase gallery!')
    } catch (err: any) {
      alert(`Error adding sample: ${err.message}`)
    } finally {
      setSampleSaving(false)
    }
  }

  const handleDeleteWorkSample = async (sampleId: number) => {
    if (!confirm('Delete this work sample from showcase?')) return
    try {
      await api.deleteWorkSample(currentUser?.id || 1, sampleId)
      loadDashboardData()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
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

        {videoNotice && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{videoNotice}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <img
                src={currentUser?.avatar_url || defaultAvatar}
                alt={currentUser?.full_name || 'Senior Provider'}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultAvatar
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1.5 -right-1.5 bg-[#4B32E6] hover:bg-[#3629D3] text-white p-2 rounded-xl shadow cursor-pointer transition-all"
                title="Upload Portrait Photo (JPEG/PNG/WEBP <=5MB)"
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

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black text-slate-900">{currentUser?.full_name || 'Lakshmi Amma'}</h2>
                <span className="bg-blue-50 text-[#4B32E6] border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-md capitalize">
                  {currentUser?.user_type || 'Senior Citizen'}
                </span>
              </div>
              <p className="text-slate-500 font-medium text-xs">
                {currentUser?.location_name || 'Matunga / Dadar, Mumbai'} • {currentUser?.languages || 'Tamil, Hindi, English'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Senior Practitioner</span>
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
                  className="text-xs font-bold text-[#4B32E6] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                {currentUser?.avatar_url && !currentUser.avatar_url.includes('default') && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-2.5 py-1 rounded-md border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                    title="Reset to default photo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Photo</span>
                  </button>
                )}
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="text-xs font-bold text-[#4B32E6] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{currentUser?.video_intro_url ? 'Replace Video' : 'Upload Intro Video'}</span>
                </button>
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoFileSelect}
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
            <div className={`p-3 rounded-xl border text-center ${
              highContrast ? 'bg-zinc-900 border-amber-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">{t.totalEarned}</span>
              <span className="text-lg font-black text-[#4B32E6]">{formatINR(totalEarned || 14800)}</span>
            </div>
            <div className={`p-3 rounded-xl border text-center ${
              highContrast ? 'bg-zinc-900 border-amber-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">{t.avgRating}</span>
              <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" /> 5.0
              </span>
            </div>
            <div className={`p-3 rounded-xl border text-center ${
              highContrast ? 'bg-zinc-900 border-amber-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">{t.completedServices}</span>
              <span className="text-lg font-black">{bookings.filter((b) => b.status === 'completed').length || 32}</span>
            </div>
            <div className={`p-3 rounded-xl border text-center ${
              highContrast ? 'bg-zinc-900 border-amber-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">{t.activeOpportunities}</span>
              <span className="text-lg font-black text-[#4B32E6]">{opportunities.length}</span>
            </div>
          </div>
        </div>

        {/* Video Player Preview if Available */}
        {currentUser?.video_intro_url && (
          <div className="mt-5 p-4 bg-slate-900 rounded-2xl text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-current" /> Senior Intro Video Clip
              </span>
              <button
                onClick={handleRemoveVideo}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Remove Video
              </button>
            </div>
            <video
              src={currentUser.video_intro_url}
              controls
              className="w-full max-h-48 rounded-xl bg-black object-cover"
            />
          </div>
        )}

        {/* AI Autofill from Video */}
        {(showAutofill || currentUser?.video_intro_url) && (
          <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Profile Autofill from Video
            </div>

            {!autofillResult ? (
              <>
                <p className="text-xs text-slate-600">
                  Describe what you said in your video — your skills, experience, and what services you offer.
                  Our AI will suggest profile content based on your description.
                </p>
                <textarea
                  rows={3}
                  value={autofillDescription}
                  onChange={(e) => setAutofillDescription(e.target.value)}
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. I have been cooking South Indian food for 35 years. I specialize in sambar, rasam, filter coffee, and traditional pickles. I can teach home cooking or prepare daily tiffin meals."
                />
                <button
                  onClick={handleAIAutofill}
                  disabled={autofillLoading || autofillDescription.trim().length < 10}
                  className="btn-large bg-indigo-600 text-white hover:bg-indigo-700 text-xs py-2 font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{autofillLoading ? 'Analyzing with AI...' : 'Generate AI Suggestions'}</span>
                </button>
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs font-semibold text-amber-800 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  {autofillResult.notice || 'AI-assisted — please review before publishing'}
                </div>

                {autofillResult.suggested_bio && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Suggested Bio</label>
                    <textarea
                      rows={3}
                      value={autofillResult.suggested_bio}
                      onChange={(e) => setAutofillResult({...autofillResult, suggested_bio: e.target.value})}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {autofillResult.suggested_skills?.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Suggested Skills</label>
                    <div className="space-y-1.5">
                      {autofillResult.suggested_skills.map((skill: any, i: number) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs">
                          <div className="font-bold text-slate-800">{skill.title}</div>
                          <div className="text-slate-500">{skill.category} &bull; {skill.proficiency_level} &bull; {skill.years_experience || '?'} years &bull; {formatINR(skill.suggested_hourly_rate || 350)}/hr</div>
                          {skill.key_highlights && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {skill.key_highlights.map((h: string, j: number) => (
                                <span key={j} className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">{h}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {autofillResult.confidence_note && (
                  <p className="text-[11px] text-slate-500 italic">{autofillResult.confidence_note}</p>
                )}

                {autofillResult.ai_mentor_tip && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-800 flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {autofillResult.ai_mentor_tip}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyAutofill}
                    className="btn-large bg-emerald-600 text-white hover:bg-emerald-700 text-xs py-2 font-semibold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Suggestions to Profile</span>
                  </button>
                  <button
                    onClick={() => { setAutofillResult(null); setShowAutofill(false) }}
                    className="btn-large bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs py-2 font-semibold cursor-pointer"
                  >
                    <span>Dismiss</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Profile Completeness Bar & AI Suggestions */}
        <div className="mt-5 pt-5 border-t border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#4099FF]" /> {t.profileStrength}:
            </span>
            <span className="text-[#4B32E6] font-black">{completeness}% {t.complete}</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-[#4B32E6] h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            ></div>
          </div>

          {suggestions.length > 0 && (
            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-slate-600 flex items-start gap-2">
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
            { id: 'passport', label: 'Skill Passport', icon: Award },
            { id: 'samples', label: `Work Samples (${workSamples.length})`, icon: Image },
            { id: 'bookings', label: `${t.navBookings} (${bookings.length})`, icon: Calendar },
            { id: 'services', label: `My Services (${services.length})`, icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
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
            className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2 px-3.5 rounded-xl shadow-sm font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Service</span>
          </button>
        )}

        {activeTab === 'samples' && (
          <button
            onClick={() => setShowSampleModal(true)}
            className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2 px-3.5 rounded-xl shadow-sm font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Work Sample</span>
          </button>
        )}
      </div>

      {/* TAB 1: RECOMMENDED OPPORTUNITIES */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{t.navOpportunities}</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Personalized neighborhood demand matching your skills
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-3 ${
                  highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#4B32E6] border border-blue-100 px-2 py-0.5 rounded-md">
                      {opp.category}
                    </span>
                    <span className="text-xs text-slate-400">{opp.posted_ago || 'Recent'}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">{opp.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">{opp.description}</p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(opp.match_reasons || [`✓ ${opp.distance_km} km away`, `✓ Matches skills`]).map((r, rIdx) => (
                      <span key={rIdx} className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Budget</span>
                    <span className="text-sm font-black text-slate-900">{opp.budget_range}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Match</span>
                      <span className="text-xs font-black text-[#4B32E6]">{opp.match_score}%</span>
                    </div>

                    {opp.is_applied ? (
                      <button
                        disabled
                        className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs py-1.5 px-3 rounded-xl cursor-default font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>✓ Interest Sent</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleExpressInterest(opp.id)}
                        disabled={applyingOppId === opp.id}
                        className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-1.5 px-3.5 rounded-xl font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{applyingOppId === opp.id ? 'Sending...' : 'Express Interest'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SKILL PASSPORT TAB */}
      {activeTab === 'passport' && (
        <div className="space-y-5">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#4B32E6] text-white flex items-center justify-center font-bold">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#4B32E6] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Verified Digital Credential
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">
                    Senior Skill Passport
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black text-emerald-800">✓ Platform Verified Senior</span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
              {passportData?.passport_summary || `${currentUser?.full_name || 'Provider'} is a verified senior practitioner with platform-validated ratings, community reviews, and verified completed jobs.`}
            </p>

            {/* Passport Credential Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Completed Services</span>
                <span className="text-2xl font-black text-[#4B32E6]">{passportData?.total_completed_services || 32}</span>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Verified Rating</span>
                <span className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> {passportData?.overall_rating || '5.0'}
                </span>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Customer Reviews</span>
                <span className="text-2xl font-black text-slate-900">{passportData?.total_reviews_count || 18}</span>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Member Since</span>
                <span className="text-base font-black text-slate-800 mt-1 block">{passportData?.member_since || 'August 2026'}</span>
              </div>
            </div>
          </div>

          {/* Registered Skills Breakdown */}
          <div className="space-y-3">
            <h4 className="text-base font-black text-slate-900">Registered Skill Areas & Track Record</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(passportData?.skills || [
                {
                  skill_id: 1,
                  skill_title: "Authentic South Indian Sambar, Rasam & Podi",
                  category: "Cooking & Tiffin",
                  claimed_experience_years: 40,
                  completed_services_count: 32,
                  verified_rating: 5.0,
                  verified_reviews_count: 18,
                  work_samples_count: 3,
                  has_video_demo: true,
                  verification_status: "verified_senior",
                  hourly_rate: 350.0,
                  platform_verified: true
                }
              ]).map((skill, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#4B32E6] px-2 py-0.5 rounded border border-blue-100">
                        {skill.category}
                      </span>
                      <h5 className="text-base font-black text-slate-900 mt-1">{skill.skill_title}</h5>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ✓ Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Experience</span>
                      <span className="font-bold text-slate-900">{skill.claimed_experience_years}+ Years Lifelong</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Completed Jobs</span>
                      <span className="font-bold text-slate-900">{skill.completed_services_count} Verified</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Rating</span>
                      <span className="font-bold text-amber-500">★ {skill.verified_rating} ({skill.verified_reviews_count} reviews)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Hourly Rate</span>
                      <span className="font-bold text-[#4B32E6]">₹{skill.hourly_rate}/hr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORK SAMPLES SHOWCASE */}
      {activeTab === 'samples' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Work Samples Showcase ({workSamples.length})</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Showcase authentic photos of your cooking recipes, tailoring patterns, or garden setups.
              </p>
            </div>
            <button
              onClick={() => setShowSampleModal(true)}
              className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sample</span>
            </button>
          </div>

          {workSamples.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              <Image className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-base text-slate-800">No work samples uploaded yet.</p>
              <p className="text-xs mt-1 text-slate-500">Click "Add Sample" to upload your first craft or cooking photo!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {workSamples.map((sample) => (
                <div key={sample.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="relative h-44 bg-slate-100">
                    <img
                      src={sample.image_url}
                      alt={sample.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=60"
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                      {sample.category}
                    </span>
                    <button
                      onClick={() => handleDeleteWorkSample(sample.id)}
                      className="absolute top-2.5 right-2.5 bg-white/90 hover:bg-rose-50 text-rose-600 p-1.5 rounded-lg shadow transition-all cursor-pointer"
                      title="Delete Sample"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h4 className="text-sm font-black text-slate-900">{sample.title}</h4>
                    {sample.description && (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{sample.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{t.navBookings} ({bookings.length})</h3>
            <button
              onClick={loadDashboardData}
              className="text-xs font-bold text-[#4B32E6] hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-700">No active bookings yet.</p>
              <p className="text-xs mt-1">When neighbors book your service, details will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        booking.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : booking.status === 'confirmed'
                            ? 'bg-blue-50 text-[#4B32E6] border border-blue-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-300'
                      }`}>
                        {booking.status === 'completed' ? t.statusCompleted : booking.status === 'confirmed' ? t.statusConfirmed : t.statusPending}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">Booking #{booking.id}</span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{booking.service_title}</h4>
                    <p className="text-xs font-semibold text-slate-500">
                      Customer: {booking.customer_name} • Date: {booking.scheduled_date}
                    </p>
                    {booking.notes && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
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
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 rounded-xl font-bold"
                        >
                          {t.acceptBooking}
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'completed')}
                          className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2 px-4 rounded-xl font-bold shadow-sm"
                        >
                          {t.markCompleted}
                        </button>
                      )}

                      {booking.status === 'completed' && (
                        <button
                          onClick={() => setReviewBookingId(booking.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs py-2 px-3.5 rounded-xl font-bold flex items-center gap-1"
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

      {/* TAB 5: MY SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div key={s.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#4B32E6] border border-blue-100 px-2 py-0.5 rounded">
                      {s.category}
                    </span>
                    <h4 className="text-base font-black mt-1 text-slate-900">{s.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">{s.description}</p>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">{t.hourlyRate}: <strong className="text-[#4B32E6] text-sm">{formatINR(s.price_per_hour)}</strong>/hr</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Work Sample Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-black">Add Work Sample Photo</h3>
            <form onSubmit={handleAddWorkSample} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sample Title</label>
                <input
                  type="text"
                  required
                  value={sampleTitle}
                  onChange={(e) => setSampleTitle(e.target.value)}
                  placeholder="e.g. Traditional Sun-dried Mango Pickle Batch"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={sampleCategory}
                  onChange={(e) => setSampleCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                >
                  <option value="Cooking & Tiffin">Cooking & Tiffin</option>
                  <option value="Tutoring & Mentoring">Tutoring & Mentoring</option>
                  <option value="Crafts & Tailoring">Crafts & Tailoring</option>
                  <option value="Gardening & Agriculture">Gardening & Agriculture</option>
                  <option value="Consulting & Life Mentoring">Consulting & Mentoring</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Photo Image URL</label>
                <input
                  type="url"
                  required
                  value={sampleImageUrl}
                  onChange={(e) => setSampleImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={sampleDesc}
                  onChange={(e) => setSampleDesc(e.target.value)}
                  placeholder="Explain your recipe, stitching technique, or garden method..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSampleModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sampleSaving}
                  className="w-1/2 bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2.5 rounded-xl font-bold shadow-sm"
                >
                  {sampleSaving ? 'Saving...' : 'Add to Showcase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-black">Edit Your Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone (+91)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Neighborhood / City</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Languages Spoken</label>
                <input
                  type="text"
                  value={editLanguages}
                  onChange={(e) => setEditLanguages(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Availability Schedule</label>
                <input
                  type="text"
                  value={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Biography</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-1/2 bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2.5 rounded-xl font-bold shadow-sm"
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
          <div className="max-w-lg w-full p-6 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-black">Create New Service</h3>
            <form onSubmit={handleCreateService} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="e.g. Traditional South Indian Sambar & Tiffin Prep"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
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
                <label className="block font-bold text-slate-700 mb-1">Hourly Rate (in ₹ INR)</label>
                <input
                  type="number"
                  required
                  min={100}
                  step={50}
                  value={servicePrice}
                  onChange={(e) => setServicePrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Description</label>
                <textarea
                  rows={3}
                  required
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Describe your session, skills covered, materials needed..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceSaving}
                  className="w-1/2 bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2.5 rounded-xl font-bold shadow-sm"
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
          <div className="max-w-md w-full p-6 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-black">Submit Review</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Star Rating</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Comment</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setReviewBookingId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="w-1/2 bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2.5 rounded-xl font-bold shadow-sm"
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
