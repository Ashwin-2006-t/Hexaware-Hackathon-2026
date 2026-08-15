import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { Marketplace } from './components/Marketplace'
import { SmartMatch } from './components/SmartMatch'
import { SkillExtractor } from './components/SkillExtractor'
import { SeniorMentorBot } from './components/SeniorMentorBot'
import { Dashboard } from './components/Dashboard'
import { AuthModal } from './components/AuthModal'
import type { User } from './types'
import { api } from './services/api'
import { Activity, Database, Sparkles, HeartHandshake } from 'lucide-react'
import type { Language } from './i18n/translations'

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('marketplace')
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [highContrast, setHighContrast] = useState<boolean>(false)
  const [language, setLanguage] = useState<Language>('en')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)

  // System status state
  const [backendOnline, setBackendOnline] = useState<boolean>(false)
  const [seeding, setSeeding] = useState<boolean>(false)
  const [seedNotice, setSeedNotice] = useState<string | null>(null)

  const checkBackend = async () => {
    try {
      const data = await api.getHealth()
      setBackendOnline(data.status === 'online')

      // Load user profile from stored token / backend
      const me = await api.getMe()
      setCurrentUser(me)
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
        : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Navigation Header */}
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
      />

      {/* Backend & AI Real-Time Status Toolbar */}
      <div className={`border-b px-4 md:px-8 py-1.5 text-xs font-semibold flex flex-wrap items-center justify-between gap-4 ${
        highContrast 
          ? 'bg-zinc-950 border-amber-400 text-amber-300' 
          : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${backendOnline ? 'text-emerald-600 animate-pulse' : 'text-rose-500'}`} />
            <span>FastAPI Backend: <strong className={backendOnline ? 'text-emerald-700 font-bold' : 'text-rose-600'}>{backendOnline ? 'Online (v3.1)' : 'Disconnected'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Gemini AI Engine: <strong className="text-blue-700 font-bold">Real Dynamic Google GenAI (₹ INR Ready)</strong></span>
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
            <span>{seeding ? 'Seeding Demo Data...' : 'Reset / Seed Demo Providers'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex-1 w-full">
        {activeTab === 'marketplace' && (
          <Marketplace
            highContrast={highContrast}
            currentUser={currentUser}
            onBookingSuccess={() => setActiveTab('dashboard')}
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

      {/* Enterprise SaaS + Social Impact Footer */}
      <footer className={`border-t py-6 text-center text-xs transition-colors ${
        highContrast 
          ? 'bg-black border-amber-400 text-amber-400' 
          : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-6xl mx-auto px-4 space-y-1.5">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-900">
            <HeartHandshake className="w-4 h-4 text-blue-600" />
            <span>SilverHands • Turning Lifelong Skills Into New Opportunities</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Hexaware Hackathon 2026 • Built with FastAPI, SQLAlchemy, React, TypeScript, Leaflet, ₹ INR Formatting & Real Google Gemini AI
          </p>
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
