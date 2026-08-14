import React, { useState } from 'react'
import { X, HeartHandshake } from 'lucide-react'
import { api } from '../services/api'
import type { User } from '../types'

interface AuthModalProps {
  onClose: () => void
  onSuccess: (user: User) => void
  highContrast: boolean
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, highContrast }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [email, setEmail] = useState<string>('mary.johnson@example.com')
  const [password, setPassword] = useState<string>('password123')
  const [fullName, setFullName] = useState<string>('Mary Johnson')
  const [role, setRole] = useState<'provider' | 'customer'>('provider')
  const [phone, setPhone] = useState<string>('+1 (555) 234-5678')
  const [bio] = useState<string>('Artisanal baking specialist with 38 years experience')

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isLogin) {
        const res = await api.login(email, password)
        onSuccess(res.user)
      } else {
        const res = await api.signup({
          email,
          password,
          full_name: fullName,
          role,
          phone,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`card-senior max-w-md w-full p-8 relative border-2 space-y-6 ${
        highContrast ? 'bg-zinc-900 text-white border-amber-400' : 'bg-white text-slate-900 border-slate-300'
      }`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
            <p className="text-xs font-bold text-amber-700 uppercase">SilverHands Senior Platform</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-3 border-2 border-slate-300 rounded-xl font-bold"
                >
                  <option value="provider">Senior Citizen / Skilled Provider</option>
                  <option value="customer">Customer / Service Seeker</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border-2 border-slate-300 rounded-xl font-medium"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-slate-300 rounded-xl font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-large w-full bg-amber-500 text-white hover:bg-amber-600 font-extrabold mt-2"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-sm">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-amber-700 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  )
}
