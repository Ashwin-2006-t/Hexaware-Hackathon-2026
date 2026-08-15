import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'
import { translations, type Language } from '../i18n/translations'
import { api } from '../services/api'
import type { OpportunityItem, User } from '../types'

interface HomeScreenProps {
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'xlarge'
  language: Language
  currentUser: User | null
  onNavigateTab: (tabId: string) => void
  onOpenSkillBuilder: () => void
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  highContrast,
  fontSize,
  language,
  currentUser,
  onNavigateTab,
  onOpenSkillBuilder,
}) => {
  const t = translations[language]
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadTopOpportunities()
  }, [currentUser])

  const loadTopOpportunities = async () => {
    try {
      const data = await api.getProviderOpportunities(currentUser?.id || 1)
      setOpportunities(data.opportunities?.slice(0, 3) || [])
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: t.heroCtaFind,
      sub: 'Browse neighborhood demand',
      icon: '🔍',
      action: () => onNavigateTab('opportunities'),
      accentColor: '#4B32E6',
    },
    {
      title: t.heroCtaOffer,
      sub: 'AI extract & list your skills',
      icon: '✨',
      action: onOpenSkillBuilder,
      accentColor: '#0284C7',
    },
    {
      title: t.navMentorBot,
      sub: 'Business guidance & pricing',
      icon: '🤖',
      action: () => onNavigateTab('assistant'),
      accentColor: '#4B32E6',
    },
    {
      title: t.navProfile,
      sub: 'Bookings & trust score',
      icon: '👤',
      action: () => onNavigateTab('profile'),
      accentColor: '#10B981',
    },
  ]

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bgCanvas }]} showsVerticalScrollIndicator={false}>
      {/* 1. Hero Welcome Banner (Deep Navy #0A0F24) */}
      <View style={[styles.heroCard, { backgroundColor: theme.navyDeep }]}>
        <View style={styles.verifiedTag}>
          <Text style={styles.verifiedTagText}>🛡️ {t.platformNotice}</Text>
        </View>

        <Text style={[styles.heroGreeting, { fontSize: fs.hero }]}>
          {currentUser ? `Namaste, ${currentUser.full_name}` : 'Namaste & Welcome'}
        </Text>
        <Text style={[styles.heroTagline, { fontSize: fs.sm }]}>
          {t.tagline}
        </Text>

        {/* Live Database Stats Badge */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>7+</Text>
            <Text style={styles.statLabel}>Seniors</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#4099FF' }]}>8</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#FACC15' }]}>5.0★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>₹0</Text>
            <Text style={styles.statLabel}>Commission</Text>
          </View>
        </View>
      </View>

      {/* 2. 4 Big Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: fs.lg, color: theme.textDark }]}>Quick Actions</Text>
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map((qa, index) => (
          <TouchableOpacity
            key={index}
            onPress={qa.action}
            style={[
              styles.actionCard,
              { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle },
            ]}
            accessibilityRole="button"
            accessibilityLabel={qa.title}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: `${qa.accentColor}15` }]}>
              <Text style={styles.actionIcon}>{qa.icon}</Text>
            </View>
            <Text style={[styles.actionTitle, { fontSize: fs.sm, color: theme.textDark }]}>
              {qa.title}
            </Text>
            <Text style={[styles.actionSub, { fontSize: fs.xs, color: theme.textMuted }]} numberOfLines={2}>
              {qa.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. Recommended Opportunities Preview */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: fs.lg, color: theme.textDark }]}>
          {t.navOpportunities}
        </Text>
        <TouchableOpacity onPress={() => onNavigateTab('opportunities')} accessibilityRole="button" accessibilityLabel="See all opportunities">
          <Text style={[styles.seeAllText, { color: theme.indigoPrimary }]}>See All →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={theme.indigoPrimary} style={{ marginVertical: 16 }} />
      ) : (
        <View style={styles.oppsList}>
          {opportunities.map((opp) => (
            <TouchableOpacity
              key={opp.id}
              onPress={() => onNavigateTab('opportunities')}
              style={[
                styles.oppCard,
                { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Opportunity: ${opp.title}`}
            >
              <View style={styles.oppHeader}>
                <View style={styles.oppCategoryBadge}>
                  <Text style={styles.oppCategoryText}>{opp.category}</Text>
                </View>
                <Text style={[styles.matchScoreText, { color: theme.indigoPrimary }]}>
                  {opp.match_score}% Match
                </Text>
              </View>

              <Text style={[styles.oppTitle, { fontSize: fs.sm, color: theme.textDark }]}>
                {opp.title}
              </Text>
              <Text style={[styles.oppDesc, { fontSize: fs.xs, color: theme.textSecondary }]} numberOfLines={2}>
                {opp.description}
              </Text>

              <View style={styles.oppFooter}>
                <Text style={styles.oppLocation}>📍 {opp.customer_location} • {opp.distance_km} km</Text>
                <Text style={[styles.oppBudget, { color: theme.textDark }]}>{opp.budget_range}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 4. 4-Step "How It Works" */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: fs.lg, color: theme.textDark }]}>
          {t.howItWorks}
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        {[
          { num: '01', title: t.step1Title, desc: t.step1Desc },
          { num: '02', title: t.step2Title, desc: t.step2Desc },
          { num: '03', title: t.step3Title, desc: t.step3Desc },
          { num: '04', title: t.step4Title, desc: t.step4Desc },
        ].map((s, idx) => (
          <View
            key={idx}
            style={[
              styles.stepCard,
              { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.stepNumBadge}>
              <Text style={styles.stepNumText}>{s.num}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { fontSize: fs.sm, color: theme.textDark }]}>{s.title}</Text>
              <Text style={[styles.stepDesc, { fontSize: fs.xs, color: theme.textMuted }]}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>

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
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  verifiedTag: {
    backgroundColor: 'rgba(64, 153, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(64, 153, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4099FF',
  },
  heroGreeting: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroTagline: {
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '900',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 120,
  },
  actionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionTitle: {
    fontWeight: '800',
  },
  actionSub: {
    marginTop: 2,
    lineHeight: 14,
  },
  oppsList: {
    gap: 10,
  },
  oppCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  oppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  oppCategoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  oppCategoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B32E6',
  },
  matchScoreText: {
    fontSize: 12,
    fontWeight: '900',
  },
  oppTitle: {
    fontWeight: '800',
  },
  oppDesc: {
    marginTop: 4,
    lineHeight: 16,
  },
  oppFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  oppLocation: {
    fontSize: 11,
    color: '#64748B',
  },
  oppBudget: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepsContainer: {
    gap: 8,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  stepNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4B32E6',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '800',
  },
  stepDesc: {
    marginTop: 1,
  },
})
