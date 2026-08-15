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
import type { BusinessGuidanceResponse } from '../types'

interface AssistantScreenProps {
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'xlarge'
  language: Language
}

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  suggestedActions?: string[]
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  highContrast,
  fontSize,
  language,
}) => {
  const t = translations[language]
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const [activeMode, setActiveMode] = useState<'chat' | 'business'>('chat')

  // Chat State
  const initialGreeting = language === 'ta'
    ? "வணக்கம்! நான் 'SilverBot' — உங்கள் மூத்தோர் மற்றும் சுயதொழில் வழிகாட்டி. நியாயமான ₹ INR கட்டணம் நிர்ணயிப்பது, வாடிக்கையாளர் அணுகுமுறை மற்றும் வீட்டு சேவைகளில் உங்களுக்கு உதவ நான் தயாராக உள்ளேன்!"
    : language === 'hi'
    ? "नमस्ते! मैं 'SilverBot' हूँ — आपका वरिष्ठ और सूक्ष्म-व्यवसाय मेंटर। मैं आपको ₹ INR में सही दरें तय करने और गृह सेवाओं को शुरू करने में मदद कर सकता हूँ।"
    : "Namaste! I am 'SilverBot', your dedicated micro-business & senior mentor. I can help you set fair pricing in ₹ INR, prepare for home visits, and confidently share your lifelong skills!"

  const initialActions = language === 'ta'
    ? ["சேவைகளுக்கான ₹ INR கட்டண பரிந்துரை", "வீட்டு சமையல் மற்றும் பாதுகாப்பு குறிப்புகள்", "5-star மதிப்பாய்வு பெறுவது எப்படி?"]
    : language === 'hi'
    ? ["₹ INR में प्रति घंटा दरें", "सुरक्षा एवं ग्राहक शिष्टाचार", "5-star समीक्षा कैसे प्राप्त करें?"]
    : ["Recommended hourly rates in ₹ INR", "Safety tips for home tiffin & visits", "How to ask for a 5-star review"]

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: initialGreeting,
      suggestedActions: initialActions,
    },
  ])
  const [inputText, setInputText] = useState<string>('')
  const [chatLoading, setChatLoading] = useState<boolean>(false)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)

  // Business Guidance State
  const [topic, setTopic] = useState<string>(
    language === 'ta' ? 'பாரம்பரிய மாங்காய் ஊறுகாய் மற்றும் பொடிகள் தயாரித்தல்' : 'Daily South Indian Home Tiffin & Meals'
  )
  const [location, setLocation] = useState<string>('Dadar / Matunga, Mumbai')
  const [guidance, setGuidance] = useState<BusinessGuidanceResponse | null>(null)
  const [guidanceLoading, setGuidanceLoading] = useState<boolean>(false)

  const handleSendMessage = async (customText?: string) => {
    const text = customText || inputText
    if (!text.trim()) return

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setChatLoading(true)

    try {
      const res = await api.chatWithSeniorMentor(text, 'senior_provider', language)
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        suggestedActions: res.suggested_actions,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err: any) {
      let errorText = t.aiUnavailable
      if (err.message && (err.message.includes('Network') || err.message.includes('Failed to fetch') || err.message.includes('fetch') || err.message.includes('failed'))) {
        errorText = `⚠️ Connection error: Unable to reach the SilverHands backend server. Please verify your phone is on the same Wi-Fi network and check your LAN endpoint in the Profile tab.`
      }
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: errorText,
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setChatLoading(false)
    }
  }

  const handlePlayAudio = (messageId: string, text: string) => {
    if (playingMessageId === messageId) {
      VoiceService.stop()
      setPlayingMessageId(null)
      return
    }

    VoiceService.speak(
      text,
      language,
      () => setPlayingMessageId(messageId),
      () => setPlayingMessageId(null),
      () => setPlayingMessageId(null)
    )
  }

  const handleGenerateGuidance = async () => {
    setGuidanceLoading(true)
    try {
      const res = await api.getBusinessGuidance(topic, location)
      setGuidance(res)
    } catch (err: any) {
      Alert.alert('Guidance Error', err.message || 'Unable to generate business plan.')
    } finally {
      setGuidanceLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bgCanvas }]}>
      {/* Mode Switcher */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          onPress={() => setActiveMode('chat')}
          style={[
            styles.modeTab,
            activeMode === 'chat' && { backgroundColor: theme.indigoPrimary },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Senior Mentor Bot"
        >
          <Text style={[styles.modeTabText, activeMode === 'chat' && { color: '#FFFFFF' }]}>
            🤖 Senior Mentor Bot
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveMode('business')}
          style={[
            styles.modeTab,
            activeMode === 'business' && { backgroundColor: theme.indigoPrimary },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Business Guidance Plan"
        >
          <Text style={[styles.modeTabText, activeMode === 'business' && { color: '#FFFFFF' }]}>
            📋 Business Guidance Plan
          </Text>
        </TouchableOpacity>
      </View>

      {activeMode === 'chat' ? (
        <View style={styles.chatWrapper}>
          {/* Chat Messages */}
          <ScrollView style={styles.messagesScroll} showsVerticalScrollIndicator={false}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bubbleContainer,
                  msg.sender === 'user' ? styles.userBubbleAlign : styles.botBubbleAlign,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.sender === 'user'
                      ? [styles.userBubble, { backgroundColor: theme.indigoPrimary }]
                      : [styles.botBubble, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }],
                  ]}
                >
                  {msg.sender === 'bot' && (
                    <View style={styles.botBubbleHeader}>
                      <Text style={styles.botLabel}>✨ SilverBot Mentor</Text>
                      <TouchableOpacity
                        onPress={() => handlePlayAudio(msg.id, msg.text)}
                        style={styles.voicePlayBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Listen to audio"
                      >
                        <Text style={styles.voicePlayBtnText}>
                          {playingMessageId === msg.id ? '⏹️ Stop' : '🔊 Listen'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.bubbleText,
                      { fontSize: fs.xs },
                      msg.sender === 'user' ? { color: '#FFFFFF' } : { color: theme.textDark },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>

                {/* Suggested Action Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <View style={styles.chipsWrap}>
                    {msg.suggestedActions.map((action, aIdx) => (
                      <TouchableOpacity
                        key={aIdx}
                        onPress={() => handleSendMessage(action)}
                        style={styles.actionChip}
                        accessibilityRole="button"
                        accessibilityLabel={action}
                      >
                        <Text style={styles.actionChipText}>💬 {action}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {chatLoading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={theme.indigoPrimary} />
                <Text style={styles.loadingText}>{t.aiThinking}</Text>
              </View>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Input Bar with Voice Input */}
          <View style={[styles.inputBar, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              placeholder="Ask about pricing, safety, tiffin setup..."
              placeholderTextColor="#94A3B8"
              style={[styles.chatInput, { color: theme.textDark }]}
            />
            <VoiceInputButton
              language={language}
              fieldLabel="Ask SilverBot"
              onVoiceResult={(transcript) => {
                setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript))
              }}
            />
            <TouchableOpacity
              onPress={() => handleSendMessage()}
              disabled={chatLoading}
              style={[styles.sendBtn, { backgroundColor: theme.indigoPrimary }]}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.guidanceScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.cardTitle, { fontSize: fs.base, color: theme.textDark }]}>
              5-Part Micro-Business Guidance
            </Text>
            <Text style={[styles.cardSub, { fontSize: fs.xs, color: theme.textMuted }]}>
              Actionable startup plan with pricing in ₹ INR, target clientele, packaging, and zero-cost marketing.
            </Text>

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Business Service Concept</Text>
              <VoiceInputButton
                language={language}
                fieldLabel="Business Idea"
                onVoiceResult={(transcript) => setTopic(transcript)}
              />
            </View>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
            />

            <View style={[styles.labelRow, { marginTop: 6 }]}>
              <Text style={styles.fieldLabel}>Target Neighborhood</Text>
              <VoiceInputButton
                language={language}
                fieldLabel="Neighborhood Location"
                onVoiceResult={(transcript) => setLocation(transcript)}
              />
            </View>
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
            />

            <TouchableOpacity
              onPress={handleGenerateGuidance}
              disabled={guidanceLoading}
              style={[styles.generateBtn, { backgroundColor: theme.indigoPrimary }]}
              accessibilityRole="button"
              accessibilityLabel="Generate Action Plan"
            >
              {guidanceLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.generateBtnText}>Generate Action Plan</Text>
              )}
            </TouchableOpacity>
          </View>

          {guidance && (
            <View style={styles.guidanceResults}>
              {/* Disclaimer Notice */}
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>⚠️ {guidance.disclaimer}</Text>
              </View>

              <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
                <Text style={styles.sectionHeader}>1. Idea Summary</Text>
                <Text style={[styles.sectionBody, { fontSize: fs.xs, color: theme.textSecondary }]}>{guidance.idea_summary}</Text>

                <Text style={styles.sectionHeader}>2. Target Customers</Text>
                <Text style={[styles.sectionBody, { fontSize: fs.xs, color: theme.textSecondary }]}>{guidance.target_customers}</Text>

                <Text style={styles.sectionHeader}>3. Fair ₹ INR Pricing Strategy</Text>
                <Text style={[styles.sectionBody, { fontSize: fs.xs, color: theme.textSecondary }]}>{guidance.pricing_strategy}</Text>

                <Text style={styles.sectionHeader}>4. Zero-Cost Marketing & Outreach</Text>
                <Text style={[styles.sectionBody, { fontSize: fs.xs, color: theme.textSecondary }]}>{guidance.marketing_and_outreach}</Text>

                <Text style={styles.sectionHeader}>5. First 3 Action Steps</Text>
                {guidance.first_three_steps?.map((step, sIdx) => (
                  <Text key={sIdx} style={[styles.stepItem, { fontSize: fs.xs, color: theme.textSecondary }]}>
                    {sIdx + 1}. {step}
                  </Text>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  chatWrapper: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  bubbleContainer: {
    marginBottom: 12,
  },
  userBubbleAlign: {
    alignItems: 'flex-end',
  },
  botBubbleAlign: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  botBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  botLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B32E6',
    textTransform: 'uppercase',
  },
  voicePlayBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  voicePlayBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B32E6',
  },
  bubbleText: {
    lineHeight: 18,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
    maxWidth: '90%',
  },
  actionChip: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 28,
    justifyContent: 'center',
  },
  actionChipText: {
    fontSize: 10,
    color: '#4B32E6',
    fontWeight: '600',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  loadingText: {
    fontSize: 11,
    color: '#64748B',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    gap: 4,
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
    paddingHorizontal: 6,
    minHeight: 40,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  guidanceScroll: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: '900',
  },
  cardSub: {
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    minHeight: 40,
  },
  generateBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 44,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  guidanceResults: {
    gap: 8,
  },
  disclaimerBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B32E6',
    marginTop: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  sectionBody: {
    lineHeight: 16,
  },
  stepItem: {
    marginTop: 4,
    lineHeight: 16,
  },
})
