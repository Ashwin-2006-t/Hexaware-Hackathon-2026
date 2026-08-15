import React, { useState } from 'react'
import {
  Bot, Send, Sparkles, AlertCircle, Lightbulb,
  CheckCircle2, DollarSign, Users, Target, Package,
  Mic, MicOff, Volume2, VolumeX
} from 'lucide-react'
import { api } from '../services/api'
import type { BusinessGuidanceResponse } from '../types'
import { translations, type Language } from '../i18n/translations'

interface Message {
  sender: 'user' | 'bot'
  text: string
  suggestedActions?: string[]
}

interface SeniorMentorBotProps {
  highContrast: boolean
  language?: Language
}

export const SeniorMentorBot: React.FC<SeniorMentorBotProps> = ({ highContrast, language = 'en' }) => {
  const t = translations[language]
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'business'>('chat')

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

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: initialGreeting,
      suggestedActions: initialActions
    }
  ])
  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [aiUnavailable, setAiUnavailable] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false)

  // Business Guidance State
  const [businessQuery, setBusinessQuery] = useState<string>(
    language === 'ta' ? 'பாரம்பரிய மாங்காய் ஊறுகாய் மற்றும் பொடிகள் தயாரித்தல்' : 'Sell authentic homemade mango & lime pickles'
  )
  const [businessLocation, setBusinessLocation] = useState<string>('Chennai / Mumbai')
  const [businessLoading, setBusinessLoading] = useState<boolean>(false)
  const [guidanceResult, setGuidanceResult] = useState<BusinessGuidanceResponse | null>(null)

  // Web Speech API - Speech Recognition (STT)
  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(t.voiceUnsupported)
      return
    }

    if (isRecording) {
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      const langMap: Record<Language, string> = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' }
      recognition.lang = langMap[language] || 'en-IN'
      recognition.interimResults = false

      recognition.onstart = () => setIsRecording(true)
      recognition.onend = () => setIsRecording(false)
      recognition.onerror = () => setIsRecording(false)

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput((prev) => prev ? `${prev} ${transcript}` : transcript)
      }

      recognition.start()
    } catch {
      setIsRecording(false)
    }
  }

  // Web Speech API - Text to Speech (TTS)
  const handlePlayAudio = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech audio is not supported in this browser.')
      return
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const langMap: Record<Language, string> = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' }
    utterance.lang = langMap[language] || 'en-IN'
    utterance.rate = 0.95

    utterance.onstart = () => setIsPlayingAudio(true)
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    window.speechSynthesis.speak(utterance)
  }

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim()) return

    const newMessages: Message[] = [...messages, { sender: 'user', text: query }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.chatWithSeniorMentor(query, 'senior_provider', language)
      setAiUnavailable(!res.ai_available)
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: res.reply,
          suggestedActions: res.suggested_actions
        }
      ])
    } catch {
      setAiUnavailable(true)
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: "Namaste! On SilverHands in India, setting an hourly rate between ₹250 and ₹450 is ideal for initial bookings. As you complete jobs and earn 5-star reviews, you can increase your rate."
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBusinessGuidance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessQuery.trim()) return
    setBusinessLoading(true)
    try {
      const res = await api.getBusinessGuidance(businessQuery, businessLocation)
      setGuidanceResult(res)
    } catch (err: any) {
      alert(`Business Guidance Error: ${err.message}`)
    } finally {
      setBusinessLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Container */}
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
            highContrast ? 'bg-amber-400 text-black' : 'bg-blue-600 text-white'
          }`}>
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black">{t.navMentorBot}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Practical ₹ INR Pricing • Home Business Guidance • Safety & Etiquette
            </p>
          </div>
        </div>

        {/* Sub-tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mentor Chat
          </button>
          <button
            onClick={() => setActiveSubTab('business')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'business'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Business Plan Guide
          </button>
        </div>
      </div>

      {aiUnavailable && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-center gap-3 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{t.aiUnavailable}</span>
        </div>
      )}

      {/* Tab 1: Senior Mentor Chat */}
      {activeSubTab === 'chat' && (
        <div className={`p-6 rounded-2xl border shadow-sm min-h-[440px] flex flex-col justify-between ${
          highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Messages Container */}
          <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-2xl p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white font-semibold rounded-br-none'
                      : highContrast
                        ? 'bg-zinc-900 text-amber-300 border border-amber-400 rounded-bl-none'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="flex items-center justify-between gap-2 mb-1.5 text-xs font-bold text-blue-700">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>SilverBot Business Mentor</span>
                      </div>
                      <button
                        onClick={() => handlePlayAudio(msg.text)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 cursor-pointer"
                        title={isPlayingAudio ? t.stopAudio : t.playAudio}
                      >
                        {isPlayingAudio ? <VolumeX className="w-4 h-4 text-blue-600" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>

                {/* Suggested Action Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={() => handleSend(action)}
                        className="px-3 py-1 bg-slate-50 text-slate-700 text-xs font-medium rounded-full border border-slate-200 hover:bg-slate-100 hover:text-blue-700 transition-all cursor-pointer"
                      >
                        💡 {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">{t.aiThinking}</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="pt-4 mt-4 border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2.5"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={language === 'ta' ? 'விலை, வாடிக்கையாளர் ஆலோசனை பற்றி கேளுங்கள்...' : "Ask SilverBot about pricing in ₹ INR, customer safety, or tiffin prep..."}
                  className="w-full p-3 pr-12 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-xs cursor-pointer ${
                    isRecording ? 'text-rose-600 animate-pulse' : 'text-slate-400 hover:text-blue-600'
                  }`}
                  title={t.voiceMic}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn-large ${
                  highContrast 
                    ? 'bg-amber-400 text-black border-2 border-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{t.navAskAI}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Business Guidance Generator */}
      {activeSubTab === 'business' && (
        <div className="space-y-6">
          <form onSubmit={handleGenerateBusinessGuidance} className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
            highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-black">Generate Micro-Business Guidance Plan</h3>
            <p className="text-xs text-slate-500">
              Get an actionable 5-part plan for informal home services in India (concept, customers, ₹ INR pricing, marketing, first 3 steps, packaging & hygiene).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Idea / Skill Topic</label>
                <input
                  type="text"
                  value={businessQuery}
                  onChange={(e) => setBusinessQuery(e.target.value)}
                  placeholder="e.g. Sell homemade pickles, saree blouse tailoring, balcony gardening"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Neighborhood / City</label>
                <input
                  type="text"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                  placeholder="e.g. Dadar, Mumbai or Mylapore, Chennai"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={businessLoading}
              className="btn-large w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm text-sm"
            >
              {businessLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.aiThinking}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Business Guidance Plan</span>
                </>
              )}
            </button>
          </form>

          {/* Sectioned Guidance Results */}
          {guidanceResult && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium">
                ℹ️ {guidanceResult.disclaimer}
              </div>

              {/* 1. Idea & Target Customers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <Lightbulb className="w-4 h-4" />
                    <span>1. Concept & Market Demand</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{guidanceResult.idea_summary}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <Users className="w-4 h-4" />
                    <span>2. Target Customers</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{guidanceResult.target_customers}</p>
                </div>
              </div>

              {/* 2. Pricing & Marketing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <DollarSign className="w-4 h-4" />
                    <span>3. Pricing Strategy (in ₹ INR)</span>
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed font-bold">{guidanceResult.pricing_strategy}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <Target className="w-4 h-4" />
                    <span>4. Zero-Cost Neighborhood Marketing</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{guidanceResult.marketing_and_outreach}</p>
                </div>
              </div>

              {/* 3. First 3 Steps & Packaging */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>5. Your First 3 Immediate Action Steps</span>
                </div>
                <div className="space-y-1.5">
                  {guidanceResult.first_three_steps.map((step, sIdx) => (
                    <div key={sIdx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium">
                      {step}
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase mb-1">
                    <Package className="w-4 h-4" />
                    <span>Packaging & Hygiene Standards</span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{guidanceResult.packaging_and_hygiene}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
