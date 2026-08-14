import React, { useState } from 'react'
import { Search, Sparkles, MapPin, Star, Award, ArrowRight, ShieldCheck } from 'lucide-react'
import type { MatchProviderResult } from '../types'
import { api } from '../services/api'

interface SmartMatchProps {
  highContrast: boolean
  onSelectServiceToBook: (serviceId: number) => void
}

export const SmartMatch: React.FC<SmartMatchProps> = ({ highContrast, onSelectServiceToBook }) => {
  const [query, setQuery] = useState<string>('Need patient traditional sourdough baking teacher for weekend family session')
  const [maxDistance, setMaxDistance] = useState<number>(25)
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<MatchProviderResult[]>([])
  const [searched, setSearched] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="space-y-8">
      {/* Header Description */}
      <div className={`card-senior p-8 rounded-3xl border-2 ${
        highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white border-slate-700'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">AI & Deterministic Dual Engine</span>
        </div>
        <h2 className="text-3xl font-black mb-3">Smart Matching & Recommendation Explainer</h2>
        <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">
          Describe what help or learning experience you are looking for. Our engine scores senior providers using a 5-factor weighted algorithm (Skill 40%, Distance 25%, Rating 15%, Experience 10%, Reliability 10%) and Gemini AI generates humanized match reasons.
        </p>
      </div>

      {/* Query Input Card */}
      <form onSubmit={handleRunMatch} className={`card-senior p-6 space-y-6 border-2 ${
        highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-2">
          <label className="block text-lg font-black text-slate-900">What service or learning guidance do you need?</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Looking for someone to teach home cooking in Downtown area..."
              className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-300 text-lg font-medium focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20"
            />
            <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">Maximum Distance Radius</label>
              <span className="text-sm font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className={`btn-large w-full ${
                highContrast ? 'bg-amber-400 text-black border-2 border-white' : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Scoring Top Matches...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Find Best Senior Matches</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold">
          {error}
        </div>
      )}

      {/* Match Results */}
      {searched && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900">
              Top Ranked Senior Providers ({results.length})
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
              Weighted Match Scoring Active
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border-2 border-dashed border-slate-300">
              <p className="text-xl font-bold">No senior providers found within {maxDistance}km.</p>
              <p className="text-sm mt-1">Try expanding your distance radius or search query.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((match, idx) => (
                <div
                  key={match.service_id}
                  className={`card-senior border-2 transition-all p-6 relative ${
                    highContrast
                      ? 'bg-zinc-900 border-amber-400 text-white'
                      : idx === 0 ? 'bg-gradient-to-r from-amber-50/80 via-white to-white border-amber-400 shadow-md ring-2 ring-amber-400/50' : 'bg-white border-slate-200'
                  }`}
                >
                  {idx === 0 && (
                    <span className="absolute -top-3.5 left-6 bg-amber-500 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Award className="w-4 h-4" /> #1 Top Match Recommendation
                    </span>
                  )}

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
                    {/* Left Profile details */}
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={match.provider_avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                        alt={match.provider_name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xl font-black text-slate-900">{match.provider_name}</h4>
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-sm font-bold text-amber-800">{match.service_title}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" /> {match.location_name} ({match.distance_km} km away)
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {match.rating}★ Rating
                          </span>
                          <span>•</span>
                          <span>{match.years_experience} Yrs Experience</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Score Badge & Action */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-center bg-amber-100 border border-amber-300 px-4 py-2 rounded-2xl">
                        <span className="text-xs font-bold text-amber-800 uppercase block">Match Score</span>
                        <span className="text-2xl font-black text-amber-900">{match.match_score}<span className="text-sm">/100</span></span>
                      </div>

                      <button
                        onClick={() => onSelectServiceToBook(match.service_id)}
                        className="btn-large bg-slate-900 text-amber-400 hover:bg-slate-800"
                      >
                        <span>Book Match</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* AI Generated Recommendation Explanation Box */}
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm leading-relaxed flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs uppercase tracking-wider mb-0.5">AI Recommendation Reason:</span>
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
