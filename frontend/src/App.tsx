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

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('marketplace')
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [highContrast, setHighContrast] = useState<boolean>(false)
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

      // Automatically trigger seed on clean init if database is connected
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
      // Refresh current tab
      setActiveTab('marketplace')
    } catch (err: any) {
      alert(`Seed Error: ${err.message}`)
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    checkBackend()
  }, [])

  // Font size multiplier class mapping
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg'
      case 'xlarge':
        return 'text-xl'
      default:
        return 'text-base'
    }
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${getFontSizeClass()} ${
      highContrast ? 'bg-black text-amber-300' : 'bg-gradient-to-b from-amber-50/60 via-slate-50 to-slate-100 text-slate-900'
    }`}>
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fontSize={fontSize}
        setFontSize={setFontSize}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Backend & AI Real-Time Status Toolbar */}
      <div className={`border-b px-6 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-4 ${
        highContrast ? 'bg-zinc-900 border-amber-400 text-amber-300' : 'bg-white/80 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className={`w-4 h-4 ${backendOnline ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
            <span>FastAPI Backend: <strong className={backendOnline ? 'text-emerald-600' : 'text-rose-600'}>{backendOnline ? 'Online (v0.2.0)' : 'Disconnected'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Gemini AI Engine: <strong className="text-amber-600">Gemini 1.5 Flash Ready</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {seedNotice && (
            <span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full font-bold animate-fade-in">
              ✓ {seedNotice}
            </span>
          )}

          <button
            onClick={handleSeed}
            disabled={seeding}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
              highContrast ? 'bg-amber-400 text-black' : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{seeding ? 'Seeding Demo Data...' : 'Seed Sample Senior Providers'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {activeTab === 'marketplace' && (
          <Marketplace
            highContrast={highContrast}
            currentUser={currentUser}
            onBookingSuccess={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'smart-match' && (
          <SmartMatch
            highContrast={highContrast}
            onSelectServiceToBook={() => setActiveTab('marketplace')}
          />
        )}

        {activeTab === 'skill-builder' && (
          <SkillExtractor
            highContrast={highContrast}
            onProfileCreated={() => setActiveTab('marketplace')}
          />
        )}

        {activeTab === 'mentor-bot' && (
          <SeniorMentorBot highContrast={highContrast} />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            highContrast={highContrast}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Senior-Friendly Footer */}
      <footer className={`border-t py-8 text-center text-sm transition-colors ${
        highContrast ? 'bg-black border-amber-400 text-amber-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-6xl mx-auto px-6 space-y-2">
          <div className="flex items-center justify-center gap-2 font-black text-slate-800">
            <HeartHandshake className="w-5 h-5 text-amber-500" />
            <span>SilverHands • Empowering Lifelong Skills into Digital Livelihoods</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Hexaware Hackathon 2026 Submission • Built with FastAPI, React, TypeScript, Leaflet & Google Gemini AI
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
        />
      )}
    </div>
  )
}
