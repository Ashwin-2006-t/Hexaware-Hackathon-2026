import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { HeroAndFlow } from './components/HeroAndFlow'
import { Marketplace } from './components/Marketplace'
import { MapView } from './components/MapView'
import { NotificationCenter } from './components/NotificationCenter'
import { OpportunitiesView } from './components/OpportunitiesView'
import { SmartMatch } from './components/SmartMatch'
import { SkillExtractor } from './components/SkillExtractor'
import { SeniorMentorBot } from './components/SeniorMentorBot'
import { Dashboard } from './components/Dashboard'
import { AuthModal } from './components/AuthModal'
import type { User } from './types'
import { api } from './services/api'
import { Activity, Database, Sparkles, HeartHandshake, Shield, HelpCircle } from 'lucide-react'
import type { Language } from './i18n/translations'

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('marketplace')
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [highContrast, setHighContrast] = useState<boolean>(false)
  const [language, setLanguage] = useState<Language>('en')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const [showNotifications, setShowNotifications] = useState<boolean>(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0)

  // System status state
  const [backendOnline, setBackendOnline] = useState<boolean>(false)
  const [seeding, setSeeding] = useState<boolean>(false)
  const [seedNotice, setSeedNotice] = useState<string | null>(null)

  const checkNotifications = async (user?: User | null) => {
    try {
      const notifs = await api.getNotifications(user?.id)
      setUnreadNotifCount(notifs.filter(n => !n.read).length)
    } catch {
      // quiet fallback
    }
  }

  const checkBackend = async () => {
    try {
      const data = await api.getHealth()
      setBackendOnline(data.status === 'online')

      // Load user profile from stored token / backend
      const me = await api.getMe()
      setCurrentUser(me)
      checkNotifications(me)
    } catch {
      setBackendOnline(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await api.seedDatabase()
      setSeedNotice(res.message)
      setTimeout(() => setSeedNotice(null), 3500)
      const me = await api.getMe()
      setCurrentUser(me)
      setActiveTab('marketplace')
    } catch (err: any) {
      alert(`Seed Error: ${err.message}`)
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    // Restore persisted accessibility text size choice from localStorage
    const savedFontSize = localStorage.getItem('silverhands_font_size') as 'normal' | 'large' | 'xlarge'
    if (savedFontSize && ['normal', 'large', 'xlarge'].includes(savedFontSize)) {
      setFontSize(savedFontSize)
      const sizeMap = { normal: '16px', large: '19px', xlarge: '22px' }
      document.documentElement.style.fontSize = sizeMap[savedFontSize]
      document.documentElement.style.setProperty('--font-size-base', sizeMap[savedFontSize])
    }

    const savedLanguage = localStorage.getItem('silverhands_language') as Language
    if (savedLanguage && ['en', 'ta', 'hi'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }

    checkBackend()
  }, [])

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }, [highContrast])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('silverhands_language', lang)
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      highContrast 
        ? 'bg-black text-white' 
        : 'bg-[#F7F9FC] text-slate-900'
    }`}>
      {/* Navigation Header (Deep Navy #0A0F24) */}
      {/* Navigation Header (Deep Navy #0A0F24) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fontSize={fontSize}
        setFontSize={setFontSize}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        language={language}
        setLanguage={handleSetLanguage}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        unreadNotificationsCount={unreadNotifCount}
      />

      {/* Backend & Real Gemini Engine Status Toolbar */}
      <div className={`border-b px-4 md:px-8 py-1.5 text-xs font-semibold flex flex-wrap items-center justify-between gap-4 ${
        highContrast 
          ? 'bg-zinc-950 border-amber-400 text-amber-300' 
          : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${backendOnline ? 'text-emerald-600 animate-pulse' : 'text-rose-500'}`} />
            <span>FastAPI Backend: <strong className={backendOnline ? 'text-emerald-700 font-bold' : 'text-rose-600'}>{backendOnline ? 'Online (v3.2)' : 'Disconnected'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#4099FF]" />
            <span>Gemini AI Engine: <strong className="text-[#4B32E6] font-bold">Dynamic GenAI SDK (₹ INR Verified)</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {seedNotice && (
            <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded font-semibold border border-emerald-300">
              ✓ {seedNotice}
            </span>
          )}

          <button
            onClick={handleSeed}
            disabled={seeding}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              highContrast 
                ? 'bg-amber-400 text-black font-bold' 
                : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{seeding ? 'Seeding Demo Data...' : 'Reset / Seed Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex-1 w-full space-y-6">
        {/* Marketplace / Home Tab: includes Landing Hero, How It Works, and Enterprise AI showcase */}
        {activeTab === 'marketplace' && (
          <>
            <HeroAndFlow
              highContrast={highContrast}
              language={language}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAuth={() => setShowAuthModal(true)}
            />
            <Marketplace
              highContrast={highContrast}
              currentUser={currentUser}
              onBookingSuccess={() => setActiveTab('dashboard')}
              language={language}
            />
          </>
        )}

        {activeTab === 'map' && (
          <MapView
            highContrast={highContrast}
            currentUser={currentUser}
            language={language}
            onSelectProvider={() => setActiveTab('marketplace')}
            onRequestBooking={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'opportunities' && (
          <OpportunitiesView
            highContrast={highContrast}
            currentUser={currentUser}
            language={language}
          />
        )}

        {activeTab === 'smart-match' && (
          <SmartMatch
            highContrast={highContrast}
            onSelectServiceToBook={() => setActiveTab('marketplace')}
            language={language}
          />
        )}

        {activeTab === 'skill-builder' && (
          <SkillExtractor
            highContrast={highContrast}
            currentUser={currentUser}
            onProfileCreated={() => setActiveTab('marketplace')}
            language={language}
          />
        )}

        {activeTab === 'mentor-bot' && (
          <SeniorMentorBot highContrast={highContrast} language={language} />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            highContrast={highContrast}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            language={language}
          />
        )}
      </main>

      {/* Quiet Insight Notifications Drawer */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false)
          checkNotifications(currentUser)
        }}
        highContrast={highContrast}
        currentUser={currentUser}
        language={language}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />


      {/* Hexaware-Inspired Enterprise Deep Navy Footer (#0A0F24) */}
      <footer className={`border-t py-10 transition-colors ${
        highContrast 
          ? 'bg-black border-amber-400 text-amber-400' 
          : 'bg-[#0A0F24] border-slate-800 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4B32E6] to-[#4099FF] text-white flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">SilverHands</h3>
                <p className="text-xs text-slate-400">Turning Lifelong Skills Into New Opportunities</p>
              </div>
            </div>

            {/* Senior Friendly Quick Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
              <button onClick={() => setActiveTab('marketplace')} className="hover:text-white cursor-pointer">Marketplace</button>
              <button onClick={() => setActiveTab('opportunities')} className="hover:text-white cursor-pointer">Opportunities</button>
              <button onClick={() => setActiveTab('smart-match')} className="hover:text-white cursor-pointer">Smart Match</button>
              <button onClick={() => setActiveTab('skill-builder')} className="hover:text-white cursor-pointer">Skill Builder</button>
              <button onClick={() => setActiveTab('mentor-bot')} className="hover:text-white cursor-pointer">AI Assistant</button>
              <button onClick={() => setActiveTab('dashboard')} className="hover:text-white cursor-pointer">Dashboard</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-[#4099FF]" /> 100% Identity-Verified Platform</span>
              <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-[#4099FF]" /> Accessibility & Multilingual Ready</span>
            </div>
            <p className="text-[11px] text-slate-400 text-center sm:text-right">
              Built for Hexaware Hackathon 2026 • AI Senior Livelihood Initiative
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          highContrast={highContrast}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user)
            setActiveTab('dashboard')
          }}
          language={language}
        />
      )}
    </div>
  )
}
