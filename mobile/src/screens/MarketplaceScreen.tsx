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
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'
import { translations, type Language } from '../i18n/translations'
import { api } from '../services/api'
import { VoiceInputButton } from '../components/VoiceInputButton'
import { formatINR } from '../utils/formatters'
import type { ServiceListing, User } from '../types'

interface MarketplaceScreenProps {
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'xlarge'
  language: Language
  currentUser: User | null
  onBookingSuccess: () => void
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({
  highContrast,
  fontSize,
  language,
  currentUser,
  onBookingSuccess,
}) => {
  const t = translations[language]
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const [services, setServices] = useState<ServiceListing[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Service Detail & Booking Modal
  const [detailService, setDetailService] = useState<ServiceListing | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null)
  const [bookingHours, setBookingHours] = useState<number>(2)
  const [bookingDate, setBookingDate] = useState<string>('2026-08-25')
  const [bookingNotes, setBookingNotes] = useState<string>('Looking forward to learning authentic recipes!')
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false)

  const defaultAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"

  const categories = [
    { id: 'All', label: t.allCategories, icon: '✨' },
    { id: 'Cooking & Tiffin', label: t.cookingTiffin, icon: '🍲' },
    { id: 'Tutoring & Mentoring', label: t.tutoringMentoring, icon: '📚' },
    { id: 'Crafts & Tailoring', label: t.craftsTailoring, icon: '✂️' },
    { id: 'Gardening & Agriculture', label: t.gardeningAgri, icon: '🌱' },
    { id: 'Home Maintenance', label: t.homeMaintenance, icon: '🔧' },
  ]

  const searchPresets = language === 'ta'
    ? ['சமையல் மற்றும் டிபன்', 'கணிதப் பாடம்', 'தையல் வேலை', 'மாடித் தோட்டம்']
    : language === 'hi'
    ? ['दैनिक टिफिन सेवा', 'गणित ट्यूशन', 'ब्लाउज सिलाई', 'किचन गार्डनिंग']
    : ['South Indian home tiffin', 'Math & science tuition', 'Saree blouse tailoring', 'Terrace gardening']

  useEffect(() => {
    loadServices()
  }, [selectedCategory])

