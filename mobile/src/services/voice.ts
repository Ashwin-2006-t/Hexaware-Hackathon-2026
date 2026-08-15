import * as Speech from 'expo-speech'
import { Platform } from 'react-native'
import type { Language } from '../i18n/translations'

const langMap: Record<Language, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
}

let isSpeakingNative = false

export const VoiceService = {
  /**
   * Play text-to-speech audio in Indian English, Tamil, or Hindi
   */
  async speak(
    text: string,
    language: Language = 'en',
    onStart?: () => void,
    onDone?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    const targetLang = langMap[language] || 'en-IN'

    // If Web platform and SpeechSynthesis available
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = targetLang
      utterance.rate = 0.95
      utterance.onstart = () => {
        isSpeakingNative = true
        onStart?.()
      }
      utterance.onend = () => {
        isSpeakingNative = false
        onDone?.()
      }
      utterance.onerror = (e) => {
        isSpeakingNative = false
        onError?.(e)
      }
      window.speechSynthesis.speak(utterance)
      return
    }

    // Native iOS/Android with expo-speech
    try {
      Speech.stop()
      isSpeakingNative = true
      onStart?.()

      Speech.speak(text, {
        language: targetLang,
        pitch: 1.0,
        rate: 0.92,
        onDone: () => {
          isSpeakingNative = false
          onDone?.()
        },
        onStopped: () => {
          isSpeakingNative = false
          onDone?.()
        },
        onError: (err) => {
          isSpeakingNative = false
          onError?.(err)
        },
      })
    } catch (error) {
      isSpeakingNative = false
      onError?.(error)
    }
  },

  /**
   * Stop any playing text-to-speech audio
   */
  stop(): void {
    isSpeakingNative = false
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    Speech.stop()
  },

  /**
   * Check if speech is actively playing
   */
  async isSpeaking(): Promise<boolean> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking
    }
    return await Speech.isSpeakingAsync()
  },

  /**
   * Web Speech Recognition helper (STT)
   */
  startWebSpeechRecognition(
    language: Language,
    onResult: (text: string) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
  ): (() => void) | null {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return null
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      return null
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = langMap[language] || 'en-IN'
      recognition.interimResults = false

      recognition.onstart = () => onStart?.()
      recognition.onend = () => onEnd?.()
      recognition.onerror = () => onError?.()
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        onResult(transcript)
      }

      recognition.start()
      return () => {
        try {
          recognition.stop()
        } catch {
          // ignore
        }
      }
    } catch {
      onError?.()
      return null
    }
  }
}
