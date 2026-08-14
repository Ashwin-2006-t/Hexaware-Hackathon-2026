import React from 'react'
import {
  HeartHandshake, ShieldCheck, Store, Search, Wand2,
  Bot, LayoutDashboard, Type, Eye, LogIn
} from 'lucide-react'
import type { User } from '../types'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  fontSize: 'normal' | 'large' | 'xlarge'
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void
  highContrast: boolean
  setHighContrast: (hc: boolean) => void
  currentUser: User | null
  onOpenAuth: () => void
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  fontSize,
  setFontSize,
  highContrast,
  setHighContrast,
  currentUser,
  onOpenAuth
}) => {
  const tabs = [
    { id: 'marketplace', label: 'Services Marketplace', icon: Store },
    { id: 'smart-match', label: 'AI Smart Match', icon: Search },
    { id: 'skill-builder', label: 'AI Skill Builder', icon: Wand2 },
    { id: 'mentor-bot', label: 'Senior Mentor Chat', icon: Bot },
    { id: 'dashboard', label: 'My Bookings & Profile', icon: LayoutDashboard },
  ]

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-200 ${
      highContrast 
        ? 'bg-black text-amber-300 border-b-4 border-amber-400' 
        : 'bg-white/95 backdrop-blur-md text-slate-900 border-b-2 border-amber-200/60 shadow-xs'
    }`}>
      {/* Top Accessibility & System Status Bar */}
      <div className={`px-6 py-2 flex flex-wrap items-center justify-between text-xs font-semibold ${
        highContrast ? 'bg-amber-400 text-black' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Senior-Friendly Design & Verification System Enabled</span>
        </div>

        {/* Accessibility Tools */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full">
            <Type className="w-3.5 h-3.5" />
            <span className="mr-1">Text Size:</span>
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded font-extrabold ${fontSize === 'normal' ? 'bg-white text-black' : 'opacity-80 hover:opacity-100'}`}
              title="Normal Text Size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded font-extrabold text-sm ${fontSize === 'large' ? 'bg-white text-black' : 'opacity-80 hover:opacity-100'}`}
              title="Large Text Size"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-0.5 rounded font-extrabold text-base ${fontSize === 'xlarge' ? 'bg-white text-black' : 'opacity-80 hover:opacity-100'}`}
              title="Extra Large Text Size"
            >
              A++
            </button>
          </div>

          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all ${
              highContrast ? 'bg-white text-black' : 'bg-slate-900 text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{highContrast ? 'Standard Mode' : 'High Contrast'}</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('marketplace')}>
          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-md transition-transform hover:scale-105 ${
            highContrast ? 'bg-amber-400 text-black border-2 border-white' : 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white'
          }`}>
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight font-sans">SilverHands</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase ${
                highContrast ? 'bg-amber-300 text-black' : 'bg-amber-100 text-amber-900'
              }`}>
                v0.2.0 AI
              </span>
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest ${
              highContrast ? 'text-amber-300' : 'text-amber-800'
            }`}>
              Digital Livelihoods for Seniors
            </p>
          </div>
        </div>

        {/* User Auth Status / Profile Button */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <button
              onClick={onOpenAuth}
              className={`btn-large ${
                highContrast ? 'bg-amber-400 text-black border-2 border-white' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'}
                alt={currentUser.full_name}
                className="w-7 h-7 rounded-full object-cover border border-amber-400"
              />
              <span>{currentUser.full_name}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className={`btn-large ${
                highContrast ? 'bg-amber-400 text-black' : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <nav className={`border-t ${highContrast ? 'border-amber-400 bg-zinc-900' : 'border-slate-200/80 bg-slate-50/80'}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center overflow-x-auto gap-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-xl font-extrabold text-base transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? highContrast
                      ? 'bg-amber-400 text-black shadow-lg scale-105 border-2 border-white'
                      : 'bg-slate-900 text-amber-400 shadow-md scale-102 ring-2 ring-amber-500/50'
                    : highContrast
                      ? 'text-amber-200 hover:bg-zinc-800'
                      : 'text-slate-700 hover:bg-amber-100/60 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? (highContrast ? 'text-black' : 'text-amber-400') : 'text-amber-600'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
