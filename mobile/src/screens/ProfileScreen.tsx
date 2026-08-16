import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'
import { translations, type Language } from '../i18n/translations'
import { api, getApiBaseUrl, setApiBaseUrl } from '../services/api'
import { formatINR } from '../utils/formatters'
import * as Speech from 'expo-speech'
import type { Booking, ServiceListing, User, VideoItem } from '../types'

interface ProfileScreenProps {
  highContrast: boolean
  setHighContrast: (hc: boolean) => void
  fontSize: 'normal' | 'large' | 'xlarge'
  setFontSize: (fs: 'normal' | 'large' | 'xlarge') => void
  language: Language
  setLanguage: (lang: Language) => void
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  onSignOut: () => void
  onOpenAuth: () => void
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  highContrast,
  setHighContrast,
  fontSize,
  setFontSize,
  language,
  setLanguage,
  currentUser,
  setCurrentUser,
  onSignOut,
  onOpenAuth,
}) => {
  const t = translations[language]
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const [activeTab, setActiveTab] = useState<'bookings' | 'videos' | 'services' | 'settings'>('bookings')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<ServiceListing[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [serviceRadius, setServiceRadius] = useState<number>(currentUser?.service_radius || 10)

  // Custom API configuration state
  const [customApiUrl, setCustomApiUrl] = useState<string>('')
  const [apiStatusMsg, setApiStatusMsg] = useState<string | null>(null)

  const defaultAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
  const userId = currentUser?.id || 1

  useEffect(() => {
    loadProfileData()
    getApiBaseUrl().then((url) => setCustomApiUrl(url))
  }, [currentUser])

  const handleSaveApiUrl = async () => {
    setApiStatusMsg('Testing connection...')
    try {
      await setApiBaseUrl(customApiUrl)
      const health = await api.getHealth()
      if (health && health.status === 'online') {
        setApiStatusMsg(`✓ Connected to ${health.app_name} (v${health.version})!`)
      } else {
        setApiStatusMsg('✓ Saved API endpoint.')
      }
      loadProfileData()
    } catch (err: any) {
      setApiStatusMsg(`✕ Error connecting: ${err.message}`)
    }
  }

  const loadProfileData = async () => {
    setLoading(true)
    try {
      const [bookingsData, servicesData, videosData] = await Promise.all([
        api.getUserBookings(userId).catch(() => []),
        api.getServices().catch(() => []),
        api.getProviderVideos(userId).catch(() => []),
      ])
      setBookings(bookingsData)
      setServices(servicesData.filter((s) => s.provider_id === userId))
      setVideos(videosData)
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVideoVisibility = async (video: VideoItem) => {
    const nextVisibility = video.visibility === 'public' ? 'private' : 'public'
    try {
      const updated = await api.updateVideoDetails(video.id, { visibility: nextVisibility })
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, visibility: updated.visibility } : v))
      Alert.alert('Updated', `Video visibility changed to ${updated.visibility}`)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleDeleteVideo = async (video: VideoItem) => {
    Alert.alert(
      'Delete Video Demo',
      'Are you sure you want to permanently delete this video demo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProviderVideo(video.id)
              setVideos(prev => prev.filter(v => v.id !== video.id))
              Alert.alert('Deleted', 'Video removed successfully.')
            } catch (err: any) {
              Alert.alert('Delete Error', err.message)
            }
          }
        }
      ]
    )
  }

  const handlePlayAudio = (textToSpeak: string) => {
    Speech.stop()
    Speech.speak(textToSpeak, {
      language: language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
      pitch: 1.0,
      rate: 0.95
    })
  }

  const handleSaveRadius = async (newRadius: number) => {
    setServiceRadius(newRadius)
    try {
      await api.updateLocation({
        latitude: currentUser?.latitude || 19.0760,
        longitude: currentUser?.longitude || 72.8777,
        service_radius: newRadius
      })
      Alert.alert('Radius Saved', `Service discovery radius set to ${newRadius} km.`)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleUpdateStatus = async (bookingId: number, status: string) => {
    try {
      await api.updateBookingStatus(bookingId, status)
      Alert.alert('Status Updated', `Booking #${bookingId} marked as ${status}`)
      loadProfileData()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update status.')
    }
  }

  const handleReviewBooking = async (bookingId: number) => {
    try {
      await api.submitReview(bookingId, 5, 'Exceptional experience with senior provider!', currentUser?.id || 2)
      Alert.alert('Review Submitted', '5★ review successfully posted!')
      loadProfileData()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to submit review.')
    }
  }

  const totalEarned = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0)

  // Profile strength
  const getCompleteness = () => {
    let score = 50
    if (currentUser?.bio) score += 20
    if (services.length > 0) score += 30
    return Math.min(100, score)
  }

  const completeness = getCompleteness()

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bgCanvas }]} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
        <View style={styles.userRow}>
          <Image
            source={{ uri: currentUser?.avatar_url || defaultAvatar }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { fontSize: fs.lg, color: theme.textDark }]}>
              {currentUser?.full_name || 'Meenakshi Amma'}
            </Text>
            <Text style={styles.userRole}>
              🛡️ {currentUser?.user_type || t.verifiedSenior}
            </Text>
            <Text style={styles.userLocation}>
              📍 {currentUser?.location_name || 'Matunga / Dadar, Mumbai'}
            </Text>
          </View>
        </View>

        {/* 4 Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.bgSubtle }]}>
            <Text style={styles.statLabel}>{t.totalEarned}</Text>
            <Text style={[styles.statVal, { color: theme.indigoPrimary }]}>{formatINR(totalEarned)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.bgSubtle }]}>
            <Text style={styles.statLabel}>{t.avgRating}</Text>
            <Text style={[styles.statVal, { color: '#D97706' }]}>★ 5.0</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.bgSubtle }]}>
            <Text style={styles.statLabel}>{t.completedServices}</Text>
            <Text style={[styles.statVal, { color: theme.textDark }]}>
              {bookings.filter((b) => b.status === 'completed').length || 28}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.bgSubtle }]}>
            <Text style={styles.statLabel}>{t.activeOpportunities}</Text>
            <Text style={[styles.statVal, { color: theme.indigoPrimary }]}>5</Text>
          </View>
        </View>

        {/* Profile Strength Progress Bar */}
        <View style={styles.strengthSection}>
          <View style={styles.strengthHeader}>
            <Text style={styles.strengthLabel}>✨ {t.profileStrength}:</Text>
            <Text style={[styles.strengthScore, { color: theme.indigoPrimary }]}>{completeness}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${completeness}%`, backgroundColor: theme.indigoPrimary }]} />
          </View>
        </View>
      </View>

      {/* Sub Tabs */}
      <View style={styles.subTabsRow}>
        {[
          { id: 'bookings', label: `${t.navBookings} (${bookings.length})` },
          { id: 'videos', label: `My Videos (${videos.length})` },
          { id: 'services', label: `My Services (${services.length})` },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[
              styles.subTab,
              activeTab === tab.id && { backgroundColor: theme.indigoPrimary },
            ]}
          >
            <Text style={[styles.subTabText, activeTab === tab.id && { color: '#FFFFFF' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <View style={styles.tabContent}>
          {videos.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
              <Text style={styles.emptyIcon}>📹</Text>
              <Text style={[styles.emptyTitle, { fontSize: fs.base, color: theme.textDark }]}>No videos uploaded</Text>
              <Text style={[styles.emptySub, { fontSize: fs.xs, color: theme.textMuted }]}>
                Upload a 30s craft or cooking demo to boost your inquiry rate by 3x!
              </Text>
            </View>
          ) : (
            videos.map((vid) => (
              <View
                key={vid.id}
                style={[styles.bookingCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}
              >
                <View style={styles.bookingHeader}>
                  <View style={[
                    styles.statusBadge,
                    vid.visibility === 'public' ? styles.statusConfirmed : styles.statusPending
                  ]}>
                    <Text style={styles.statusText}>
                      {vid.visibility === 'public' ? '🟢 Public' : '🔒 Private'}
                    </Text>
                  </View>
                  <Text style={styles.bookingId}>{vid.duration_seconds || 45}s • {vid.category}</Text>
                </View>

                <Text style={[styles.bookingTitle, { fontSize: fs.base, color: theme.textDark }]}>
                  {vid.title}
                </Text>
                {vid.description && (
                  <Text style={[styles.bookingMeta, { lineHeight: 18 }]}>
                    {vid.description}
                  </Text>
                )}

                <View style={styles.bookingFooter}>
                  {vid.description && (
                    <TouchableOpacity
                      onPress={() => handlePlayAudio(vid.description || '')}
                      style={[styles.actionBtn, { backgroundColor: '#4099FF' }]}
                    >
                      <Text style={styles.actionBtnText}>🔊 Listen</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleToggleVideoVisibility(vid)}
                    style={[styles.actionBtn, { backgroundColor: vid.visibility === 'public' ? '#64748B' : '#10B981' }]}
                  >
                    <Text style={styles.actionBtnText}>
                      {vid.visibility === 'public' ? 'Make Private' : 'Make Public'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteVideo(vid)}
                    style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                  >
                    <Text style={styles.actionBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* 1. Bookings Tab */}
      {activeTab === 'bookings' && (
        <View style={styles.tabContent}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.indigoPrimary} />
          ) : bookings.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={[styles.emptyTitle, { fontSize: fs.base, color: theme.textDark }]}>No bookings yet</Text>
              <Text style={[styles.emptySub, { fontSize: fs.xs, color: theme.textMuted }]}>
                Customer booking requests will appear here.
              </Text>
            </View>
          ) : (
            bookings.map((booking) => (
              <View
                key={booking.id}
                style={[styles.bookingCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}
              >
                <View style={styles.bookingHeader}>
                  <View style={[
                    styles.statusBadge,
                    booking.status === 'completed' ? styles.statusCompleted : booking.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending
                  ]}>
                    <Text style={styles.statusText}>
                      {booking.status === 'completed' ? t.statusCompleted : booking.status === 'confirmed' ? t.statusConfirmed : t.statusPending}
                    </Text>
                  </View>
                  <Text style={styles.bookingId}>#{booking.id}</Text>
                </View>

                <Text style={[styles.bookingTitle, { fontSize: fs.base, color: theme.textDark }]}>
                  {booking.service_title}
                </Text>
                <Text style={styles.bookingMeta}>
                  Customer: {booking.customer_name} • Date: {booking.scheduled_date}
                </Text>

                <View style={styles.bookingFooter}>
                  <Text style={[styles.bookingPrice, { fontSize: fs.base, color: theme.textDark }]}>
                    {formatINR(booking.total_price)}
                  </Text>

                  {booking.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(booking.id, 'confirmed')}
                      style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    >
                      <Text style={styles.actionBtnText}>{t.acceptBooking}</Text>
                    </TouchableOpacity>
                  )}

                  {booking.status === 'confirmed' && (
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(booking.id, 'completed')}
                      style={[styles.actionBtn, { backgroundColor: theme.indigoPrimary }]}
                    >
                      <Text style={styles.actionBtnText}>{t.markCompleted}</Text>
                    </TouchableOpacity>
                  )}

                  {booking.status === 'completed' && (
                    <TouchableOpacity
                      onPress={() => handleReviewBooking(booking.id)}
                      style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
                    >
                      <Text style={styles.actionBtnText}>★ {t.leaveReview}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* 2. Services Tab */}
      {activeTab === 'services' && (
        <View style={styles.tabContent}>
          {services.map((s) => (
            <View
              key={s.id}
              style={[styles.bookingCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}
            >
              <Text style={styles.serviceCat}>{s.category}</Text>
              <Text style={[styles.bookingTitle, { fontSize: fs.base, color: theme.textDark }]}>{s.title}</Text>
              <Text style={[styles.serviceDescText, { fontSize: fs.xs, color: theme.textSecondary }]}>{s.description}</Text>
              <Text style={[styles.serviceRate, { color: theme.indigoPrimary }]}>{formatINR(s.price_per_hour)}/hr</Text>
            </View>
          ))}
        </View>
      )}

      {/* 3. Settings Tab */}
      {activeTab === 'settings' && (
        <View style={styles.tabContent}>
          <View style={[styles.bookingCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.settingsHeader, { color: theme.textDark }]}>App Language</Text>
            <View style={styles.settingsRow}>
              {[
                { id: 'en', label: 'English' },
                { id: 'ta', label: 'தமிழ்' },
                { id: 'hi', label: 'हिन्दी' },
              ].map((l) => (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => setLanguage(l.id as any)}
                  style={[
                    styles.settingChoiceBtn,
                    language === l.id && { backgroundColor: theme.indigoPrimary },
                  ]}
                >
                  <Text style={[styles.settingChoiceText, language === l.id && { color: '#FFFFFF' }]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.settingsHeader, { color: theme.textDark, marginTop: 14 }]}>Text Scaling</Text>
            <View style={styles.settingsRow}>
              {[
                { id: 'normal', label: 'A (Normal)' },
                { id: 'large', label: 'A+ (Large)' },
                { id: 'xlarge', label: 'A++ (Extra Large)' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFontSize(f.id as any)}
                  style={[
                    styles.settingChoiceBtn,
                    fontSize === f.id && { backgroundColor: theme.indigoPrimary },
                  ]}
                >
                  <Text style={[styles.settingChoiceText, fontSize === f.id && { color: '#FFFFFF' }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.settingsHeader, { color: theme.textDark, marginTop: 14 }]}>Visual Contrast</Text>
            <TouchableOpacity
              onPress={() => setHighContrast(!highContrast)}
              style={[
                styles.contrastBtn,
                highContrast && { backgroundColor: '#FACC15' },
              ]}
            >
              <Text style={[styles.contrastBtnText, { color: highContrast ? '#000000' : '#475569' }]}>
                {highContrast ? 'Active: High Contrast Mode' : 'Standard Enterprise Theme'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.settingsHeader, { color: theme.textDark, marginTop: 14 }]}>Backend API Server Endpoint</Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>
              For testing on physical phone via local Wi-Fi, set to your PC's LAN IP.
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                value={customApiUrl}
                onChangeText={setCustomApiUrl}
                placeholder="http://192.168.x.x:8000/api/v1"
                placeholderTextColor="#94A3B8"
                style={[styles.input, { flex: 1, borderColor: theme.borderSubtle, color: theme.textDark }]}
              />
              <TouchableOpacity
                onPress={handleSaveApiUrl}
                style={[styles.actionBtn, { backgroundColor: theme.indigoPrimary, justifyContent: 'center' }]}
              >
                <Text style={styles.actionBtnText}>Test & Save</Text>
              </TouchableOpacity>
            </View>
            {apiStatusMsg && (
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: apiStatusMsg.includes('✓') ? '#059669' : '#DC2626', marginTop: 4 }}>
                {apiStatusMsg}
              </Text>
            )}

            <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutBtnText}>Sign Out of SilverHands</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4B32E6',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '900',
  },
  userRole: {
    fontSize: 11,
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 2,
  },
  userLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  strengthSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  strengthScore: {
    fontSize: 11,
    fontWeight: '900',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  subTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
  },
  subTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  tabContent: {
    gap: 10,
  },
  bookingCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusConfirmed: {
    backgroundColor: '#EEF2FF',
  },
  statusPending: {
    backgroundColor: '#FFFBEB',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bookingId: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  bookingTitle: {
    fontWeight: '800',
  },
  bookingMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bookingPrice: {
    fontWeight: '900',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  serviceCat: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B32E6',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  serviceDescText: {
    marginTop: 4,
    lineHeight: 16,
  },
  serviceRate: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
  },
  settingsHeader: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  settingsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  settingChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
  },
  settingChoiceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  contrastBtn: {
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  contrastBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
  },
  signOutBtn: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  signOutBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontWeight: 'bold',
  },
  emptySub: {
    marginTop: 2,
    textAlign: 'center',
  },
})
