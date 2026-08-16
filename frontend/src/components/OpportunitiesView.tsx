import React, { useState, useEffect } from 'react'
import {
  TrendingUp, MapPin, Clock, CheckCircle2,
  AlertCircle, Sparkles, Check, Radio, Award,
  ArrowRight, Filter
} from 'lucide-react'
import type { OpportunityItem, User, DemandRadarItem, ReadinessResponse } from '../types'
import { api } from '../services/api'
import { translations, type Language } from '../i18n/translations'

interface OpportunitiesViewProps {
  highContrast: boolean
  currentUser: User | null
  language?: Language
  onNavigateToProfile?: () => void
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  highContrast,
  currentUser,
  language = 'en',
  onNavigateToProfile
}) => {
  const t = translations[language]

  const [activeTab, setActiveTab] = useState<'feed' | 'radar' | 'readiness' | 'my_opps'>('feed')
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])
  const [radarItems, setRadarItems] = useState<DemandRadarItem[]>([])
  const [readinessData, setReadinessData] = useState<ReadinessResponse | null>(null)
  const [myOpps, setMyOpps] = useState<any[]>([])
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedCity, setSelectedCity] = useState<string>('All')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [applyingOppId, setApplyingOppId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const providerId = currentUser?.id || 1

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Opportunities Feed
      const feedData = await api.getProviderOpportunities(providerId, selectedCategory)
      setOpportunities(feedData.opportunities || [])

      // 2. Demand Radar
      const radarData = await api.getDemandRadar(
        selectedCity !== 'All' ? selectedCity : undefined,
        selectedCategory !== 'All' ? selectedCategory : undefined
      )
      setRadarItems(radarData.radar_items || [])

      // 3. Readiness / Improvement Engine
      const readiness = await api.getReadiness(providerId)
      setReadinessData(readiness)

      // 4. My Tracked Opportunities
      const tracked = await api.getMyOpportunities(providerId)
      setMyOpps(tracked.my_opportunities || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunity data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [providerId, selectedCategory, selectedCity])

  const handleExpressInterest = async (oppId: string) => {
    setApplyingOppId(oppId)
    setStatusMessage(null)
    try {
      const res = await api.expressInterest(providerId, oppId)
      setStatusMessage(res.message || 'Interest sent successfully!')
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, is_applied: true } : o))
      )
      // Refresh tracked opportunities
      const tracked = await api.getMyOpportunities(providerId)
      setMyOpps(tracked.my_opportunities || [])
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      setStatusMessage(`Notice: ${err.message}`)
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#4B32E6] text-white flex items-center justify-center font-bold shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#4B32E6] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              Opportunity Engine v6.0
            </span>
          </div>

          {readinessData && (
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700">Profile Readiness:</span>
              <span className="text-xs font-black text-[#4B32E6]">{readinessData.readiness_percentage}%</span>
            </div>
          )}
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-1.5">{t.navOpportunities}</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl font-medium">
          Deterministic 6-factor smart matching connecting lifelong skills with local neighborhood demand in Indian cities.
        </p>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-5 mt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-[#4B32E6] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Recommended For You ({opportunities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'radar'
                ? 'bg-[#4B32E6] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Local Demand Radar ({radarItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('readiness')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'readiness'
                ? 'bg-[#4B32E6] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Improve My Opportunities</span>
          </button>

          <button
            onClick={() => setActiveTab('my_opps')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'my_opps'
                ? 'bg-[#4B32E6] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>My Applications ({myOpps.length})</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs md:text-sm font-bold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading && (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-10 h-10 border-4 border-[#4B32E6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-600">Matching nearby opportunities across verified categories...</p>
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

      {/* TAB 1: RECOMMENDED FOR YOU (OPPORTUNITY FEED) */}
      {!loading && !error && activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B32E6]"
              >
                <option value="All">All Categories</option>
                <option value="Cooking & Tiffin">Cooking & Tiffin</option>
                <option value="Tutoring & Mentoring">Tutoring & Mentoring</option>
                <option value="Crafts & Tailoring">Crafts & Tailoring</option>
                <option value="Gardening & Agriculture">Gardening & Agriculture</option>
                <option value="Consulting & Life Mentoring">Consulting & Mentoring</option>
              </select>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Showing {opportunities.length} matched requests sorted by match %
            </span>
          </div>

          {opportunities.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="font-bold text-base text-slate-800">No matching requests in this category right now.</p>
              <p className="text-xs mt-1 text-slate-500">Check back soon or select "All Categories" to view city-wide requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className={`p-6 rounded-2xl flex flex-col justify-between border shadow-sm transition-all duration-200 ${
                    highContrast
                      ? 'bg-black border-2 border-amber-400 text-white'
                      : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="inline-block bg-blue-50 text-[#4B32E6] text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md border border-blue-100 mb-1.5">
                          {opp.category}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 leading-snug">{opp.title}</h3>
                      </div>
                      <div className="text-right shrink-0 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-100">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Match Score</span>
                        <span className="text-lg font-black text-[#4B32E6]">{opp.match_score}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3.5 font-medium">{opp.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mb-3.5">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opp.customer_location} • {opp.distance_km} km</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opp.posted_ago || 'Recent'}</span>
                      </span>
                    </div>

                    {/* Transparent Checklist Reasons */}
                    <div className="space-y-1 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Scoring Rationale</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(opp.match_reasons || []).map((reason, rIdx) => (
                          <span key={rIdx} className="bg-white text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Client Budget</span>
                      <span className="text-base font-black text-slate-900">{opp.budget_range}</span>
                    </div>

                    {opp.is_applied ? (
                      <button
                        disabled
                        className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs md:text-sm py-2 px-4 rounded-xl font-bold cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>✓ Interest Sent</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleExpressInterest(opp.id)}
                        disabled={applyingOppId === opp.id}
                        className="bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-xs md:text-sm py-2 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {applyingOppId === opp.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Express Interest</span>
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
      )}

      {/* TAB 2: LOCAL DEMAND RADAR */}
      {!loading && !error && activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#4B32E6] animate-pulse" />
                <span>Live Neighborhood Demand Radar</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Aggregating customer inquiries, search volume, and average hourly pricing in ₹ INR across Indian localities.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">City:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B32E6]"
              >
                <option value="All">All Cities</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Chennai">Chennai</option>
                <option value="Bengaluru">Bengaluru</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {radarItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#4B32E6] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500">{item.location}</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      item.demand_level === 'High' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.demand_level} Demand
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 mb-1">{item.category}</h4>
                  
                  <div className="flex items-center gap-2 my-2">
                    <span className="text-2xl font-black text-[#4B32E6]">{item.active_requests_count}</span>
                    <span className="text-xs font-semibold text-slate-500">Active Requests this week</span>
                  </div>

                  <div className="text-xs font-semibold text-emerald-600 mb-3 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{item.growth_trend}</span>
                  </div>

                  <div className="space-y-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Top Customer Needs</span>
                    <div className="flex flex-wrap gap-1">
                      {item.top_requested_skills.map((skill, sIdx) => (
                        <span key={sIdx} className="bg-white text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Avg Pricing</span>
                    <span className="font-black text-slate-900">₹{item.average_hourly_rate}/hr</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {item.is_remote_friendly ? '🌐 Remote / Home' : '📍 Home Visits'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: IMPROVE MY OPPORTUNITIES (READINESS ENGINE) */}
      {!loading && !error && activeTab === 'readiness' && readinessData && (
        <div className="space-y-5">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold text-[#4B32E6] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                  Opportunity Readiness Score
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                  How Complete is Your Profile?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete each concrete action to boost your visibility to neighborhood clients.
                </p>
              </div>

              <div className="text-center bg-blue-50/80 px-6 py-3 rounded-2xl border border-blue-100">
                <span className="text-3xl font-black text-[#4B32E6]">{readinessData.readiness_percentage}%</span>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Overall Readiness</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="bg-[#4B32E6] h-3 rounded-full transition-all duration-500"
                style={{ width: `${readinessData.readiness_percentage}%` }}
              ></div>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-slate-700 text-xs font-medium leading-relaxed">
              💡 <span className="font-bold text-slate-900">Advice:</span> {readinessData.improvement_advice}
            </div>
          </div>

          {/* Checklist Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readinessData.checklist.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border shadow-sm flex items-start justify-between gap-4 ${
                  item.completed
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0"></div>
                    )}
                    <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      +{item.points} pts
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium pl-7">{item.description}</p>
                </div>

                <div className="shrink-0 pt-1">
                  {item.completed ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                      ✓ Added
                    </span>
                  ) : (
                    <button
                      onClick={onNavigateToProfile}
                      className="text-xs font-bold text-[#4B32E6] hover:text-[#3D26D1] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.action_label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-center font-medium">
            {readinessData.disclaimer}
          </div>
        </div>
      )}

      {/* TAB 4: MY TRACKED OPPORTUNITIES */}
      {!loading && !error && activeTab === 'my_opps' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Tracked Opportunities ({myOpps.length})</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Real-time status updates</span>
          </div>

          {myOpps.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="font-bold text-base text-slate-800">You haven't expressed interest in any opportunities yet.</p>
              <p className="text-xs mt-1 text-slate-500">Go to "Recommended For You" and click Express Interest to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myOpps.map((opp) => (
                <div key={opp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#4B32E6] px-2 py-0.5 rounded border border-blue-100">
                        {opp.category}
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1">{opp.title}</h4>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {opp.interest_status === 'accepted' ? '✓ Accepted' : '✓ Interest Sent'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{opp.description}</p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>{opp.customer_location}</span>
                    <span className="text-slate-900">{opp.budget_range}</span>
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
