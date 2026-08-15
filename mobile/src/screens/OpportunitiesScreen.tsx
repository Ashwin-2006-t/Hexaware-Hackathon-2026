import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'
import { translations, type Language } from '../i18n/translations'
import { api } from '../services/api'
import type { OpportunityItem, User } from '../types'

interface OpportunitiesScreenProps {
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'xlarge'
  language: Language
  currentUser: User | null
}

export const OpportunitiesScreen: React.FC<OpportunitiesScreenProps> = ({
  highContrast,
  fontSize,
  language,
  currentUser,
}) => {
  const t = translations[language]
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [applyingOppId, setApplyingOppId] = useState<string | null>(null)
  const [selectedOpp, setSelectedOpp] = useState<OpportunityItem | null>(null)

  const providerId = currentUser?.id || 1

  useEffect(() => {
    loadOpportunities()
  }, [providerId])

  const loadOpportunities = async () => {
    setLoading(true)
    try {
      const data = await api.getProviderOpportunities(providerId)
      setOpportunities(data.opportunities || [])
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const handleExpressInterest = async (oppId: string) => {
    setApplyingOppId(oppId)
    try {
      const res = await api.expressInterest(providerId, oppId)
      Alert.alert('Application Sent', res.message || 'Interest expressed successfully!')
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, is_applied: true } : o))
      )
      if (selectedOpp && selectedOpp.id === oppId) {
        setSelectedOpp({ ...selectedOpp, is_applied: true })
      }
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Unable to apply.')
    } finally {
      setApplyingOppId(null)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bgCanvas }]} showsVerticalScrollIndicator={false}>
      {/* Header Info */}
      <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>Neighborhood Demand</Text>
        </View>
        <Text style={[styles.headerTitle, { fontSize: fs.xl, color: theme.textDark }]}>
          {t.navOpportunities}
        </Text>
        <Text style={[styles.headerSub, { fontSize: fs.xs, color: theme.textMuted }]}>
          Customer requests matched to your lifelong skills, locality, and ₹ INR rates. Tap any card for full details.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.indigoPrimary} style={{ marginVertical: 32 }} />
      ) : opportunities.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyTitle, { fontSize: fs.base, color: theme.textDark }]}>No active requests found</Text>
          <Text style={[styles.emptySub, { fontSize: fs.xs, color: theme.textMuted }]}>
            New requests are posted daily. Check back soon!
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {opportunities.map((opp) => (
            <TouchableOpacity
              key={opp.id}
              activeOpacity={0.88}
              onPress={() => setSelectedOpp(opp)}
              style={[
                styles.card,
                { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Opportunity: ${opp.title}`}
            >
              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{opp.category}</Text>
                </View>
                <View style={styles.matchScoreBadge}>
                  <Text style={styles.matchScoreLabel}>Match</Text>
                  <Text style={[styles.matchScoreVal, { color: theme.indigoPrimary }]}>{opp.match_score}%</Text>
                </View>
              </View>

              <Text style={[styles.title, { fontSize: fs.base, color: theme.textDark }]}>
                {opp.title}
              </Text>
              <Text style={[styles.description, { fontSize: fs.xs, color: theme.textSecondary }]} numberOfLines={2}>
                {opp.description}
              </Text>

              {/* Proximity & Time */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📍 {opp.customer_location} • {opp.distance_km} km</Text>
                <Text style={styles.metaText}>🕒 {opp.posted_ago || 'Recent'}</Text>
              </View>

              {/* Checklist Reason Chips */}
              <View style={styles.chipsRow}>
                {(opp.match_reasons || [`✓ Within ${opp.distance_km} km`, `✓ Matches verified skills`]).map((reason, idx) => (
                  <View key={idx} style={styles.reasonChip}>
                    <Text style={styles.reasonChipText}>{reason}</Text>
                  </View>
                ))}
              </View>

              {/* Bottom Action Row */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.budgetLabel}>Budget</Text>
                  <Text style={[styles.budgetText, { fontSize: fs.base, color: theme.textDark }]}>
                    {opp.budget_range}
                  </Text>
                </View>

                {opp.is_applied ? (
                  <View style={styles.appliedBtn}>
                    <Text style={styles.appliedBtnText}>✓ {t.interestSent}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation()
                      handleExpressInterest(opp.id)
                    }}
                    disabled={applyingOppId === opp.id}
                    style={[styles.expressBtn, { backgroundColor: theme.indigoPrimary }]}
                    accessibilityRole="button"
                    accessibilityLabel={t.expressInterest}
                  >
                    {applyingOppId === opp.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.expressBtnText}>✨ {t.expressInterest}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedOpp(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.bgSurface }]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.categoryBadge, { alignSelf: 'flex-start', marginBottom: 4 }]}>
                    <Text style={styles.categoryText}>{selectedOpp.category}</Text>
                  </View>
                  <Text style={[styles.modalTitle, { fontSize: fs.lg, color: theme.textDark }]}>
                    {selectedOpp.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedOpp(null)}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.detailSectionTitle, { color: theme.indigoPrimary }]}>Request Overview</Text>
                <Text style={[styles.detailBody, { fontSize: fs.sm, color: theme.textSecondary }]}>
                  {selectedOpp.description}
                </Text>

                <View style={styles.detailMetaGrid}>
                  <View style={[styles.detailMetaCard, { backgroundColor: theme.bgSubtle }]}>
                    <Text style={styles.detailMetaLabel}>Location</Text>
                    <Text style={[styles.detailMetaVal, { color: theme.textDark }]}>📍 {selectedOpp.customer_location}</Text>
                    <Text style={{ fontSize: 10, color: '#64748B' }}>{selectedOpp.distance_km} km away</Text>
                  </View>
                  <View style={[styles.detailMetaCard, { backgroundColor: theme.bgSubtle }]}>
                    <Text style={styles.detailMetaLabel}>Client Budget</Text>
                    <Text style={[styles.detailMetaVal, { color: theme.indigoPrimary }]}>{selectedOpp.budget_range}</Text>
                    <Text style={{ fontSize: 10, color: '#64748B' }}>Direct payment to you</Text>
                  </View>
                </View>

                <Text style={[styles.detailSectionTitle, { color: theme.indigoPrimary, marginTop: 12 }]}>
                  AI Match Criteria ({selectedOpp.match_score}%)
                </Text>
                <View style={{ gap: 4, marginTop: 4 }}>
                  {(selectedOpp.match_reasons || [`✓ Within ${selectedOpp.distance_km} km`, `✓ Matches verified skills`]).map((reason, idx) => (
                    <Text key={idx} style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>
                      {reason}
                    </Text>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  onPress={() => setSelectedOpp(null)}
                  style={[styles.modalBackBtn, { borderColor: theme.borderSubtle }]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to list"
                >
                  <Text style={[styles.modalBackText, { color: theme.textDark }]}>← Back to List</Text>
                </TouchableOpacity>

                {selectedOpp.is_applied ? (
                  <View style={[styles.appliedBtn, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={styles.appliedBtnText}>✓ {t.interestSent}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleExpressInterest(selectedOpp.id)}
                    disabled={applyingOppId === selectedOpp.id}
                    style={[styles.expressBtn, { flex: 1, backgroundColor: theme.indigoPrimary, alignItems: 'center', justifyContent: 'center' }]}
                    accessibilityRole="button"
                    accessibilityLabel={t.expressInterest}
                  >
                    {applyingOppId === selectedOpp.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.expressBtnText}>✨ {t.expressInterest}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
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
  headerBanner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  badgeRow: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B32E6',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontWeight: '900',
  },
  headerSub: {
    marginTop: 2,
    lineHeight: 16,
  },
  listContainer: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B32E6',
    textTransform: 'uppercase',
  },
  matchScoreBadge: {
    alignItems: 'flex-end',
  },
  matchScoreLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  matchScoreVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  title: {
    fontWeight: '800',
    lineHeight: 20,
  },
  description: {
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  reasonChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reasonChipText: {
    fontSize: 10,
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  budgetText: {
    fontWeight: '900',
  },
  expressBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  expressBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appliedBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  appliedBtnText: {
    color: '#059669',
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
    maxHeight: '85%',
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
    paddingTop: 12,
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
})
