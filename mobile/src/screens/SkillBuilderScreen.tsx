import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'
import { translations, type Language } from '../i18n/translations'
import { api } from '../services/api'
import { VoiceService } from '../services/voice'
import { VoiceInputButton } from '../components/VoiceInputButton'
import { formatINR } from '../utils/formatters'
import type { SkillExtractionResponse, User } from '../types'

interface SkillBuilderScreenProps {
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'xlarge'
  language: Language
  currentUser: User | null
  onProfileCreated: () => void
  onClose: () => void
}

export const SkillBuilderScreen: React.FC<SkillBuilderScreenProps> = ({
  highContrast,
  fontSize,
  language,
  currentUser,
  onProfileCreated,
  onClose,
}) => {
  const t = translations[language]
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const initialPrompt = language === 'ta'
    ? "நான் சென்னை மைலாப்பூரில் 35 ஆண்டுகளாக பாரம்பரிய தென்னிந்திய சமையல், இட்லி தோசை மாவு, சாம்பார் பொடி மற்றும் ஊறுகாய் தயாரிப்பில் அனுபவம் உள்ளேன்."
    : language === 'hi'
    ? "मैं दादर, मुंबई में 35 वर्षों से दक्षिण भारतीय भोजन, दैनिक टिफिन, पारंपरिक बेकिंग और घर के अचार बनाने में अनुभवी हूँ।"
    : "I am a retired teacher and homemaker in Dadar, Mumbai with 35 years of experience in South Indian home cooking, daily tiffin, traditional baking, and pickles."

  const [prompt, setPrompt] = useState<string>(initialPrompt)
  const [category, setCategory] = useState<string>('Cooking & Tiffin')
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<SkillExtractionResponse | null>(null)
  const [editableBio, setEditableBio] = useState<string>('')
  const [publishing, setPublishing] = useState<boolean>(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false)

  const handleExtract = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await api.extractSkills(prompt, category)
      setResult(res)
      setEditableBio(res.generated_profile_bio)
    } catch (err: any) {
      Alert.alert('Skill Extraction Error', err.message || 'Unable to extract skills.')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (skill: any) => {
    setPublishing(true)
    try {
      await api.createService({
        title: skill.title,
        category: skill.category,
        price_per_hour: skill.suggested_hourly_rate,
        description: `${editableBio || skill.suggested_bio} Key Highlights: ${skill.key_highlights?.join(', ')}.`,
        location_name: currentUser?.location_name || 'Mumbai, Maharashtra',
      }, currentUser?.id || 1)

      Alert.alert('Success', `Published "${skill.title}" to the live marketplace for ${formatINR(skill.suggested_hourly_rate)}/hr!`)
      onProfileCreated()
    } catch (err: any) {
      Alert.alert('Publish Error', err.message || 'Unable to publish.')
    } finally {
      setPublishing(false)
    }
  }

  const handlePlayBioAudio = (text: string) => {
    if (isPlayingAudio) {
      VoiceService.stop()
      setIsPlayingAudio(false)
      return
    }

    VoiceService.speak(
      text,
      language,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bgCanvas }]} showsVerticalScrollIndicator={false}>
      {/* Top Header with Back Affordance */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.backBtn, { borderColor: theme.borderSubtle }]}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Text style={[styles.backBtnText, { color: theme.textDark }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.topNavTitle, { fontSize: fs.base, color: theme.textDark }]}>
          {t.navSkillBuilder}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Header Banner */}
      <View style={[styles.banner, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>AI Skill Identification</Text>
        </View>
        <Text style={[styles.bannerTitle, { fontSize: fs.lg, color: theme.textDark }]}>
          {t.tagline}
        </Text>
        <Text style={[styles.bannerSub, { fontSize: fs.xs, color: theme.textMuted }]}>
          Speak or type in plain language. Our Gemini AI agent structures your skills, creates an honest biography, and suggests fair ₹ INR rates.
        </Text>
      </View>

      {/* Input Card */}
      <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
        <View style={styles.labelRow}>
          <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>
            Describe your background & craftsmanship:
          </Text>
          <VoiceInputButton
            language={language}
            fieldLabel="Senior Skills"
            onVoiceResult={(transcript) => {
              setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript))
            }}
          />
        </View>

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.textArea, { borderColor: theme.borderSubtle, color: theme.textDark }]}
        />

        <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary, marginTop: 10 }]}>
          Primary Category
        </Text>
        <View style={styles.categoryPicker}>
          {['Cooking & Tiffin', 'Tutoring & Mentoring', 'Crafts & Tailoring', 'Gardening & Agriculture', 'Home Maintenance'].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.categoryBtn,
                category === cat && { backgroundColor: theme.indigoPrimary, borderColor: theme.indigoPrimary },
              ]}
              accessibilityRole="button"
              accessibilityLabel={cat}
            >
              <Text style={[styles.categoryBtnText, { color: category === cat ? '#FFFFFF' : theme.textDark }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleExtract}
          disabled={loading}
          style={[styles.extractBtn, { backgroundColor: theme.indigoPrimary }]}
          accessibilityRole="button"
          accessibilityLabel="Extract Skills and Build Profile"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.extractBtnText}>✨ Extract Skills & Build Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Extraction Results */}
      {result && (
        <View style={styles.resultsContainer}>
          {/* AI Mentor Advice */}
          <View style={styles.adviceBox}>
            <View style={styles.adviceHeader}>
              <Text style={styles.adviceTitle}>💡 AI Mentor Advice:</Text>
              <TouchableOpacity
                onPress={() => handlePlayBioAudio(result.ai_mentor_tip)}
                style={styles.voicePlayBtn}
                accessibilityRole="button"
                accessibilityLabel="Listen to mentor advice"
              >
                <Text style={styles.voicePlayBtnText}>{isPlayingAudio ? '⏹️ Stop' : '🔊 Listen'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.adviceText}>{result.ai_mentor_tip}</Text>
          </View>

          {/* Generated Bio Card with Verification Notice & Audio Playback */}
          <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
            <View style={styles.bioHeader}>
              <View>
                <Text style={[styles.bioTitle, { fontSize: fs.base, color: theme.textDark }]}>Generated Profile Bio</Text>
                <View style={styles.verifyBadge}>
                  <Text style={styles.verifyBadgeText}>{t.verifyNotice}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handlePlayBioAudio(editableBio || result.generated_profile_bio)}
                style={styles.voicePlayBtn}
                accessibilityRole="button"
                accessibilityLabel="Listen to bio audio"
              >
                <Text style={styles.voicePlayBtnText}>{isPlayingAudio ? '⏹️ Stop' : '🔊 Listen to Bio'}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={editableBio}
              onChangeText={setEditableBio}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea, { borderColor: theme.borderSubtle, color: theme.textDark }]}
            />
          </View>

          {/* Extracted Skills List */}
          <Text style={[styles.sectionTitle, { fontSize: fs.lg, color: theme.textDark }]}>
            Extracted Marketable Services
          </Text>

          {result.skills?.map((s, index) => (
            <View
              key={index}
              style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}
            >
              <View style={styles.skillHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.skillCategory}>{s.category}</Text>
                  <Text style={[styles.skillTitle, { fontSize: fs.base, color: theme.textDark }]}>{s.title}</Text>
                  <Text style={styles.skillMeta}>{s.years_experience} Yrs Experience • {s.proficiency_level}</Text>
                </View>
                <View style={styles.rateBox}>
                  <Text style={styles.rateLabel}>{t.hourlyRate}</Text>
                  <Text style={[styles.rateVal, { color: theme.textDark }]}>{formatINR(s.suggested_hourly_rate)}/hr</Text>
                </View>
              </View>

              <View style={styles.highlightsRow}>
                {s.key_highlights?.map((h, hIdx) => (
                  <View key={hIdx} style={styles.highlightChip}>
                    <Text style={styles.highlightChipText}>✓ {h}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => handlePublish(s)}
                disabled={publishing}
                style={[styles.publishBtn, { backgroundColor: theme.indigoPrimary }]}
                accessibilityRole="button"
                accessibilityLabel={`Publish ${s.title}`}
              >
                <Text style={styles.publishBtnText}>Publish to Marketplace</Text>
              </TouchableOpacity>
            </View>
          ))}
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
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  topNavTitle: {
    fontWeight: '900',
  },
  banner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  bannerTitle: {
    fontWeight: '900',
  },
  bannerSub: {
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontWeight: '700',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  categoryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    minHeight: 34,
    justifyContent: 'center',
  },
  categoryBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  extractBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  extractBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultsContainer: {
    gap: 10,
  },
  adviceBox: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    padding: 12,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adviceTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3730A3',
    textTransform: 'uppercase',
  },
  adviceText: {
    fontSize: 12,
    color: '#1E1B4B',
    lineHeight: 16,
  },
  voicePlayBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minHeight: 28,
    justifyContent: 'center',
  },
  voicePlayBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4B32E6',
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bioTitle: {
    fontWeight: '800',
  },
  verifyBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  verifyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
  },
  sectionTitle: {
    fontWeight: '900',
    marginTop: 8,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  skillCategory: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B32E6',
    textTransform: 'uppercase',
  },
  skillTitle: {
    fontWeight: '800',
    marginTop: 2,
  },
  skillMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rateBox: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  rateVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 10,
  },
  highlightChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highlightChipText: {
    fontSize: 10,
    color: '#475569',
  },
  publishBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 44,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
})
