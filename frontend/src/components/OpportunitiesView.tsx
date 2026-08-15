import React, { useState, useEffect } from 'react'
import {
  TrendingUp, MapPin, Clock, CheckCircle2,
  AlertCircle, Sparkles, Check
} from 'lucide-react'
import type { OpportunityItem, User } from '../types'
import { api } from '../services/api'
import { translations, type Language } from '../i18n/translations'

interface OpportunitiesViewProps {
  highContrast: boolean
  currentUser: User | null
  language?: Language
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  highContrast,
  currentUser,
  language = 'en'
}) => {
  const t = translations[language]

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [applyingOppId, setApplyingOppId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const providerId = currentUser?.id || 1

  const loadOpportunities = async () => {
    setLoading(true)
    try {
      const data = await api.getProviderOpportunities(providerId)
      setOpportunities(data.opportunities || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load recommended opportunities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOpportunities()
  }, [providerId])

  const handleExpressInterest = async (oppId: string) => {
    setApplyingOppId(oppId)
    setStatusMessage(null)
    try {
      const res = await api.expressInterest(providerId, oppId)
      setStatusMessage(res.message || 'Interest sent successfully!')
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, is_applied: true } : o))
      )
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setApplyingOppId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 md:p-8 rounded-2xl border shadow-sm ${
        highContrast 
          ? 'bg-black border-2 border-amber-400 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#4B32E6] text-white flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#4B32E6] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
            Neighborhood Demand Feed
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-1.5">{t.navOpportunities}</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl font-medium">
          Live customer requests matched specifically to your lifelong skills, local neighborhood proximity, and fair ₹ INR hourly budget.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-3 border-[#4B32E6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600">Matching nearby customer opportunities...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Unable to load opportunities</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && opportunities.length === 0 && (
        <div className="p-10 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="font-bold text-sm text-slate-800">No matching neighborhood requests right now.</p>
          <p className="text-xs mt-1 text-slate-500">Check back soon as new requests are posted daily!</p>
        </div>
      )}

      {!loading && !error && opportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className={`p-5 rounded-xl flex flex-col justify-between border shadow-sm transition-all duration-200 ${
                highContrast
                  ? 'bg-black border-2 border-amber-400 text-white'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="inline-block bg-blue-50 text-[#4B32E6] text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-blue-100 mb-1">
                      {opp.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{opp.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Match</span>
                    <span className="text-base font-black text-[#4B32E6]">{opp.match_score}%</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">{opp.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{opp.customer_location} • {opp.distance_km} km</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{opp.posted_ago || 'Recent'}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(opp.match_reasons || [`✓ Within ${opp.distance_km} km`, `✓ Matches verified skills`]).map((reason, rIdx) => (
                    <span key={rIdx} className="bg-slate-50 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Budget</span>
                  <span className="text-base font-black text-slate-900">{opp.budget_range}</span>
                </div>

                {opp.is_applied ? (
                  <button
                    disabled
                    className="btn-large bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-1.5 px-3.5 font-bold cursor-not-allowed flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.interestSent}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleExpressInterest(opp.id)}
                    disabled={applyingOppId === opp.id}
                    className="btn-large btn-indigo text-xs py-1.5 px-3.5 font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    {applyingOppId === opp.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#4099FF]" />
                        <span>{t.expressInterest}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
