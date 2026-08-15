import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native'
import { VoiceService } from '../services/voice'
import { translations, type Language } from '../i18n/translations'

interface VoiceInputButtonProps {
  language: Language
  onVoiceResult: (text: string) => void
  fieldLabel?: string
  presetSuggestions?: string[]
  buttonSize?: 'small' | 'medium'
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  language,
  onVoiceResult,
  fieldLabel = 'Voice Input',
  presetSuggestions,
  buttonSize = 'small',
}) => {
  const t = translations[language]
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [showNativeVoiceModal, setShowNativeVoiceModal] = useState<boolean>(false)
  const [stopFn, setStopFn] = useState<(() => void) | null>(null)

  const defaultPresets = language === 'ta'
    ? [
        'நான் 35 ஆண்டுகளாக பாரம்பரிய தென்னிந்திய சமையல் மற்றும் இட்லி தோசை மாவு தயாரிப்பில் அனுபவம் உள்ளேன்.',
        'தையல் மற்றும் ரவிக்கை தைப்பதில் 20 ஆண்டுகள் அனுபவம்.',
        'பள்ளிக் குழந்தைகளுக்கு கணிதம் மற்றும் அறிவியல் பாடம் கற்பித்தல்.',
        'வீட்டுத் தோட்டம் மற்றும் மாடித் தோட்டம் பராமரிப்பு.'
      ]
    : language === 'hi'
    ? [
        'मैं 35 वर्षों से दक्षिण भारतीय भोजन, दैनिक टिफिन और घर के अचार बनाने में अनुभवी हूँ।',
        'साड़ी ब्लाउज सिलाई और ड्रेस फिटिंग में 20 वर्ष का अनुभव।',
        'कक्षा 1 से 10 तक के बच्चों को गणित और विज्ञान ट्यूशन।',
        'बालकनी और छत के किचन गार्डन की देखभाल।'
      ]
    : [
        'I have 35 years of experience in South Indian home cooking, daily tiffin, and pickles.',
        '20 years experience stitching saree blouses, dress fitting, and hand embroidery.',
        'Math and science tuition for primary and high school students.',
        'Terrace kitchen gardening and organic plant care.'
      ]

  const suggestions = presetSuggestions && presetSuggestions.length > 0 ? presetSuggestions : defaultPresets

  const handlePress = () => {
    // If on Web with SpeechRecognition support
    if (Platform.OS === 'web') {
      if (isRecording) {
        stopFn?.()
        setIsRecording(false)
        return
      }

      const cleanup = VoiceService.startWebSpeechRecognition(
        language,
        (transcript) => {
          onVoiceResult(transcript)
          setIsRecording(false)
        },
        () => setIsRecording(true),
        () => setIsRecording(false),
        () => {
          setIsRecording(false)
          setShowNativeVoiceModal(true)
        }
      )

      if (cleanup) {
        setStopFn(() => cleanup)
      } else {
        setShowNativeVoiceModal(true)
      }
    } else {
      // Native iOS / Android: Show Voice Assistance Modal with dictation prompts & voice presets
      setShowNativeVoiceModal(true)
    }
  }

  const handleSelectPreset = (text: string) => {
    onVoiceResult(text)
    setShowNativeVoiceModal(false)
  }

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.btn,
          buttonSize === 'medium' ? styles.btnMedium : styles.btnSmall,
          isRecording && styles.btnActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? t.voiceListening : t.voiceMic}
      >
        <Text style={[styles.btnIcon, isRecording && { color: '#EF4444' }]}>
          {isRecording ? '🔴' : '🎙️'}
        </Text>
        <Text
          style={[
            styles.btnText,
            isRecording ? { color: '#EF4444', fontWeight: 'bold' } : { color: '#4B32E6' },
          ]}
        >
          {isRecording ? t.voiceListening : t.voiceMic}
        </Text>
      </TouchableOpacity>

      {/* Voice Assistance Modal (For Native Mobile & Senior-Friendly Voice Dictation) */}
      {showNativeVoiceModal && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setShowNativeVoiceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalIcon}>🎙️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{t.voiceMic} Assistance</Text>
                    <Text style={styles.modalSub}>{fieldLabel} ({language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिन्दी' : 'English'})</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowNativeVoiceModal(false)}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close voice modal"
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.activeListeningBadge}>
                <Text style={styles.listeningDot}>●</Text>
                <Text style={styles.listeningText}>
                  Tap any common senior skill phrase below to fill instantly, or use your keyboard microphone:
                </Text>
              </View>

              <ScrollView style={{ maxHeight: 280, marginVertical: 10 }} showsVerticalScrollIndicator={false}>
                {suggestions.map((phrase, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectPreset(phrase)}
                    style={styles.presetCard}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose phrase: ${phrase}`}
                  >
                    <Text style={styles.presetIcon}>💬</Text>
                    <Text style={styles.presetText}>"{phrase}"</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowNativeVoiceModal(false)}
                style={styles.doneBtn}
                accessibilityRole="button"
                accessibilityLabel="Close voice assistant"
              >
                <Text style={styles.doneBtnText}>Close Voice Assistant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    minHeight: 32,
  },
  btnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnMedium: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
  },
  btnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  btnIcon: {
    fontSize: 13,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalIcon: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  activeListeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  listeningDot: {
    color: '#4B32E6',
    fontSize: 14,
  },
  listeningText: {
    fontSize: 11,
    color: '#3730A3',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  presetIcon: {
    fontSize: 16,
  },
  presetText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  doneBtn: {
    backgroundColor: '#4B32E6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 44,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
})
