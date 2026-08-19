import React, { useState } from 'react';
import { Bell, X, Check, CheckCheck, ExternalLink, MessageSquare, Sparkles, DollarSign, Award, Info } from 'lucide-react';
import type { NotificationRecord } from '../types';
import { WhatsAppNotificationPreview } from './WhatsAppNotificationPreview';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationRecord[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToRequest?: (requestId?: string | null) => void;
  userName?: string;
  userPhone?: string;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToRequest,
  userName = 'Senior Provider',
  userPhone = '+91 98765 43210'
}) => {
  const [viewTab, setViewTab] = useState<'inapp' | 'whatsapp'>('inapp');

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'NEW_SERVICE_REQUEST':
        return {
          icon: <Bell className="w-5 h-5 text-blue-600" />,
          bgColor: 'bg-blue-50 border-blue-200 text-blue-900',
          label: 'New Request'
        };
      case 'QUOTE_RECEIVED':
        return {
          icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
          bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          label: 'Quote Update'
        };
      case 'REQUEST_ACCEPTED':
        return {
          icon: <Check className="w-5 h-5 text-emerald-600" />,
          bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          label: 'Accepted'
        };
      case 'PAYMENT_CONFIRMED':
        return {
          icon: <Award className="w-5 h-5 text-amber-600" />,
          bgColor: 'bg-amber-50 border-amber-200 text-amber-900',
          label: 'Payment Confirmed'
        };
      case 'OPPORTUNITY_SUGGESTION':
        return {
          icon: <Sparkles className="w-5 h-5 text-purple-600" />,
          bgColor: 'bg-purple-50 border-purple-200 text-purple-900',
          label: 'AI Livelihood Opportunity'
        };
      case 'NEW_REVIEW':
        return {
          icon: <MessageSquare className="w-5 h-5 text-amber-600" />,
          bgColor: 'bg-amber-50 border-amber-200 text-amber-900',
          label: 'Customer Review'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-600" />,
          bgColor: 'bg-slate-50 border-slate-200 text-slate-900',
          label: 'SilverHands Alert'
        };
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} mins ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-7 h-7 text-amber-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-blue-900">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">SilverHands Alerts</h2>
              <p className="text-blue-100 text-xs font-medium">Proactive In-App & WhatsApp Notifications</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close notification panel"
            className="p-2 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center border border-blue-400/30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* View Tab Selector (In-App vs WhatsApp Demo Preview) */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex bg-slate-200/80 p-1 rounded-xl w-full border border-slate-300">
            <button
              onClick={() => setViewTab('inapp')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer min-h-[40px] flex items-center justify-center space-x-1.5 ${
                viewTab === 'inapp'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>In-App Cards ({notifications.length})</span>
            </button>

            <button
              onClick={() => setViewTab('whatsapp')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer min-h-[40px] flex items-center justify-center space-x-1.5 ${
                viewTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>📱 WhatsApp Preview</span>
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>{unreadCount > 0 ? `${unreadCount} Unread Alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</span>

          {unreadCount > 0 && viewTab === 'inapp' && (
            <button
              onClick={onMarkAllAsRead}
              className="text-blue-700 hover:text-blue-900 font-extrabold flex items-center space-x-1 cursor-pointer min-h-[36px]"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        {/* Notification Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">No Notifications Yet</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                When local customers request your services or AI finds new livelihood opportunities, alerts will appear here.
              </p>
            </div>
          ) : viewTab === 'whatsapp' ? (
            <div className="space-y-6">
              <p className="text-xs font-bold text-slate-600 text-center bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200">
                📱 Live WhatsApp Simulation Layer: Demonstrates how senior citizens receive WhatsApp alerts on their mobile phone.
              </p>
              {notifications.map((notif) => (
                <WhatsAppNotificationPreview
                  key={`wa-${notif.id}`}
                  notification={notif}
                  recipientName={userName}
                  recipientPhone={userPhone}
                  onOpenApp={(reqId) => {
                    if (!notif.is_read) onMarkAsRead(notif.id);
                    if (onNavigateToRequest) onNavigateToRequest(reqId || notif.related_request_id);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            notifications.map((notif) => {
              const badge = getNotificationBadge(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`p-5 rounded-2xl border-2 transition-all space-y-3 relative ${
                    !notif.is_read
                      ? 'bg-white border-blue-300 shadow-sm ring-1 ring-blue-100'
                      : 'bg-slate-50/80 border-slate-200 opacity-90'
                  }`}
                >
                  {/* Top Badge & Read Indicator */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${badge.bgColor}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        {formatTimestamp(notif.created_at)}
                      </span>
                      {!notif.is_read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" title="Unread"></span>
                      )}
                    </div>
                  </div>

                  {/* Title & Message */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {notif.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    {notif.related_request_id ? (
                      <button
                        onClick={() => {
                          if (!notif.is_read) onMarkAsRead(notif.id);
                          if (onNavigateToRequest) onNavigateToRequest(notif.related_request_id);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs min-h-[44px]"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-200" />
                        <span>View Request Details</span>
                      </button>
                    ) : (
                      <div></div>
                    )}

                    {!notif.is_read && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center space-x-1 cursor-pointer min-h-[40px]"
                      >
                        <Check className="w-3.5 h-3.5 text-slate-600" />
                        <span>Mark Read</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs font-bold text-slate-600 flex items-center justify-center space-x-2">
          <span>📱 Connected to WhatsApp Proactive Alert Engine</span>
        </div>
      </div>
    </div>
  );
};
