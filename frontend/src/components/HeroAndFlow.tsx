import React from 'react'
import {
  Sparkles, ShieldCheck, ArrowRight, Wand2, UserCheck,
  TrendingUp, Star, Bot, Search, Award, DollarSign
} from 'lucide-react'
import { translations, type Language } from '../i18n/translations'

interface HeroAndFlowProps {
  highContrast: boolean
  language: Language
  onNavigateTab: (tabId: string) => void
  onOpenAuth: () => void
}

export const HeroAndFlow: React.FC<HeroAndFlowProps> = ({
  highContrast,
  language,
  onNavigateTab,
}) => {
  const t = translations[language]

  const steps = [
    {
      num: '01',
      title: t.step1Title,
      desc: t.step1Desc,
      icon: Wand2,
      tab: 'skill-builder'
    },
    {
      num: '02',
      title: t.step2Title,
      desc: t.step2Desc,
      icon: UserCheck,
      tab: 'dashboard'
    },
    {
      num: '03',
      title: t.step3Title,
      desc: t.step3Desc,
      icon: Search,
      tab: 'smart-match'
    },
    {
      num: '04',
      title: t.step4Title,
      desc: t.step4Desc,
      icon: TrendingUp,
      tab: 'marketplace'
    },
  ]

  const aiAgents = [
    {
      title: "1. Skill Identification Agent",
      endpoint: "/api/v1/ai/extract-skills",
      desc: "Parses plain natural language or voice to extract structured skills, years of experience, and fair ₹ INR hourly rates.",
      icon: Wand2,
      tab: "skill-builder"
    },
    {
      title: "2. Grounded Profile Builder",
      endpoint: "/api/v1/ai/profile-builder",
      desc: "Generates authentic headline & biography copy with 'AI-assisted — please verify before publishing' badge.",
      icon: Award,
      tab: "skill-builder"
    },
    {
      title: "3. 5-Factor Smart Matching",
      endpoint: "/api/v1/ai/smart-match",
      desc: "Deterministic 40-25-15-10-10 scoring engine with Gemini plain-language match rationale explanation.",
      icon: Search,
      tab: "smart-match"
    },
    {
      title: "4. Senior Mentor Bot ('SilverBot')",
      endpoint: "/api/v1/ai/assistant",
      desc: "Conversational business, safety, customer etiquette, and pricing mentor with STT + TTS audio playback.",
      icon: Bot,
      tab: "mentor-bot"
    },
    {
      title: "5. Micro-Business Guidance Plan",
      endpoint: "/api/v1/ai/business-guidance",
      desc: "Actionable 5-part plan for home tiffin, pickles, tutoring, tailoring, and terrace gardening in India.",
      icon: DollarSign,
      tab: "mentor-bot"
    }
  ]

  return (
    <div className="space-y-12 mb-8">
      {/* 1. Landing Hero (Deep Navy #0A0F24) */}
      <section className={`rounded-3xl p-8 md:p-12 relative overflow-hidden border shadow-xl ${
        highContrast
          ? 'bg-black text-white border-2 border-amber-400'
          : 'card-navy-hero text-white'
      }`}>
        <div className="max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-[#4099FF]/40 text-[#4099FF] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#4099FF]" />
            <span>{t.platformNotice}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
            {t.tagline}
          </h1>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed font-medium">
            Empowering Indian senior citizens and skilled homemakers to monetize decades of craftsmanship with dignity, verified neighborhood demand, and fair ₹ INR pricing.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('marketplace')}
              className="btn-large btn-indigo text-sm font-semibold shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>{t.heroCtaFind}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('skill-builder')}
              className="btn-large bg-white/10 hover:bg-white/20 text-white border border-slate-600 text-sm font-semibold cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#4099FF]" />
              <span>{t.heroCtaOffer}</span>
            </button>
          </div>

          {/* Real Live Database Metric Highlights */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-300">
            <div>
              <span className="block text-xl font-black text-white">7+</span>
              <span className="text-slate-400">Verified Senior Craftsmen</span>
            </div>
            <div>
              <span className="block text-xl font-black text-[#4099FF]">8</span>
              <span className="text-slate-400">Active Service Offerings</span>
            </div>
            <div>
              <span className="block text-xl font-black text-amber-400 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" /> 5.0★
              </span>
              <span className="text-slate-400">Customer Rating</span>
            </div>
            <div>
              <span className="block text-xl font-black text-emerald-400">₹0</span>
              <span className="text-slate-400">Platform Commission</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works Flow (Light Neutral Canvas #F7F9FC) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#4B32E6]">Lifecycle Architecture</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">{t.howItWorks}</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-600 max-w-md">
            Seamless end-to-end spine taking seniors from plain-language skill extraction to verified neighborhood earnings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={idx}
                onClick={() => onNavigateTab(step.tab)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
                  highContrast
                    ? 'bg-black border-2 border-amber-400 text-white'
                    : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4B32E6] flex items-center justify-center font-bold group-hover:bg-[#4B32E6] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-slate-400 group-hover:text-[#4099FF] transition-colors">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Enterprise AI Architecture Showcase (Navy Surface #0D1127) */}
      <section className={`rounded-3xl p-8 md:p-10 border shadow-lg ${
        highContrast
          ? 'bg-black text-white border-2 border-amber-400'
          : 'bg-[#0D1127] text-white border-slate-800'
      }`}>
        <div className="max-w-3xl mb-8 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4099FF]">
            <Sparkles className="w-4 h-4 text-[#4099FF]" />
            <span>Google GenAI Powered</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">{t.aiShowcaseTitle}</h2>
          <p className="text-sm text-slate-300">{t.aiShowcaseSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiAgents.map((agent, aIdx) => {
            const Icon = agent.icon
            return (
              <div
                key={aIdx}
                onClick={() => onNavigateTab(agent.tab)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                  highContrast
                    ? 'bg-zinc-950 border-amber-400 text-white'
                    : 'bg-[#131838]/80 border-slate-800 text-white hover:border-[#4099FF]/50 hover:bg-[#131838]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-[#4099FF]/30 text-[#4099FF] flex items-center justify-center font-bold">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-[#4099FF] transition-colors">{agent.endpoint}</span>
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">{agent.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{agent.desc}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
