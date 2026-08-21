import React, { useState, useEffect } from 'react'
import {
  Video, VideoOff, Mic, MicOff, Phone, X, ExternalLink,
  ShieldCheck, AlertCircle, Clock, User
} from 'lucide-react'
import type { VirtualCallResponse } from '../types'
import { api } from '../services/api'
import { translations, type Language } from '../i18n/translations'

interface VirtualCallModalProps {
  bookingId: number
  onClose: () => void
  language?: Language
  highContrast?: boolean
}

export const VirtualCallModal: React.FC<VirtualCallModalProps> = ({
  bookingId,
  onClose,
  language = 'en',
  highContrast = false
}) => {
  const t = translations[language]

  const [callData, setCallData] = useState<VirtualCallResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState<boolean>(false)
  const [notifying, setNotifying] = useState<boolean>(false)
  const [notified, setNotified] = useState<boolean>(false)

  // Media previews
  const [micEnabled, setMicEnabled] = useState<boolean>(true)
  const [videoEnabled, setVideoEnabled] = useState<boolean>(true)

  useEffect(() => {
    const initCall = async () => {
      setLoading(true)
      try {
        const data = await api.startVirtualCall(bookingId)
        setCallData(data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to initialize virtual meeting room.')
      } finally {
        setLoading(false)
      }
    }
    initCall()
  }, [bookingId])

  const handleSendReminder = async () => {
    setNotifying(true)
    try {
      await api.notifyVirtualCall(bookingId)
      setNotified(true)
      setTimeout(() => setNotified(false), 3000)
    } catch (err: any) {
      alert(`Alert error: ${err.message}`)
    } finally {
      setNotifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border flex flex-col max-h-[90vh] ${
        highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4B32E6] text-white flex items-center justify-center font-bold shadow-md">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#4B32E6] uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                End-to-End Encrypted Room
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {t.prejoinTitle} (Booking #{bookingId})
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {loading ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#4B32E6] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-bold text-sm text-slate-600">Connecting to secure consultation room...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900">Unable to Start Call</h4>
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl max-w-md mx-auto border border-rose-200">
                {error}
              </p>
              <button
                onClick={onClose}
                className="bg-slate-900 text-white text-xs font-bold py-2.5 px-6 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : callData && !joined ? (
            /* PRE-JOIN SCREEN */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Consultation Details Card */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#4B32E6] tracking-wider">Service Session</span>
                  <h4 className="text-xl font-black text-slate-900 mt-1">{callData.service_title}</h4>
                </div>

                <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Provider: <strong>{callData.provider_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Customer: <strong>{callData.customer_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Scheduled Time: <strong>{callData.scheduled_date}</strong></span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Participant Authorization Verified</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    This consultation room is exclusively accessible to the customer, senior provider, and authorized Family Circle helpers.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSendReminder}
                    disabled={notifying}
                    className="text-xs font-bold text-[#4B32E6] hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{notified ? '✓ Notification Sent to Counterpart!' : 'Send Call Starting Alert'}</span>
                  </button>
                </div>
              </div>

              {/* Readiness & Controls */}
              <div className="space-y-5 p-6 rounded-3xl border border-blue-100 bg-blue-50/40 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#4B32E6] to-[#4099FF] text-white flex items-center justify-center mx-auto shadow-lg">
                  <Video className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900">Ready to Connect?</h4>
                  <p className="text-xs text-slate-500">
                    Check your microphone and camera settings before entering the room.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      micEnabled ? 'bg-white text-emerald-700 border-emerald-300 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-300'
                    }`}
                    title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                  >
                    {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      videoEnabled ? 'bg-white text-emerald-700 border-emerald-300 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-300'
                    }`}
                    title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setJoined(true)}
                    className="w-full bg-[#4B32E6] hover:bg-[#3D26D1] text-white text-sm font-black py-3.5 px-6 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>{t.joinCall} in App</span>
                  </button>

                  <a
                    href={callData.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Open in Fullscreen Browser Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : callData && joined ? (
            /* ACTIVE IN-APP VIDEO EMBED */
            <div className="space-y-4">
              <div className="relative w-full h-[550px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                <iframe
                  src={callData.meeting_url}
                  allow="camera; microphone; display-capture; fullscreen"
                  className="w-full h-full border-0"
                  title="Virtual Consultation Video"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                <span>Room: <strong className="text-slate-900">{callData.room_id}</strong></span>
                <div className="flex items-center gap-2">
                  <a
                    href={callData.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#4B32E6] hover:underline flex items-center gap-1"
                  >
                    <span>Switch to Fullscreen Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setJoined(false)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    Leave Call
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
