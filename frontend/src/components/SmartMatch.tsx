import React, { useState } from 'react'
import { Search, Sparkles, Award, ArrowRight, ShieldCheck } from 'lucide-react'
import type { MatchProviderResult } from '../types'
import { api } from '../services/api'
import { formatINR } from '../utils/formatters'
import { translations, type Language } from '../i18n/translations'

interface SmartMatchProps {
  highContrast: boolean
  onSelectServiceToBook: (serviceId: number) => void
  language?: Language
}

export const SmartMatch: React.FC<SmartMatchProps> = ({ highContrast, onSelectServiceToBook, language = 'en' }) => {
  const t = translations[language]

  const initialQuery = language === 'ta'
    ? 'சென்னையில் மாடித்தோட்டம் அமைக்க வழிகாட்டும் மூத்தோர் தேவை'
    : 'Need patient South Indian home tiffin cooking teacher for weekend family session in Mumbai'

  const [query, setQuery] = useState<string>(initialQuery)
  const [maxDistance, setMaxDistance] = useState<number>(25)
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<MatchProviderResult[]>([])
  const [searched, setSearched] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const defaultAvatar = "/avatars/seed/lakshmi_amma.jpg"

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.runSmartMatch(query, undefined, maxDistance)
      setResults(res.top_matches)
      setSearched(true)
    } catch (err: any) {
      setError(err.message || 'Smart matching failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className={`p-6 md:p-8 rounded-2xl border shadow-sm ${
        highContrast 
          ? 'bg-black border-2 border-amber-400 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            {t.navSmartMatch}
          </span>
        </div>
        <h2 className="text-2xl font-black mb-1.5">{t.navSmartMatch}</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl font-medium">
          Describe what service or guidance you need. Our engine scores senior providers using a deterministic 5-factor weighted formula (Skill 40%, Distance 25%, Rating 15%, Experience 10%, Reliability 10%) and Gemini AI generates plain-language match reasons.
        </p>
      </div>

      {/* Query Input Card */}
      <form onSubmit={handleRunMatch} className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
        highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-800">What service or learning guidance do you need?</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Looking for someone to teach home cooking in Dadar area..."
              className="w-full p-3.5 pl-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 uppercase">Maximum Distance Radius</span>
              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-large w-full ${
              highContrast 
                ? 'bg-amber-400 text-black border-2 border-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t.aiThinking}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Find Best Matches</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Match Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black">
              Top Ranked Matches ({results.length})
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              Deterministic 5-Factor Scoring Active
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-base font-bold text-slate-700">No senior providers found within {maxDistance}km.</p>
              <p className="text-xs mt-1">Try expanding your distance radius or search query.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((match, idx) => (
                <div
                  key={match.service_id}
                  className={`border rounded-2xl transition-all p-5 relative shadow-sm ${
                    highContrast
                      ? 'bg-black border-2 border-amber-400 text-white'
                      : idx === 0 
                        ? 'bg-white border-blue-400 ring-2 ring-blue-100' 
                        : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {idx === 0 && (
                    <span className="absolute -top-3 left-6 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Award className="w-3 h-3" /> #1 Best Match
                    </span>
                  )}

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
                    {/* Left Profile details */}
                    <div className="flex items-start gap-3.5 flex-1">
                      <img
                        src={match.provider_avatar || defaultAvatar}
                        alt={match.provider_name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultAvatar
                        }}
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold">{match.provider_name}</h4>
                          <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{match.provider_user_type || 'Verified Senior'}</span>
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">{match.service_title} • <strong className="text-slate-900">{formatINR(match.price_per_hour)}/hr</strong></p>
                        
                        {/* Explicit Plain-Language Reason Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {(match.match_reasons || [`✓ Within ${match.distance_km} km`, `✓ ${match.years_experience}+ Yrs Exp`, `✓ ${match.rating}★ Rating`]).map((reason: string, rIdx: number) => (
                            <span key={rIdx} className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Score Badge & Action */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      <div className="text-center bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">{t.matchScore}</span>
                        <span className="text-xl font-black text-blue-600">{match.match_score}<span className="text-[11px] text-slate-400 font-normal">/100</span></span>
                      </div>

                      <button
                        onClick={() => onSelectServiceToBook(match.service_id)}
                        className="btn-large bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3.5 shadow-sm"
                      >
                        <span>{t.requestService}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 5-Factor Scoring Breakdown Bars */}
                  {match.breakdown && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Skill (40%)</span>
                        <span className="font-bold text-slate-800">{match.breakdown.skill_score} / 40</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Distance (25%)</span>
                        <span className="font-bold text-slate-800">{match.breakdown.proximity_score} / 25</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Rating (15%)</span>
                        <span className="font-bold text-slate-800">{match.breakdown.rating_score} / 15</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Experience (10%)</span>
                        <span className="font-bold text-slate-800">{match.breakdown.exp_score} / 10</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Reliability (10%)</span>
                        <span className="font-bold text-slate-800">{match.breakdown.reliability_score} / 10</span>
                      </div>
                    </div>
                  )}

                  {/* AI Generated Recommendation Explanation Box */}
                  <div className="mt-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-slate-700 text-xs leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wider mb-0.5">AI Match Explanation:</span>
                      <p className="font-medium italic">"{match.ai_reasoning}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
