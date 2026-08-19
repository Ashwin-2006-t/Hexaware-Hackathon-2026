import React from 'react';
import { MessageSquare, ExternalLink, CheckCheck, ShieldCheck, Sparkles } from 'lucide-react';
import type { NotificationRecord } from '../types';

interface WhatsAppNotificationPreviewProps {
  notification: NotificationRecord;
  recipientName?: string;
  recipientPhone?: string;
  onOpenApp?: (requestId?: string | null) => void;
}

export const WhatsAppNotificationPreview: React.FC<WhatsAppNotificationPreviewProps> = ({
  notification,
  recipientName = 'Senior Provider',
  recipientPhone = '+91 98765 43210',
  onOpenApp
}) => {
  const displayPhone = notification.whatsapp_phone || recipientPhone;
  const statusLabel = notification.whatsapp_status || 'SENT (DEMO)';
  const formattedTime = notification.whatsapp_sent_at
    ? new Date(notification.whatsapp_sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-500/50 shadow-xl space-y-4 font-sans">
      {/* WhatsApp Simulated Phone Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black border-2 border-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm sm:text-base font-extrabold text-emerald-400 tracking-tight">📱 WhatsApp Alert Preview</h4>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/40 uppercase tracking-wider">
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Recipient: <span className="text-white font-bold">{recipientName}</span> ({displayPhone})
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1 text-emerald-400 text-xs font-bold bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-800">
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>Live Demo</span>
        </div>
      </div>

      {/* WhatsApp Message Bubble Container */}
      <div className="bg-[#0b141a] rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
        <div className="bg-[#202c33] text-slate-100 rounded-2xl p-4 border-l-4 border-emerald-500 shadow-md space-y-2 relative">
          
          {/* Chat Header */}
          <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-xs tracking-wider uppercase border-b border-slate-700/60 pb-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span>SilverHands Livelihood Alert</span>
          </div>

          {/* Title & Body */}
          <div className="space-y-2 pt-1">
            <h5 className="text-base sm:text-lg font-black text-white leading-tight">
              {notification.title}
            </h5>

            <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              {notification.whatsapp_message || notification.message}
            </p>
          </div>

          {/* Time & Delivery Checkmarks */}
          <div className="flex items-center justify-end space-x-1.5 text-[11px] text-slate-400 pt-1 font-bold">
            <span>{formattedTime}</span>
            <CheckCheck className="w-4 h-4 text-emerald-400" />
          </div>

          {/* Simulated WhatsApp Action Link Button */}
          {onOpenApp && (
            <div className="pt-2">
              <button
                onClick={() => onOpenApp(notification.related_request_id)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md min-h-[48px] border border-emerald-400"
              >
                <ExternalLink className="w-4.5 h-4.5 text-white flex-shrink-0" />
                <span>Open SilverHands Workspace</span>
              </button>
            </div>
          )}

        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time DB Delivery Log Verified</span>
        </span>
        <span className="text-emerald-400">WhatsApp Notification Engine</span>
      </div>
    </div>
  );
};
