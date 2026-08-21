import React from 'react';
import { ShieldCheck, Calendar, MapPin, X, CheckCircle2, Clock } from 'lucide-react';
import type { ProviderProfile } from '../types';

import { translations, type Language } from '../i18n';

interface BookingSummaryModalProps {
  isOpen: boolean;
  provider: ProviderProfile;
  title: string;
  description?: string;
  preferredDate?: string;
  location?: string;
  isSubmitting?: boolean;
  language?: Language;
  onClose: () => void;
  onConfirm: () => void;
}

export const BookingSummaryModal: React.FC<BookingSummaryModalProps> = ({
  isOpen,
  provider,
  title,
  preferredDate,
  location,
  isSubmitting,
  language = 'en',
  onClose,
  onConfirm
}) => {
  const t = translations[language].modal;
  const tc = translations[language].common;
  if (!isOpen) return null;

  const seniorName = provider.user?.name || 'Senior Provider';
  const price = provider.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-blue-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-4 text-white flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center border border-blue-400/40">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{t.summaryTitle}</h3>
              <p className="text-xs text-blue-200 font-medium">{t.summarySub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-blue-800/80 hover:bg-blue-800 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-zinc-900">
          
          {/* Service Details Section */}
          <div className="space-y-3">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center pb-2 border-b border-blue-100">
                <span className="text-zinc-500">Senior Provider:</span>
                <span className="font-extrabold text-zinc-900">{seniorName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-blue-100">
                <span className="text-zinc-500">Service Title:</span>
                <span className="font-extrabold text-zinc-900">{title}</span>
              </div>
              {preferredDate && (
                <div className="flex justify-between items-center pb-2 border-b border-blue-100">
                  <span className="text-zinc-500">Requested Date:</span>
                  <span className="font-extrabold text-blue-800 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{preferredDate}</span>
                  </span>
                </div>
              )}
              {location && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Location:</span>
                  <span className="font-extrabold text-zinc-800 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{location}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Price Details Section */}
          <div className="space-y-3">
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2.5 text-xs font-bold">
              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm font-black text-emerald-950">
                <span>{t.totalAmountLabel}</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {price !== null && price !== undefined ? `₹${price}` : 'Quote Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Guarantee Note */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium flex items-start space-x-2.5">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>{t.noPaymentNowNotice}</p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center gap-3 sticky bottom-0 z-10 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-extrabold text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            {tc.cancel}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer min-h-[44px]"
          >
            {isSubmitting ? (
              <span>{tc.processing}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.confirmSendBtn}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
