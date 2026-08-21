import React, { useState, useEffect, useRef } from 'react'
import {
  Calendar, ShieldCheck, Star, Upload, CheckCircle2,
  TrendingUp, Sparkles, Lightbulb,
  Edit3, Trash2, Plus, Briefcase, Check, Award,
  Video, Image, Play, RotateCcw, Lock, Unlock,
  Mic, Volume2, MapPin, ChevronRight, X
} from 'lucide-react'
import type { Booking, User, ServiceListing, OpportunityItem, SkillPassportResponse, WorkSample, VideoItem, OpportunityRecommendation } from '../types'
import { api } from '../services/api'
import { formatINR } from '../utils/formatters'
import { translations, type Language } from '../i18n/translations'
import { LocationAutocomplete } from './LocationAutocomplete'
import { ReviewModal } from './ReviewModal'
import type { RatingBreakdown } from '../types'

interface DashboardProps {
  highContrast: boolean
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  language?: Language
  onStartVirtualCall?: (bookingId: number) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ highContrast, currentUser, setCurrentUser, language = 'en', onStartVirtualCall }) => {
  const t = translations[language]

  const [activeTab, setActiveTab] = useState<'opportunities' | 'recommendations' | 'videos' | 'bookings' | 'services' | 'passport' | 'samples'>('opportunities')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<ServiceListing[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])
  const [passportData, setPassportData] = useState<SkillPassportResponse | null>(null)
  const [workSamples, setWorkSamples] = useState<WorkSample[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [recommendations, setRecommendations] = useState<OpportunityRecommendation[]>([])
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
  const [editLatitude, setEditLatitude] = useState<number | undefined>(currentUser?.latitude)
  const [editLongitude, setEditLongitude] = useState<number | undefined>(currentUser?.longitude)
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
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null)
  const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown | null>(null)

  // Dedicated Video Gallery & Management State
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false)
  const [videoTitle, setVideoTitle] = useState<string>('')
  const [videoCat, setVideoCat] = useState<string>('Cooking & Tiffin')
  const [videoDesc, setVideoDesc] = useState<string>('')
  const [videoVisibility, setVideoVisibility] = useState<'public' | 'private'>('public')
  const [videoUrl, setVideoUrl] = useState<string>('https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-cutting-vegetables-40915-large.mp4')
  const [videoSaving, setVideoSaving] = useState<boolean>(false)
  const [aiGeneratingDesc, setAiGeneratingDesc] = useState<boolean>(false)
  const [aiVideoNotice, setAiVideoNotice] = useState<string | null>(null)
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'ta-IN' | 'hi-IN'>('en-IN')
  const [isListeningSpeech, setIsListeningSpeech] = useState<boolean>(false)
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false)
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null)
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null)

  // Service Radius Modal State
  const [showRadiusModal, setShowRadiusModal] = useState<boolean>(false)
  const [editRadius, setEditRadius] = useState<number>(currentUser?.service_radius || 10)
  const [radiusSaving, setRadiusSaving] = useState<boolean>(false)

  const defaultAvatar = "/avatars/seed/lakshmi_amma.jpg"

  const loadDashboardData = async () => {
    const userId = currentUser?.id || 1
    try {
      const [bookingsData, servicesData, oppsData, passport, samples, videosData, recsData, ratingStats] = await Promise.all([
        api.getUserBookings(userId).catch(() => []),
        api.getServices().catch(() => []),
        api.getProviderOpportunities(userId).catch(() => ({ provider_id: userId, opportunities: [], total: 0 })),
        api.getSkillPassport(userId).catch(() => null),
        api.getWorkSamples(userId).catch(() => []),
        api.getProviderVideos(userId).catch(() => []),
        api.getOpportunityRecommendations(userId).catch(() => ({ recommendations: [] })),
        api.getProviderRating(userId).catch(() => null)
      ])
      setBookings(bookingsData)
      setServices(servicesData.filter((s) => s.provider_id === userId))
      setOpportunities(oppsData.opportunities || [])
      setPassportData(passport)
      setWorkSamples(samples)
      setVideos(videosData)
      setRecommendations(recsData.recommendations || [])
      setRatingBreakdown(ratingStats)
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
        latitude: editLatitude,
        longitude: editLongitude,
        languages: editLanguages,
        availability: editAvailability
      })
      setCurrentUser(updated)
      setShowEditProfile(false)
      loadDashboardData()
      alert('Profile & live location coordinates updated successfully!')
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

  // Video Management Handlers
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoTitle.trim()) {
      alert('Please enter a title for your video demo.')
      return
    }
    setVideoSaving(true)
    try {
      if (editingVideo) {
        // Edit existing video
        await api.updateVideoDetails(editingVideo.id, {
          title: videoTitle,
          description: videoDesc,
          category: videoCat,
          visibility: videoVisibility
        })
        alert('Video details updated successfully!')
      } else {
        // Create new video
        await api.createProviderVideo(currentUser?.id || 1, {
          title: videoTitle,
          description: videoDesc,
          category: videoCat,
          visibility: videoVisibility,
          url: videoUrl,
          duration_seconds: 45
        })
        alert('Video demo published to your showcase gallery!')
      }
      setShowVideoModal(false)
      setEditingVideo(null)
      setVideoTitle('')
      setVideoDesc('')
      setAiVideoNotice(null)
      loadDashboardData()
    } catch (err: any) {
      alert(`Video save error: ${err.message}`)
    } finally {
      setVideoSaving(false)
    }
  }

  const handleDeleteVideo = async (video: VideoItem) => {
    if (!confirm(t.confirmDelete || 'Are you sure you want to permanently delete this video?')) return
    try {
      await api.deleteProviderVideo(video.id)
      setVideos(prev => prev.filter(v => v.id !== video.id))
      alert('Video removed from storage and database.')
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`)
    }
  }

  const handleToggleVideoVisibility = async (video: VideoItem) => {
    const nextVisibility = video.visibility === 'public' ? 'private' : 'public'
    try {
      const updated = await api.updateVideoDetails(video.id, { visibility: nextVisibility })
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, visibility: updated.visibility } : v))
    } catch (err: any) {
      alert(`Visibility update error: ${err.message}`)
    }
  }

  // Voice AI: Speech-to-Text (STT) into Video Description
  const handleStartVoiceSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(t.voiceUnsupported || 'Voice input is not supported in this browser. Please type directly.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = speechLang
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setIsListeningSpeech(true)
      recognition.onend = () => setIsListeningSpeech(false)
      recognition.onerror = () => setIsListeningSpeech(false)

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setVideoDesc(prev => (prev ? `${prev} ${transcript}` : transcript))
      }

      recognition.start()
    } catch (err) {
      console.warn('Voice STT error:', err)
      setIsListeningSpeech(false)
    }
  }

  // Voice AI: Text-to-Speech (TTS) for Description
  const handlePlayTTS = (textToPlay: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.')
      return
    }

    if (isPlayingTTS) {
      window.speechSynthesis.cancel()
      setIsPlayingTTS(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(textToPlay)
    utterance.lang = speechLang
    utterance.onend = () => setIsPlayingTTS(false)
    utterance.onerror = () => setIsPlayingTTS(false)

    setIsPlayingTTS(true)
    window.speechSynthesis.speak(utterance)
  }

  // Gemini AI Video Description Generator
  const handleGenerateAIVideoDesc = async () => {
    if (!videoTitle && !videoDesc) {
      alert('Please enter a video title or brief spoken notes first.')
      return
    }

    setAiGeneratingDesc(true)
    try {
      const res = await api.generateAIVideoDescription({
        title: videoTitle || 'Craft Demonstration',
        transcript_or_notes: videoDesc || videoTitle,
        category: videoCat,
        language: speechLang === 'ta-IN' ? 'Tamil' : speechLang === 'hi-IN' ? 'Hindi' : 'English'
      })

      setVideoDesc(res.suggested_description)
      setVideoCat(res.category || videoCat)
      setAiVideoNotice(res.ai_notice || 'AI-assisted — please review before publishing')
    } catch (err: any) {
      alert(`AI Generation Notice: ${err.message}`)
    } finally {
      setAiGeneratingDesc(false)
    }
  }

  // Service Radius Update
  const handleSaveServiceRadius = async () => {
    setRadiusSaving(true)
    try {
      await api.updateLocation({
        latitude: currentUser?.latitude || 19.0760,
        longitude: currentUser?.longitude || 72.8777,
        service_radius: editRadius
      })
      if (currentUser) {
        setCurrentUser({ ...currentUser, service_radius: editRadius })
      }
      setShowRadiusModal(false)
      loadDashboardData()
      alert(`Service radius updated to ${editRadius} km!`)
    } catch (err: any) {
      alert(`Radius update error: ${err.message}`)
    } finally {
      setRadiusSaving(false)
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
                <Star className="w-4 h-4 fill-amber-400" /> {ratingBreakdown ? (ratingBreakdown.average_rating > 0 ? ratingBreakdown.average_rating : 'New') : '5.0'}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'opportunities', label: `${t.navOpportunities} (${opportunities.length})`, icon: TrendingUp },
            { id: 'recommendations', label: `Opportunity Engine (${recommendations.length})`, icon: Sparkles },
            { id: 'videos', label: `${t.myVideos || 'My Videos'} (${videos.length})`, icon: Video },
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
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'videos' && (
            <button
              onClick={() => {
                setEditingVideo(null)
                setVideoTitle('')
                setVideoDesc('')
                setAiVideoNotice(null)
                setShowVideoModal(true)
              }}
              className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2 px-3.5 rounded-xl shadow-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.uploadVideo || 'Upload Video Demo'}</span>
            </button>
          )}

          {activeTab === 'recommendations' && (
            <button
              onClick={() => setShowRadiusModal(true)}
              className="bg-[#0A0F24] hover:bg-[#131838] text-white text-xs py-2 px-3.5 rounded-xl shadow-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#4099FF]" />
              <span>Adjust Radius ({currentUser?.service_radius || 10} km)</span>
            </button>
          )}

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

      {/* TAB: OPPORTUNITY IMPROVEMENT ENGINE */}
      {activeTab === 'recommendations' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#0A0F24] to-[#131838] p-5 md:p-6 rounded-2xl text-white shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4099FF]" />
                <h3 className="text-lg md:text-xl font-black">{t.opportunityEngine || 'Opportunity Improvement Engine'}</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Practical, grounded nudges tailored to your profile, real neighborhood demand, and local pricing in your area.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-[#4B32E6] px-3 py-1.5 rounded-xl border border-[#4099FF]/40 text-white">
                Current Radius: {currentUser?.service_radius || 10} km
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                  highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#4B32E6] border border-blue-100 px-2 py-0.5 rounded-md">
                      {rec.category}
                    </span>
                    <span className="text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {rec.impact_badge}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {rec.title}
                  </h4>

                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                      Why this is recommended:
                    </span>
                    <p className="leading-relaxed">
                      {rec.why_shown}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold capitalize">
                    Priority: <strong className={rec.priority === 'high' ? 'text-rose-600' : 'text-amber-600'}>{rec.priority}</strong>
                  </span>

                  <button
                    onClick={() => {
                      if (rec.action_type === 'radius_settings') {
                        setShowRadiusModal(true)
                      } else if (rec.action_type === 'video_upload') {
                        setActiveTab('videos')
                        setShowVideoModal(true)
                      } else if (rec.action_type === 'profile_editor' || rec.action_type === 'availability') {
                        setShowEditProfile(true)
                      } else if (rec.action_type === 'pricing') {
                        setShowServiceModal(true)
                      } else if (rec.action_type === 'express_interest') {
                        handleExpressInterest(rec.action_payload?.opportunity_id || 'opp_cooking_01')
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#4B32E6] hover:bg-[#3D26D1] text-white shadow-xs cursor-pointer transition-all"
                  >
                    <span>{rec.action_label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#4099FF]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MY SHOWCASE VIDEOS & DEMONSTRATIONS */}
      {activeTab === 'videos' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900">{t.myVideos || 'My Showcase Videos'}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload short 30-45s demonstrations of your skills with AI speech assist and public/private visibility control.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingVideo(null)
                setVideoTitle('')
                setVideoDesc('')
                setAiVideoNotice(null)
                setShowVideoModal(true)
              }}
              className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.uploadVideo || 'Upload Video Demo'}</span>
            </button>
          </div>

          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                    highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {/* Video Thumbnail & Play Overlay */}
                  <div className="relative aspect-video bg-slate-900 group cursor-pointer overflow-hidden" onClick={() => setPlayingVideoUrl(video.url)}>
                    <video
                      src={video.url}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-all">
                      <div className="w-11 h-11 rounded-full bg-white/90 text-[#4B32E6] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-[#4B32E6] ml-0.5" />
                      </div>
                    </div>

                    {/* Visibility Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        video.visibility === 'public'
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-zinc-800/90 text-amber-300 border border-amber-400/40'
                      }`}>
                        {video.visibility === 'public' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {video.visibility === 'public' ? (t.publicVisibility || 'Public') : (t.privateVisibility || 'Private')}
                      </span>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                      {video.duration_seconds || 45}s
                    </div>
                  </div>

                  {/* Video Details Card Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#4B32E6] bg-blue-50 px-2 py-0.5 rounded">
                          {video.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {video.title}
                      </h4>

                      {video.description && (
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Listen TTS Button */}
                      {video.description && (
                        <button
                          onClick={() => handlePlayTTS(video.description || '')}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#4B32E6] hover:bg-slate-100 cursor-pointer"
                          title={t.listenDescription || 'Listen to description'}
                        >
                          <Volume2 className="w-4 h-4 text-[#4099FF]" />
                        </button>
                      )}

                      {/* Visibility Toggle Button */}
                      <button
                        onClick={() => handleToggleVideoVisibility(video)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                          video.visibility === 'public'
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                        }`}
                        title="Click to toggle visibility"
                      >
                        {video.visibility === 'public' ? 'Make Private' : 'Make Public'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingVideo(video)
                            setVideoTitle(video.title)
                            setVideoCat(video.category)
                            setVideoDesc(video.description || '')
                            setVideoVisibility(video.visibility)
                            setVideoUrl(video.url)
                            setShowVideoModal(true)
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#4B32E6] hover:bg-slate-100 cursor-pointer"
                          title="Edit details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 p-8 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4B32E6] mx-auto flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No Showcase Videos Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t.noVideos || 'Upload a short 30-second craft or cooking demo to boost your inquiry rate by 3x!'}
              </p>
              <button
                onClick={() => {
                  setEditingVideo(null)
                  setVideoTitle('')
                  setVideoDesc('')
                  setAiVideoNotice(null)
                  setShowVideoModal(true)
                }}
                className="btn-large bg-[#4B32E6] text-white hover:bg-[#3D26D1] text-xs font-bold py-2 px-4 inline-flex items-center gap-2 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Video Demo</span>
              </button>
            </div>
          )}
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

                    <div className="flex flex-wrap items-center gap-2">
                      {(booking.status === 'confirmed' || booking.status === 'completed') && onStartVirtualCall && (
                        <button
                          onClick={() => onStartVirtualCall(booking.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Start or Join Virtual Video Consultation"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{t.startVirtualCall || 'Virtual Call'}</span>
                        </button>
                      )}

                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 rounded-xl font-bold cursor-pointer"
                        >
                          {t.acceptBooking}
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'completed')}
                          className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2 px-4 rounded-xl font-bold shadow-sm cursor-pointer"
                        >
                          {t.markCompleted}
                        </button>
                      )}

                      {booking.status === 'completed' && (
                        <button
                          onClick={() => setSelectedBookingForReview(booking)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs py-2 px-3.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
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
                <LocationAutocomplete
                  value={editLocation}
                  initialLatitude={editLatitude}
                  initialLongitude={editLongitude}
                  onLocationChange={(loc) => {
                    setEditLocation(loc.locationName)
                    setEditLatitude(loc.latitude)
                    setEditLongitude(loc.longitude)
                  }}
                  highContrast={highContrast}
                  language={language}
                  label="Neighborhood / City Location"
                  required
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

      {/* Video Upload / Edit Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xl w-full p-6 md:p-7 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4B32E6] flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingVideo ? 'Edit Showcase Video' : (t.uploadVideo || 'Upload Video Demo')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowVideoModal(false)
                  setEditingVideo(null)
                  if (isPlayingTTS) {
                    window.speechSynthesis.cancel()
                    setIsPlayingTTS(false)
                  }
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Demo Title</label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Sambar Tadka & Stone Ground Masala Demo"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={videoCat}
                    onChange={(e) => setVideoCat(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Cooking & Tiffin">Cooking & Tiffin</option>
                    <option value="Tutoring & Mentoring">Tuition & Mentoring</option>
                    <option value="Crafts & Tailoring">Saree Tailoring & Crafts</option>
                    <option value="Gardening & Agriculture">Terrace Kitchen Garden</option>
                    <option value="Consulting & Life Mentoring">Consulting & Life Mentoring</option>
                    <option value="Home Maintenance">Home Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Visibility Level</label>
                  <select
                    value={videoVisibility}
                    onChange={(e) => setVideoVisibility(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="public">🟢 Public (All Clients & Map)</option>
                    <option value="private">🔒 Private (Draft Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Video Clip Stream / File URL</label>
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://assets.mixkit.co/videos/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                  <span className="text-slate-400 font-semibold">Quick Samples:</span>
                  <button
                    type="button"
                    onClick={() => setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-cutting-vegetables-40915-large.mp4')}
                    className="text-[#4B32E6] hover:underline font-bold"
                  >
                    Cooking Clip
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-hands-sewing-a-fabric-with-a-machine-42403-large.mp4')}
                    className="text-[#4B32E6] hover:underline font-bold"
                  >
                    Tailoring Clip
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-hands-holding-and-showing-a-plant-sprout-41584-large.mp4')}
                    className="text-[#4B32E6] hover:underline font-bold"
                  >
                    Gardening Clip
                  </button>
                </div>
              </div>

              {/* Description with Voice STT, TTS and Gemini AI Assist */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-bold text-slate-700">Video Description & Demonstration Notes</label>

                  {/* Speech Language Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold">Voice Lang:</span>
                    <select
                      value={speechLang}
                      onChange={(e) => setSpeechLang(e.target.value as any)}
                      className="text-[10px] font-bold text-[#4B32E6] bg-transparent border-0 focus:ring-0 cursor-pointer"
                    >
                      <option value="en-IN">English (India)</option>
                      <option value="ta-IN">Tamil (தமிழ்)</option>
                      <option value="hi-IN">Hindi (हिंदी)</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={videoDesc}
                    onChange={(e) => setVideoDesc(e.target.value)}
                    placeholder="Speak into mic or type your description here..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#4B32E6] focus:outline-none"
                  />

                  {/* Voice Controls floating in textarea */}
                  <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 bg-white/95 px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {/* Mic STT Button */}
                    <button
                      type="button"
                      onClick={handleStartVoiceSTT}
                      className={`p-1 rounded-md cursor-pointer transition-colors ${
                        isListeningSpeech
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'text-slate-600 hover:text-[#4B32E6] hover:bg-slate-100'
                      }`}
                      title={isListeningSpeech ? 'Listening...' : 'Speak to input text'}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>

                    {/* TTS Listen Button */}
                    <button
                      type="button"
                      onClick={() => handlePlayTTS(videoDesc || videoTitle)}
                      disabled={!videoDesc && !videoTitle}
                      className={`p-1 rounded-md cursor-pointer transition-colors ${
                        isPlayingTTS
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-600 hover:text-[#4B32E6] hover:bg-slate-100 disabled:opacity-40'
                      }`}
                      title={isPlayingTTS ? 'Playing audio...' : 'Listen to text'}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isListeningSpeech && (
                  <p className="text-[11px] font-bold text-rose-600 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping"></span>
                    <span>Listening... speak now in {speechLang === 'ta-IN' ? 'Tamil' : speechLang === 'hi-IN' ? 'Hindi' : 'English'}</span>
                  </p>
                )}

                {/* AI Assistant Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateAIVideoDesc}
                    disabled={aiGeneratingDesc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#4B32E6] to-[#4099FF] text-white hover:opacity-95 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{aiGeneratingDesc ? 'Generating AI Description...' : (t.aiDescription || 'Generate AI Description')}</span>
                  </button>

                  <span className="text-[10px] text-slate-400">
                    Grounded Gemini 2.5 Flash Engine
                  </span>
                </div>

                {/* AI Notice */}
                {aiVideoNotice && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{aiVideoNotice}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={videoSaving}
                  className="w-1/2 bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2.5 rounded-xl font-bold shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                >
                  {videoSaving ? 'Saving...' : (editingVideo ? 'Update Video' : 'Publish Video Demo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Radius Modal */}
      {showRadiusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 space-y-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {t.expandRadius || 'Service Radius Settings'}
                </h3>
              </div>
              <button
                onClick={() => setShowRadiusModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Set how far you are willing to travel for home services, tutoring sessions, or local catering deliveries.
              </p>

              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Selected Coverage Area</span>
                <div className="text-3xl font-black text-[#4B32E6]">{editRadius} km</div>
                <p className="text-[11px] text-slate-600">
                  Covers approx. {Math.round(Math.PI * editRadius * editRadius)} sq. km around {currentUser?.location_name || 'your neighborhood'}.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Choose Radius (km)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 5, 10, 15, 25].map((rad) => (
                    <button
                      key={rad}
                      type="button"
                      onClick={() => setEditRadius(rad)}
                      className={`py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                        editRadius === rad
                          ? 'bg-[#4B32E6] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {rad} km
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRadiusModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveServiceRadius}
                  disabled={radiusSaving}
                  className="w-1/2 bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs py-2.5 rounded-xl font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {radiusSaving ? 'Updating...' : 'Save Radius'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideoUrl && (
        <div className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPlayingVideoUrl(null)}>
          <div className="relative max-w-2xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPlayingVideoUrl(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={playingVideoUrl}
              controls
              autoPlay
              className="w-full aspect-video object-contain"
            />
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          booking={selectedBookingForReview}
          onClose={() => setSelectedBookingForReview(null)}
          onSuccess={() => {
            setSelectedBookingForReview(null)
            loadDashboardData()
          }}
          language={language}
          highContrast={highContrast}
        />
      )}
    </div>
  )
}