  const loadServices = async () => {
    setLoading(true)
    try {
      const data = await api.getServices(selectedCategory, searchQuery)
      setServices(data)
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedService) return
    setSubmittingBooking(true)
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
      Alert.alert('Booking Sent', 'Your request has been submitted to the senior provider!')
      setSelectedService(null)
      setDetailService(null)
      onBookingSuccess()
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Unable to place booking.')
    } finally {
      setSubmittingBooking(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bgCanvas }]} showsVerticalScrollIndicator={false}>
      {/* Search Input Row with Voice Search */}
      <View style={styles.searchRow}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadServices}
          placeholder={t.searchPlaceholder}
          placeholderTextColor="#94A3B8"
          style={[
            styles.searchInput,
            { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle, color: theme.textDark },
          ]}
        />
        <VoiceInputButton
          language={language}
          fieldLabel="Service Search"
          presetSuggestions={searchPresets}
          onVoiceResult={(transcript) => {
            setSearchQuery(transcript)
            loadServices()
          }}
        />
        <TouchableOpacity
          onPress={loadServices}
          style={[styles.searchBtn, { backgroundColor: theme.indigoPrimary }]}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            style={[
              styles.categoryChip,
              { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle },
              selectedCategory === cat.id && { backgroundColor: theme.indigoPrimary, borderColor: theme.indigoPrimary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={cat.label}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                { color: selectedCategory === cat.id ? '#FFFFFF' : theme.textDark },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Services Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.indigoPrimary} style={{ marginVertical: 32 }} />
      ) : services.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { fontSize: fs.base, color: theme.textDark }]}>No services found</Text>
          <Text style={[styles.emptySub, { fontSize: fs.xs, color: theme.textMuted }]}>
            Try changing your search query or category filter.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              activeOpacity={0.88}
              onPress={() => setDetailService(service)}
              style={[
                styles.card,
                { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Service: ${service.title}`}
            >
              {/* Provider Header */}
              <View style={styles.providerRow}>
                <Image
                  source={{ uri: service.provider_avatar || defaultAvatar }}
                  style={styles.providerAvatar}
                />
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerName, { fontSize: fs.sm, color: theme.textDark }]}>
                    {service.provider_name}
                  </Text>
                  <Text style={styles.verifiedText}>🛡️ {service.provider_user_type || t.verifiedSenior}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>★ {service.rating || '5.0'}</Text>
                </View>
              </View>

              {/* Service Title & Category */}
              <View style={styles.serviceDetails}>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{service.category}</Text>
                </View>
                <Text style={[styles.serviceTitle, { fontSize: fs.base, color: theme.textDark }]}>
                  {service.title}
                </Text>
                <Text style={[styles.serviceDesc, { fontSize: fs.xs, color: theme.textSecondary }]} numberOfLines={2}>
                  {service.description}
                </Text>
              </View>

              {/* Meta */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📍 {service.location_name || 'Mumbai, Maharashtra'}</Text>
                <Text style={styles.metaText}>💼 {service.completed_services || 12} {t.completedJobs}</Text>
              </View>

              {/* Price & Request */}
              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.priceLabel}>{t.hourlyRate}</Text>
                  <Text style={[styles.priceText, { fontSize: fs.base, color: theme.textDark }]}>
                    {formatINR(service.price_per_hour)} <Text style={styles.perHour}>/ hr</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation()
                    setSelectedService(service)
                  }}
                  style={[styles.requestBtn, { backgroundColor: theme.indigoPrimary }]}
                  accessibilityRole="button"
                  accessibilityLabel={t.requestService}
                >
                  <Text style={styles.requestBtnText}>{t.requestService}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Service Detail Modal */}
      {detailService && !selectedService && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setDetailService(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.bgSurface }]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.categoryTag, { alignSelf: 'flex-start', marginBottom: 4 }]}>
                    <Text style={styles.categoryTagText}>{detailService.category}</Text>
                  </View>
                  <Text style={[styles.modalTitle, { fontSize: fs.lg, color: theme.textDark }]}>
                    {detailService.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDetailService(null)}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close detail"
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
                <View style={styles.providerRow}>
                  <Image
                    source={{ uri: detailService.provider_avatar || defaultAvatar }}
                    style={styles.providerAvatar}
                  />
                  <View style={styles.providerInfo}>
                    <Text style={[styles.providerName, { fontSize: fs.base, color: theme.textDark }]}>
                      {detailService.provider_name}
                    </Text>
                    <Text style={styles.verifiedText}>🛡️ {t.verifiedSenior}</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>📍 {detailService.location_name}</Text>
                  </View>
                </View>

                <Text style={[styles.detailSectionTitle, { color: theme.indigoPrimary, marginTop: 12 }]}>
                  Service Description & Expertise
                </Text>
                <Text style={[styles.detailBody, { fontSize: fs.sm, color: theme.textSecondary }]}>
                  {detailService.description}
                </Text>

                <View style={styles.detailMetaGrid}>
                  <View style={[styles.detailMetaCard, { backgroundColor: theme.bgSubtle }]}>
                    <Text style={styles.detailMetaLabel}>Rating</Text>
                    <Text style={[styles.detailMetaVal, { color: '#D97706' }]}>★ {detailService.rating || '5.0'} (Verified)</Text>
                  </View>
                  <View style={[styles.detailMetaCard, { backgroundColor: theme.bgSubtle }]}>
                    <Text style={styles.detailMetaLabel}>Hourly Price</Text>
                    <Text style={[styles.detailMetaVal, { color: theme.indigoPrimary }]}>{formatINR(detailService.price_per_hour)}/hr</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  onPress={() => setDetailService(null)}
                  style={[styles.modalBackBtn, { borderColor: theme.borderSubtle }]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to list"
                >
                  <Text style={[styles.modalBackText, { color: theme.textDark }]}>← Back to List</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedService(detailService)}
                  style={[styles.requestBtn, { flex: 1, backgroundColor: theme.indigoPrimary, alignItems: 'center', justifyContent: 'center' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Proceed to Book"
                >
                  <Text style={styles.requestBtnText}>Proceed to Book →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Booking Form Modal */}
      {selectedService && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedService(null)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={[styles.modalCard, { backgroundColor: theme.bgSurface }]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { fontSize: fs.base, color: theme.textDark }]}>
                    Book {selectedService.title}
                  </Text>
                  <Text style={styles.modalSub}>With {selectedService.provider_name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedService(null)}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel booking"
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.bookingForm}>
                  <Text style={styles.inputLabel}>Scheduled Date</Text>
                  <TextInput
                    value={bookingDate}
                    onChangeText={setBookingDate}
                    style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                  />

                  <Text style={styles.inputLabel}>Estimated Duration (Hours)</Text>
                  <View style={styles.hoursRow}>
                    {[1, 2, 3, 4].map((hrs) => (
                      <TouchableOpacity
                        key={hrs}
                        onPress={() => setBookingHours(hrs)}
                        style={[
                          styles.hourBtn,
                          bookingHours === hrs && { backgroundColor: theme.indigoPrimary },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${hrs} hours`}
                      >
                        <Text style={[styles.hourBtnText, bookingHours === hrs && { color: '#FFFFFF' }]}>
                          {hrs} hr ({formatINR(selectedService.price_per_hour * hrs)})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Notes for Senior Provider</Text>
                  <TextInput
                    value={bookingNotes}
                    onChangeText={setBookingNotes}
                    multiline
                    numberOfLines={2}
                    style={[styles.input, { minHeight: 60, borderColor: theme.borderSubtle, color: theme.textDark }]}
                  />

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total Estimate:</Text>
                    <Text style={[styles.totalAmount, { color: theme.indigoPrimary }]}>
                      {formatINR(selectedService.price_per_hour * bookingHours)}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  onPress={() => setSelectedService(null)}
                  style={[styles.modalBackBtn, { borderColor: theme.borderSubtle }]}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={[styles.modalBackText, { color: theme.textDark }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmBooking}
                  disabled={submittingBooking}
                  style={[styles.confirmBtn, { flex: 1, backgroundColor: theme.indigoPrimary }]}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm Booking"
                >
                  {submittingBooking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm Booking Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 44,
  },
  searchBtn: {
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  searchBtnText: {
    fontSize: 16,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 38,
  },
  categoryIcon: {
    fontSize: 13,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontWeight: '800',
  },
  verifiedText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D97706',
  },
  serviceDetails: {
    marginTop: 10,
  },
  categoryTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B32E6',
    textTransform: 'uppercase',
  },
  serviceTitle: {
    fontWeight: '800',
    lineHeight: 20,
  },
  serviceDesc: {
    marginTop: 4,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  priceText: {
    fontWeight: '900',
  },
  perHour: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'normal',
  },
  requestBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  requestBtnText: {
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontWeight: '900',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#64748B',
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  detailBody: {
    lineHeight: 20,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  detailMetaCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },
  detailMetaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  detailMetaVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalBackBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modalBackText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bookingForm: {
    gap: 8,
    marginVertical: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    minHeight: 44,
  },
  hoursRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hourBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  hourBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  confirmBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
})
