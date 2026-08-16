import React, { useState, useEffect } from 'react'
import type { NotificationItem, User } from '../types'
import { api } from '../services/api'
import { translations, type Language } from '../i18n/translations'
import {
  Bell,
  Check,
  ChevronRight,
  MapPin,
  Video,
  TrendingUp,
  Clock,
  Briefcase,
  Sparkles,
  X,
  Radio
} from 'lucide-react'

interface NotificationCenterProps {
  highContrast?: boolean
  currentUser?: User | null
  language?: Language
  onNavigateTab: (tab: string, payload?: any) => void
  onOpenVideoUpload?: () => void
  isOpen: boolean
  onClose: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  highContrast = false,
  currentUser,
  language = 'en',
  onNavigateTab,
  onOpenVideoUpload,
  isOpen,
  onClose
}) => {
  const t = translations[language] || translations.en
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await api.getNotifications(currentUser?.id)
      setNotifications(data)
    } catch (e) {
      console.error('Error fetching notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen, currentUser?.id])

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error('Mark read error:', e)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(currentUser?.id)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) {
      console.error('Mark all read error:', e)
    }
  }

  const handleActionClick = (notification: NotificationItem) => {
    handleMarkRead(notification.id)
    onClose()

    switch (notification.action) {
      case 'radius_settings':
      case 'map':
        onNavigateTab('map')
        break
      case 'video_upload':
        onNavigateTab('dashboard')
        if (onOpenVideoUpload) onOpenVideoUpload()
        break
      case 'profile_editor':
      case 'pricing':
      case 'availability':
        onNavigateTab('dashboard')
        break
      case 'view_opportunity':
      case 'opportunity_engine':
        onNavigateTab('opportunities')
        break
      default:
        onNavigateTab('dashboard')
        break
    }
  }

  if (!isOpen) return null

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 z-[1200] flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 ${
        highContrast ? 'bg-black border-l border-amber-400 text-white' : 'bg-white text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-4 md:p-5 border-b flex items-center justify-between ${
          highContrast ? 'border-amber-400 bg-zinc-950' : 'border-slate-100 bg-[#0A0F24] text-white'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4099FF]/20 text-[#4099FF] flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>{t.quietInsights || 'Quiet Insights'}</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-300">Data-grounded actionable nudges</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#4099FF] hover:underline font-bold cursor-pointer"
              >
                {t.markAllRead || 'Mark all read'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications Feed Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              Loading insights...
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notif) => {
              let Icon = Sparkles
              let badgeColor = 'bg-blue-50 text-[#4B32E6] border-blue-200'
              let actionLabel = 'Review Insight'

              if (notif.type === 'expansion') {
                Icon = MapPin
                badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200'
                actionLabel = 'Update Service Radius'
              } else if (notif.type === 'work_sample') {
                Icon = Video
                badgeColor = 'bg-purple-50 text-purple-700 border-purple-200'
                actionLabel = 'Upload 30s Video Intro'
              } else if (notif.type === 'pricing') {
                Icon = TrendingUp
                badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                actionLabel = 'Optimize Pricing Tier'
              } else if (notif.type === 'availability') {
                Icon = Clock
                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200'
                actionLabel = 'Adjust Schedule'
              } else if (notif.type === 'opportunity' || notif.type === 'interest') {
                Icon = Briefcase
                badgeColor = 'bg-cyan-50 text-cyan-800 border-cyan-200'
                actionLabel = 'View Opportunity'
              }

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    notif.read
                      ? highContrast
                        ? 'bg-zinc-950/60 border-zinc-800 opacity-75'
                        : 'bg-slate-50/70 border-slate-200/80 opacity-80'
                      : highContrast
                      ? 'bg-zinc-900 border-amber-400'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${badgeColor}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs md:text-sm font-bold text-slate-900">
                        {notif.title}
                      </h4>
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        title="Mark as read"
                        className="text-slate-400 hover:text-[#4B32E6] cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>

                    {notif.action && (
                      <button
                        onClick={() => handleActionClick(notif)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-[#0A0F24] hover:bg-[#131838] text-white cursor-pointer transition-all shadow-2xs"
                      >
                        <span>{actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#4099FF]" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No New Notifications</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {t.noNotifications || 'Your quiet, data-driven livelihood insights will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
