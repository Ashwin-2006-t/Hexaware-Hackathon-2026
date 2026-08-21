import React, { useState, useEffect } from 'react';
import { X, Phone, PhoneOff, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import type { CallLogRecord } from '../types';
import { initiateServiceCallApi, endServiceCallApi } from '../services/api';

interface CallActionModalProps {
  requestId: string;
  onClose: () => void;
}

import { useLanguage } from '../context/LanguageContext';

export const CallActionModal: React.FC<CallActionModalProps> = ({ requestId, onClose }) => {
  const { t } = useLanguage();
  const [callLog, setCallLog] = useState<CallLogRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    initiateServiceCallApi(requestId)
      .then((data) => setCallLog(data))
      .catch((err: any) => setError(err.message || 'Failed to initiate service query call'))
      .finally(() => setLoading(false));
  }, [requestId]);

  // Duration timer
  useEffect(() => {
    if (!callLog || callLog.status === 'COMPLETED') return;
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callLog]);

  const handleEndCall = async () => {
    if (!callLog) return;
    setIsEnding(true);
    try {
      const updated = await endServiceCallApi(callLog.id);
      setCallLog(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnding(false);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-black text-slate-900">Authorizing Masked Call...</h3>
          <p className="text-xs font-semibold text-slate-500">Verifying booking authorization & generating secure phone link.</p>
        </div>
      </div>
    );
  }

  if (error || !callLog) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-red-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">Call Authorization Failed</h3>
          <p className="text-xs font-semibold text-red-600">{error || 'Unable to initiate phone call'}</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-6 shadow-2xl border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Masked Call</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="space-y-2">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
            {callLog.receiver_name.charAt(0)}
          </div>
          <h3 className="text-lg font-black text-slate-900">{callLog.receiver_name}</h3>
          <p className="text-xs font-bold text-slate-500 tracking-wider">
            Masked Phone: {callLog.masked_phone}
          </p>
        </div>

        {/* Status & Timer */}
        {callLog.status === 'COMPLETED' ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-sm text-slate-900">Call Logged & Completed</h4>
            <p className="text-xs text-slate-500 font-semibold">Total Duration: {callLog.duration_seconds} seconds</p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
            <div className="flex items-center justify-center space-x-2 text-emerald-800 font-extrabold text-sm">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Call Duration: {formatDuration(duration)}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Click below to place call via your phone dialer.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {callLog.status !== 'COMPLETED' && (
            <a
              href={callLog.call_link}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center space-x-2 transition"
            >
              <Phone className="w-4 h-4" />
              <span>Dial Call Now</span>
            </a>
          )}

          {callLog.status !== 'COMPLETED' ? (
            <button
              onClick={handleEndCall}
              disabled={isEnding}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-extrabold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{t('call.endCall')}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-extrabold text-sm transition"
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
