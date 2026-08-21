import React from 'react'
import {
  HeartHandshake, ShieldCheck, Store, Search, Wand2,
  Bot, LayoutDashboard, Type, Eye, LogIn, LogOut, Globe,
  TrendingUp, Compass, Bell
} from 'lucide-react'
import type { User } from '../types'
import { api } from '../services/api'
import { translations, type Language } from '../i18n/translations'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  fontSize: 'normal' | 'large' | 'xlarge'
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void
  highContrast: boolean
  setHighContrast: (hc: boolean) => void
  language: Language
  setLanguage: (lang: Language) => void
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  onOpenAuth: () => void
  onOpenNotifications?: () => void
  unreadNotificationsCount?: number
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  fontSize,
  setFontSize,
  highContrast,
  setHighContrast,
  language,
  setLanguage,
  currentUser,
  setCurrentUser,
  onOpenAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0
}) => {
  const t = translations[language]

  const tabs = [
    { id: 'marketplace', label: t.navMarketplace, icon: Store },
    { id: 'map', label: t.navMap || 'Live Map', icon: Compass },
    { id: 'family', label: t.navFamilyCircle || 'Family Circle', icon: HeartHandshake },
    { id: 'opportunities', label: t.navOpportunities, icon: TrendingUp },
    { id: 'smart-match', label: t.navSmartMatch, icon: Search },
    { id: 'skill-builder', label: t.navSkillBuilder, icon: Wand2 },
    { id: 'mentor-bot', label: t.navMentorBot, icon: Bot },
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
  ]


  const handleFontSizeChange = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size)
    localStorage.setItem('silverhands_font_size', size)
    const sizeMap = { normal: '16px', large: '19px', xlarge: '22px' }
    document.documentElement.style.fontSize = sizeMap[size]
    document.documentElement.style.setProperty('--font-size-base', sizeMap[size])
  }

  const handleLogout = async () => {
    await api.logout()
    setCurrentUser(null)
    setActiveTab('marketplace')
  }

  const defaultAvatar = "/avatars/seed/lakshmi_amma.jpg"

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-200 ${
      highContrast 
        ? 'bg-black text-amber-300 border-b-4 border-amber-400' 
        : 'bg-[#0A0F24] text-white border-b border-slate-800 shadow-md'
    }`}>
      {/* Top Accessibility & System Status Bar */}
      <div className={`px-4 md:px-8 py-1.5 flex flex-wrap items-center justify-between text-xs font-medium ${
        highContrast ? 'bg-amber-400 text-black font-bold' : 'bg-[#060A19] text-slate-300 border-b border-slate-900'
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-4 h-4 ${highContrast ? 'text-black' : 'text-[#4099FF]'}`} />
          <span>{t.platformNotice}</span>
        </div>

        {/* Accessibility Tools (A / A+ / A++), High Contrast, and 3-Language Toggle */}
        <div className="flex items-center gap-3">
          {/* Language Switcher (EN / TA / HI) */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
            highContrast ? 'border-black bg-white/20' : 'bg-slate-900/90 border-slate-700'
          }`}>
            <Globe className="w-3.5 h-3.5 text-[#4099FF]" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded font-semibold cursor-pointer text-xs transition-all ${
                language === 'en' ? 'bg-[#4B32E6] text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-1.5 py-0.5 rounded font-semibold cursor-pointer text-xs transition-all ${
                language === 'ta' ? 'bg-[#4B32E6] text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded font-semibold cursor-pointer text-xs transition-all ${
                language === 'hi' ? 'bg-[#4B32E6] text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Font Size Scaling */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
            highContrast ? 'border-black bg-white/20' : 'bg-slate-900/90 border-slate-700'
          }`}>
            <Type className="w-3.5 h-3.5 text-[#4099FF] mr-0.5" />
            <span className="text-slate-300 text-xs mr-0.5">{t.textScale}</span>
            <button
              onClick={() => handleFontSizeChange('normal')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer text-xs ${
                fontSize === 'normal' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Standard Font (16px)"
            >
              A
            </button>
            <button
              onClick={() => handleFontSizeChange('large')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer text-xs ${
                fontSize === 'large' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Large Font (19px)"
            >
              A+
            </button>
            <button
              onClick={() => handleFontSizeChange('xlarge')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer text-xs ${
                fontSize === 'xlarge' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Extra Large Font (22px)"
            >
              A++
            </button>
          </div>

          {/* High Contrast Mode */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              highContrast 
                ? 'bg-black text-amber-300 border border-amber-300' 
                : 'bg-slate-850 text-slate-200 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{highContrast ? t.standardMode : t.highContrast}</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('marketplace')}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-105 ${
            highContrast ? 'bg-amber-400 text-black border-2 border-white' : 'bg-gradient-to-tr from-[#4B32E6] to-[#4099FF] text-white'
          }`}>
            <HeartHandshake className="w-6 h-6 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">SilverHands</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                highContrast ? 'bg-amber-300 text-black' : 'bg-blue-950 text-[#4099FF] border border-[#4099FF]/40'
              }`}>
                v3.2 • Enterprise
              </span>
            </div>
            <p className={`text-xs ${highContrast ? 'text-amber-200' : 'text-slate-300'}`}>
              {t.tagline}
            </p>
          </div>
        </div>

        {/* User Auth Status / Profile, Notifications & Logout Button */}
        <div className="flex items-center gap-3">
          {/* Quiet Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
              highContrast
                ? 'bg-zinc-900 border-amber-400 text-amber-300 hover:bg-zinc-800'
                : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
            title={t.notifications || 'Insights & Nudges'}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`btn-large ${
                  highContrast 
                    ? 'bg-amber-400 text-black border-2 border-white' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700'
                }`}
              >
                <img
                  src={currentUser.avatar_url || defaultAvatar}
                  alt={currentUser.full_name}
                  className="w-6 h-6 rounded-full object-cover border border-[#4099FF]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultAvatar
                  }}
                />
                <span className="font-bold text-xs md:text-sm">{currentUser.full_name}</span>
                <span className="text-[10px] bg-blue-950 text-[#4099FF] px-2 py-0.5 rounded border border-[#4099FF]/30 capitalize">
                  {currentUser.user_type || currentUser.role}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 bg-rose-950/40 text-rose-300 border border-rose-800 rounded-lg hover:bg-rose-900/60 transition-all cursor-pointer"
                title={t.signOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className={`btn-large btn-indigo text-xs md:text-sm ${
                highContrast ? 'bg-amber-400 text-black font-bold' : ''
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{t.signIn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <nav className={`border-t ${highContrast ? 'border-amber-400 bg-zinc-950' : 'border-slate-800/80 bg-[#060A19]'}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center md:justify-start overflow-x-auto gap-1.5 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? highContrast
                      ? 'bg-amber-400 text-black font-bold border-2 border-white'
                      : 'bg-[#4B32E6] text-white shadow-sm font-semibold'
                    : highContrast
                      ? 'text-amber-200 hover:bg-zinc-800'
                      : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#4099FF]'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
