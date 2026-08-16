import React, { useState } from 'react'
import {
  Wand2, Sparkles, CheckCircle2, Lightbulb, Save,
  AlertCircle, Mic, MicOff, Edit3, RefreshCw, Volume2, VolumeX
} from 'lucide-react'
import type { ExtractedSkillItem, SkillExtractionResponse, User } from '../types'
import { api } from '../services/api'
import { formatINR } from '../utils/formatters'
import { translations, type Language } from '../i18n/translations'
import { LocationAutocomplete } from './LocationAutocomplete'

interface SkillExtractorProps {
  highContrast: boolean
  currentUser?: User | null
  onProfileCreated: () => void
  language?: Language
}

export const SkillExtractor: React.FC<SkillExtractorProps> = ({ highContrast, currentUser, onProfileCreated, language = 'en' }) => {
  const t = translations[language]

  const initialPrompt = language === 'ta'
    ? "நான் சென்னை மைலாப்பூரில் 35 ஆண்டுகளாக பாரம்பரிய தென்னிந்திய சமையல், இட்லி தோசை மாவு, சாம்பார் பொடி மற்றும் ஊறுகாய் தயாரிப்பில் அனுபவம் உள்ளேன்."
    : language === 'hi'
    ? "मैं दादर, मुंबई में 35 वर्षों से दक्षिण भारतीय भोजन, दैनिक टिफिन, पारंपरिक बेकिंग और घर के अचार बनाने में अनुभवी हूँ।"
    : "I am a retired teacher and homemaker in Dadar, Mumbai with 35 years of experience in South Indian home cooking, daily tiffin, traditional baking, and pickles. I love teaching families wholesome regional recipes."

  const [rawPrompt, setRawPrompt] = useState<string>(initialPrompt)
  const [preferredCategory, setPreferredCategory] = useState<string>('Cooking & Tiffin')
  const [loading, setLoading] = useState<boolean>(false)
  const [extractedData, setExtractedData] = useState<SkillExtractionResponse | null>(null)
  const [publishing, setPublishing] = useState<boolean>(false)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'ta-IN' | 'hi-IN'>(
    language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
  )

  // Editable Bio & Voice/TTS
  const [editableBio, setEditableBio] = useState<string>('')
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false)
  const [isBioListening, setIsBioListening] = useState<boolean>(false)
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false)

  // Location Autocomplete state
  const [publishLocation, setPublishLocation] = useState<string>(currentUser?.location_name || 'Dadar, Mumbai, Maharashtra')
  const [publishLat, setPublishLat] = useState<number | undefined>(currentUser?.latitude || 19.0178)
  const [publishLng, setPublishLng] = useState<number | undefined>(currentUser?.longitude || 72.8478)

  // Voice Speech Synthesis (TTS) - Reads AI suggestions aloud
  const handlePlayTTS = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.')
      return
    }

    if (isPlayingTTS) {
      window.speechSynthesis.cancel()
      setIsPlayingTTS(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = speechLang
    utterance.rate = 0.95
    utterance.onend = () => setIsPlayingTTS(false)
    utterance.onerror = () => setIsPlayingTTS(false)

    setIsPlayingTTS(true)
    window.speechSynthesis.speak(utterance)
  }

  // Voice Input (Web Speech API) for Prompt
  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(t.voiceUnsupported || 'Voice input is not supported in this browser. Please type directly.')
      return
    }

    if (isRecording) {
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = speechLang
      recognition.interimResults = false

      recognition.onstart = () => setIsRecording(true)
      recognition.onend = () => setIsRecording(false)
      recognition.onerror = () => setIsRecording(false)

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setRawPrompt((prev) => prev ? `${prev} ${transcript}` : transcript)
      }

      recognition.start()
    } catch {
      setIsRecording(false)
    }
  }

  // Voice Input (Web Speech API) for Editable Bio
  const toggleBioVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(t.voiceUnsupported || 'Voice input is not supported in this browser. Please type directly.')
      return
    }

    if (isBioListening) {
      setIsBioListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = speechLang
      recognition.interimResults = false

      recognition.onstart = () => setIsBioListening(true)
      recognition.onend = () => setIsBioListening(false)
      recognition.onerror = () => setIsBioListening(false)

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setEditableBio((prev) => prev ? `${prev} ${transcript}` : transcript)
      }

      recognition.start()
    } catch {
      setIsBioListening(false)
    }
  }

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawPrompt.trim()) return
    setLoading(true)
    setPublishMessage(null)
    try {
      const res = await api.extractSkills(rawPrompt, preferredCategory)
      setExtractedData(res)
      setEditableBio(res.generated_profile_bio)
    } catch (err: any) {
      alert(`Skill Extraction Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePublishService = async (skill: ExtractedSkillItem) => {
    setPublishing(true)
    try {
      await api.createService({
        title: skill.title,
        category: skill.category,
        description: `${editableBio || skill.suggested_bio} Key Highlights: ${skill.key_highlights.join(', ')}.`,
        price_per_hour: skill.suggested_hourly_rate,
        location_name: currentUser?.location_name || "Mumbai, Maharashtra"
      }, currentUser?.id || 1)

      setPublishMessage(`Successfully created live service listing "${skill.title}" for ${formatINR(skill.suggested_hourly_rate)}/hr!`)
      setTimeout(() => {
        onProfileCreated()
      }, 1500)
    } catch (err: any) {
      alert(`Error publishing service: ${err.message}`)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className={`p-6 md:p-8 rounded-2xl border shadow-sm ${
        highContrast 
          ? 'bg-black border-2 border-amber-400 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#4B32E6] text-white flex items-center justify-center font-bold">
            <Wand2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#4B32E6] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
            {t.navSkillBuilder}
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-1.5">{t.tagline}</h2>
        <p className="text-slate-600 text-sm leading-relaxed font-medium">
          Simply speak or type your background in plain language. Our Gemini AI agent structures your skills, crafts an honest biography, and recommends fair pricing in ₹ INR.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleExtract} className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
        highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase text-slate-700">
              Tell us about your background, passions, and lifelong skills:
            </label>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                isRecording 
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-[#4B32E6]'
              }`}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isRecording ? t.voiceListening : t.voiceMic}</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            placeholder="e.g. I have 35 years of experience stitching saree blouses, dress fitting, and hand embroidery in Pune..."
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:border-[#4B32E6] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="w-full md:w-1/2 space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-600">Preferred Primary Category</label>
            <select
              value={preferredCategory}
              onChange={(e) => setPreferredCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 text-xs focus:outline-none focus:border-[#4B32E6]"
            >
              <option value="Cooking & Tiffin">{t.cookingTiffin}</option>
              <option value="Tutoring & Mentoring">{t.tutoringMentoring}</option>
              <option value="Crafts & Tailoring">{t.craftsTailoring}</option>
              <option value="Gardening & Agriculture">{t.gardeningAgri}</option>
              <option value="Home Maintenance">{t.homeMaintenance}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-large w-full md:w-auto mt-2 md:mt-0 ${
              highContrast 
                ? 'bg-amber-400 text-black border-2 border-white' 
                : 'btn-indigo text-xs py-2 px-4 shadow-sm'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t.aiThinking}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#4099FF]" />
                <span>Extract Skills & Build Profile</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Extraction Results */}
      {extractedData && (
        <div className="space-y-5">
          {extractedData.ai_available === false && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-center gap-3 text-xs font-medium">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{t.aiUnavailable}</span>
            </div>
          )}

          {publishMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 font-semibold text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{publishMessage}</span>
            </div>
          )}

          {/* AI Mentor Tip Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 flex items-start gap-3 shadow-sm">
            <Lightbulb className="w-5 h-5 text-[#4099FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#4B32E6]">AI Mentor Advice:</h4>
              <p className="font-medium text-slate-700 mt-0.5 text-sm">{extractedData.ai_mentor_tip}</p>
            </div>
          </div>

          {/* Bio Copy Card with Edit / Regenerate / Voice TTS / Verify Banner */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">Generated Profile Bio</h3>
                  <span className="text-[10px] font-bold text-[#4B32E6] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                    AI-Assisted
                  </span>
                </div>
                <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block mt-1">
                  {t.verifyNotice}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Speech Language Selector */}
                <select
                  value={speechLang}
                  onChange={(e) => setSpeechLang(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 text-slate-700 rounded-md text-[11px] font-bold"
                >
                  <option value="en-IN">English (India)</option>
                  <option value="ta-IN">தமிழ் (Tamil)</option>
                  <option value="hi-IN">हिन्दी (Hindi)</option>
                </select>

                {/* Listen Aloud (TTS) Button */}
                <button
                  type="button"
                  onClick={() => handlePlayTTS(editableBio || extractedData.generated_profile_bio)}
                  className={`px-2.5 py-1 border rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isPlayingTTS
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  }`}
                  title="Listen to AI biography read aloud"
                >
                  {isPlayingTTS ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingTTS ? 'Stop' : 'Listen'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingBio(!isEditingBio)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#4B32E6]" />
                  <span>{isEditingBio ? 'Done' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExtract}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#4099FF]" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {isEditingBio ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Edit or dictate bio:</span>
                  <button
                    type="button"
                    onClick={toggleBioVoiceRecording}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                      isBioListening
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-blue-50 text-[#4B32E6] border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {isBioListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    <span>{isBioListening ? 'Listening...' : 'Voice Dictate'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={editableBio}
                  onChange={(e) => setEditableBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm font-medium focus:outline-none focus:border-[#4B32E6]"
                />
              </div>
            ) : (
              <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-medium">
                "{editableBio || extractedData.generated_profile_bio}"
              </p>
            )}
          </div>

          {/* Extracted Skill Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Extracted Skill Listings</h3>
              <span className="text-xs text-slate-500 font-semibold">Review details & publish</span>
            </div>

            {/* Location selector before publishing */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <LocationAutocomplete
                value={publishLocation}
                initialLatitude={publishLat}
                initialLongitude={publishLng}
                onLocationChange={(loc) => {
                  setPublishLocation(loc.locationName)
                  setPublishLat(loc.latitude)
                  setPublishLng(loc.longitude)
                }}
                highContrast={highContrast}
                language={language}
                label="Listing Location & Provider Neighborhood"
                required
              />
            </div>

            {extractedData.skills.map((skill, index) => (
              <div
                key={index}
                className={`p-5 rounded-xl border shadow-sm space-y-3 ${
                  highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#4B32E6] border border-blue-100 px-2 py-0.5 rounded">
                      {skill.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{skill.title}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {skill.years_experience} Years Experience • {skill.proficiency_level} Level
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlayTTS(`${skill.title}. ${skill.category}. ${skill.key_highlights.join(', ')}.`)}
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-[#4B32E6] hover:bg-slate-50 transition-colors"
                      title="Listen to skill details"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">{t.hourlyRate}</span>
                      <span className="text-xl font-black text-slate-900">{formatINR(skill.suggested_hourly_rate)}<span className="text-xs text-slate-500 font-normal">/hr</span></span>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skill.key_highlights.map((h, i) => (
                    <span key={i} className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded">
                      ✓ {h}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Will be pinned at <strong>{publishLocation || 'your location'}</strong>
                  </span>
                  <button
                    onClick={() => handlePublishService(skill)}
                    disabled={publishing}
                    className="btn-large btn-indigo text-xs py-1.5 px-3.5 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-[#4099FF]" />
                    <span>{publishing ? 'Publishing...' : 'Publish to Marketplace'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
