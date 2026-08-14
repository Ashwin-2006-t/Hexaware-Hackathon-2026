import React, { useState } from 'react'
import { Wand2, Sparkles, CheckCircle2, Lightbulb, Save } from 'lucide-react'
import type { ExtractedSkillItem, SkillExtractionResponse } from '../types'
import { api } from '../services/api'

interface SkillExtractorProps {
  highContrast: boolean
  onProfileCreated: () => void
}

export const SkillExtractor: React.FC<SkillExtractorProps> = ({ highContrast, onProfileCreated }) => {
  const [rawPrompt, setRawPrompt] = useState<string>(
    "I am a retired teacher and homemaker with 35 years of experience in South Indian home cooking, traditional baking, and pickles. I love teaching families and young professionals how to cook wholesome, hygienic daily meals."
  )
  const [preferredCategory, setPreferredCategory] = useState<string>('Cooking & Baking')
  const [loading, setLoading] = useState<boolean>(false)
  const [extractedData, setExtractedData] = useState<SkillExtractionResponse | null>(null)
  const [publishing, setPublishing] = useState<boolean>(false)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawPrompt.trim()) return
    setLoading(true)
    setPublishMessage(null)
    try {
      const res = await api.extractSkills(rawPrompt, preferredCategory)
      setExtractedData(res)
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
        description: `${skill.suggested_bio} Key Highlights: ${skill.key_highlights.join(', ')}.`,
        price_per_hour: skill.suggested_hourly_rate
      }, 1)

      setPublishMessage(`Successfully created live service listing "${skill.title}" for $${skill.suggested_hourly_rate}/hr!`)
      setTimeout(() => {
        onProfileCreated()
      }, 1800)
    } catch (err: any) {
      alert(`Error publishing service: ${err.message}`)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className={`card-senior p-8 rounded-3xl border-2 ${
        highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white border-amber-400'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center font-bold">
            <Wand2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
            Senior Skill & Profile Builder Agent
          </span>
        </div>
        <h2 className="text-3xl font-black mb-3">Turn Your Lifelong Experience into a Digital Profile</h2>
        <p className="text-amber-50 text-lg leading-relaxed font-medium">
          Simply speak or type your background, hobbies, and past work in plain language. Our Gemini AI agent will format your skills, draft a warm bio, and suggest fair hourly pricing!
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleExtract} className={`card-senior p-6 space-y-6 border-2 ${
        highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-2">
          <label className="block text-lg font-black text-slate-900">Tell us about your skills, passions, or experience:</label>
          <textarea
            rows={4}
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            placeholder="e.g. I have 40 years of experience making custom dresses, repairing garments, and teaching embroidery..."
            className="w-full p-4 border-2 border-slate-300 rounded-2xl text-base font-medium focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2 space-y-1">
            <label className="block text-sm font-bold text-slate-700">Preferred Primary Category</label>
            <select
              value={preferredCategory}
              onChange={(e) => setPreferredCategory(e.target.value)}
              className="w-full p-3 border-2 border-slate-300 rounded-xl font-bold text-slate-800"
            >
              <option value="Cooking & Baking">Cooking & Baking</option>
              <option value="Tutoring & Mentoring">Tutoring & Mentoring</option>
              <option value="Crafts & Tailoring">Crafts & Tailoring</option>
              <option value="Gardening & Agriculture">Gardening & Agriculture</option>
              <option value="Consulting & Mentoring">Consulting & Mentoring</option>
              <option value="Home Maintenance">Home Repair & Help</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-large w-full md:w-auto mt-4 md:mt-0 ${
              highContrast ? 'bg-amber-400 text-black border-2 border-white' : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Extracting Skills with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Extract Skills & Build Profile</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Extraction Results */}
      {extractedData && (
        <div className="space-y-6">
          {publishMessage && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-900 font-bold flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>{publishMessage}</span>
            </div>
          )}

          {/* AI Mentor Tip Box */}
          <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 flex items-start gap-4">
            <Lightbulb className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-base uppercase tracking-wider text-amber-950">AI Mentor Advice:</h4>
              <p className="font-medium text-amber-900 mt-0.5">{extractedData.ai_mentor_tip}</p>
            </div>
          </div>

          {/* Bio Copy Card */}
          <div className={`card-senior p-6 border-2 ${
            highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-white border-slate-200'
          }`}>
            <h3 className="text-xl font-black text-slate-900 mb-2">Generated Profile Bio:</h3>
            <p className="text-slate-700 text-lg leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
              "{extractedData.generated_profile_bio}"
            </p>
          </div>

          {/* Extracted Skill Cards */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900">Extracted Structured Skill Listings</h3>
            {extractedData.skills.map((skill, index) => (
              <div
                key={index}
                className={`card-senior p-6 border-2 space-y-4 ${
                  highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-md">
                      {skill.category}
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 mt-2">{skill.title}</h4>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      {skill.years_experience} Years Experience • {skill.proficiency_level} Level
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block uppercase">Suggested Pricing</span>
                    <span className="text-3xl font-black text-amber-600">${skill.suggested_hourly_rate}<span className="text-sm text-slate-500">/hr</span></span>
                  </div>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {skill.key_highlights.map((h, i) => (
                    <span key={i} className="bg-slate-100 text-slate-800 text-xs font-extrabold px-3 py-1 rounded-full">
                      ✓ {h}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handlePublishService(skill)}
                    disabled={publishing}
                    className="btn-large bg-amber-500 text-white hover:bg-amber-600"
                  >
                    <Save className="w-5 h-5" />
                    <span>{publishing ? 'Publishing...' : 'Publish to Live Marketplace'}</span>
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
