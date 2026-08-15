import React, { useState } from 'react'
import { X, HeartHandshake, Eye, EyeOff, ShieldCheck, Sparkles, UserCheck, ArrowRight, ArrowLeft } from 'lucide-react'
import { api } from '../services/api'
import type { User } from '../types'
import { translations, type Language } from '../i18n/translations'

interface AuthModalProps {
  onClose: () => void
  onSuccess: (user: User) => void
  highContrast: boolean
  language?: Language
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, highContrast, language = 'en' }) => {
  const t = translations[language]

  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [step, setStep] = useState<number>(1)
  const [showPassword, setShowPassword] = useState<boolean>(false)

  // Form Fields
  const [email, setEmail] = useState<string>('meenakshi.amma@example.com')
  const [password, setPassword] = useState<string>('password123')
  const [fullName, setFullName] = useState<string>('Meenakshi Amma')
  const [userType, setUserType] = useState<'senior' | 'homemaker' | 'customer'>('homemaker')
  const [age, setAge] = useState<number>(68)
  const [phone, setPhone] = useState<string>('+91 98200 12345')
  const [locationName, setLocationName] = useState<string>('Matunga / Dadar, Mumbai')
  const [languages, setLanguages] = useState<string>('Tamil, Marathi, Hindi, English')
  const [bio, setBio] = useState<string>('Traditional South Indian cooking, home tiffin, and pickle specialist with 38 years experience')

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLogin && step === 1) {
      setStep(2)
      return
    }

    setLoading(true)
    setError(null)
    try {
      if (isLogin) {
        const res = await api.login(email, password)
        onSuccess(res.user)
      } else {
        const role = userType in ['senior', 'homemaker'] ? 'provider' : 'customer'
        const res = await api.signup({
          email,
          password,
          full_name: fullName,
          role,
          user_type: userType,
          age: Number(age),
          phone,
          location_name: locationName,
          languages,
          bio
        })
        onSuccess(res.user)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-5 border ${
        highContrast ? 'bg-black text-white border-2 border-amber-400' : 'bg-white text-slate-900 border-slate-200'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-10 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Deep Navy Brand Panel (#0A0F24) */}
        <div className={`p-6 md:col-span-2 flex flex-col justify-between ${
          highContrast ? 'bg-zinc-950 text-amber-300 border-r border-amber-400' : 'card-navy-hero text-white border-r border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#4B32E6] text-white flex items-center justify-center font-bold shadow-sm">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">SilverHands</h3>
                <span className="text-[10px] font-bold text-[#4099FF] uppercase tracking-wider">v3.2 • Enterprise</span>
              </div>
            </div>

            <h4 className="text-base font-bold leading-snug mb-2 text-white">
              "{t.tagline}"
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed font-normal mb-4">
              Connect with your local community. Share your culinary recipes, tutoring wisdom, tailoring craftsmanship, and gardening passions with dignity and fair ₹ INR earnings.
            </p>

            <div className="space-y-2 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Identity-Verified Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4099FF] shrink-0" />
                <span>AI Skill Extraction & Bio Builder</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Platform Commission</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Built for Hexaware Hackathon 2026 • Senior Livelihood
          </div>
        </div>

        {/* Right Side: Clean White Form Panel */}
        <div className="p-6 md:col-span-3 flex flex-col justify-center">
          <div className="mb-4">
            <h3 className="text-xl font-black text-slate-900">
              {isLogin ? 'Welcome Back' : step === 1 ? t.register : 'Profile & Skill Details'}
            </h3>
            <p className="text-xs font-semibold text-[#4B32E6] mt-0.5 uppercase tracking-wider">
              {isLogin ? 'Sign in to access your dashboard' : `Step ${step} of 2 • ${step === 1 ? 'Basic Info' : 'Experience & Location'}`}
            </p>
          </div>

          {error && (
            <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {isLogin ? (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                    placeholder="e.g. meenakshi.amma@example.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : step === 1 ? (
              <>
                {/* Step 1: Basic Info */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">I am registering as:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'senior', label: 'Senior (60+)' },
                      { id: 'homemaker', label: 'Homemaker' },
                      { id: 'customer', label: 'Customer' }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setUserType(btn.id as any)}
                        className={`p-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                          userType === btn.id
                            ? 'bg-[#4B32E6] border-[#4B32E6] text-white shadow-sm'
                            : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                    placeholder="e.g. Ramesh Patel"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone (+91)</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                      placeholder="+91 98XXX XXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                    placeholder="Min 6 characters"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Location & Skills */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Neighborhood / City</label>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                    placeholder="e.g. Dadar, Mumbai or Mylapore, Chennai"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Languages Spoken</label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                    placeholder="e.g. Tamil, Hindi, English"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Short Bio / Lifelong Skills</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#4B32E6]"
                    placeholder="Describe what skills you'd like to share or services you're seeking..."
                  />
                </div>
              </>
            )}

            {/* Submit & Next Step Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {!isLogin && step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-large w-1/3 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs py-2 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`btn-large flex-1 text-xs py-2 font-semibold shadow-sm ${
                  highContrast 
                    ? 'bg-amber-400 text-black font-bold' 
                    : 'btn-indigo'
                }`}
              >
                {loading ? (
                  <span>Processing...</span>
                ) : isLogin ? (
                  <span>Sign In</span>
                ) : step === 1 ? (
                  <>
                    <span>Next: Profile Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <span>Complete Registration</span>
                )}
              </button>
            </div>
          </form>

          {/* Toggle Switch */}
          <div className="text-center pt-3 mt-3 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setStep(1)
                setError(null)
              }}
              className="font-semibold text-[#4B32E6] hover:underline cursor-pointer"
            >
              {isLogin ? "New to SilverHands? Create a free account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
