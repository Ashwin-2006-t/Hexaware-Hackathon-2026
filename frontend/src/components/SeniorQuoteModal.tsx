import React, { useState } from 'react';
import { Send, Calculator, AlertCircle, X } from 'lucide-react';
import type { ServiceRequest } from '../types';
import { sendSeniorQuoteApi } from '../services/api';

import { translations, type Language } from '../i18n';

interface SeniorQuoteModalProps {
  request: ServiceRequest;
  language?: Language;
  onClose: () => void;
  onQuoteSent: () => void;
}

export const SeniorQuoteModal: React.FC<SeniorQuoteModalProps> = ({
  request,
  language = 'en',
  onClose,
  onQuoteSent
}) => {
  const t = translations[language].quote;
  const tc = translations[language].common;
  const baseRate = request.agreed_price ?? request.provider?.price ?? 0;
  const unit = request.agreed_pricing_unit || 'per_service';
  const qty = Math.max(1, request.requirement_quantity || 1);
  const reqUnit = request.requirement_unit || 'units';

  const unitLabel =
    unit === 'per_person' ? 'Per Person' :
    unit === 'per_hour' ? 'Per Hour' :
    unit === 'per_session' ? 'Per Session' :
    unit === 'negotiable' ? 'Negotiable' : 'Per Service';

  const calculatedBaseTotal = unit === 'negotiable' ? baseRate : baseRate * qty;

  const [additionalCharge, setAdditionalCharge] = useState<number>(0);
  const [quoteNote, setQuoteNote] = useState<string>('');
  const [finalQuoteAmount, setFinalQuoteAmount] = useState<number>(calculatedBaseTotal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChargeChange = (val: number) => {
    const safeCharge = Math.max(0, val);
    setAdditionalCharge(safeCharge);
    setFinalQuoteAmount(calculatedBaseTotal + safeCharge);
  };

  const handleFinalAmountChange = (val: number) => {
    const safeTotal = Math.max(0, val);
    setFinalQuoteAmount(safeTotal);
    setAdditionalCharge(Math.max(0, safeTotal - calculatedBaseTotal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await sendSeniorQuoteApi(request.id, finalQuoteAmount, additionalCharge, quoteNote.trim() || undefined);
      onQuoteSent();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send quote to customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-blue-200 space-y-5 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900">{t.title}</h3>
              <p className="text-xs text-zinc-500 font-medium">{t.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Requirement Summary Box */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs font-semibold text-zinc-800">
          <div className="flex justify-between items-center pb-2 border-b border-blue-200/60">
            <span className="text-zinc-600">Service Title:</span>
            <span className="font-extrabold text-blue-950 text-sm">{request.title}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-blue-200/60">
            <span className="text-zinc-600">Customer Requirement:</span>
            <span className="font-black text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
              {qty} {reqUnit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-600">Base Rate:</span>
            <span className="font-bold text-zinc-900">
              ₹{baseRate} / {unitLabel}
            </span>
          </div>
          {request.description && (
            <div className="pt-2 border-t border-blue-200/60 text-zinc-600 font-medium italic">
              "{request.description}"
            </div>
          )}
        </div>

        {/* Quote Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                {t.additionalChargeLabel}
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={additionalCharge}
                onChange={(e) => handleChargeChange(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 100"
                className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                {t.quoteAmountLabel}
              </label>
              <input
                type="number"
                min="0"
                required
                value={finalQuoteAmount}
                onChange={(e) => handleFinalAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full p-3 rounded-xl border-2 border-emerald-500 text-sm font-black text-emerald-950 bg-emerald-50/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              {t.noteLabel}
            </label>
            <textarea
              rows={2}
              value={quoteNote}
              onChange={(e) => setQuoteNote(e.target.value)}
              placeholder="e.g. Includes extra ingredients and custom packaging"
              className="w-full p-3 rounded-xl border border-zinc-300 text-xs font-medium bg-white"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-zinc-300 text-zinc-700 font-extrabold text-xs hover:bg-zinc-50 cursor-pointer min-h-[44px]"
            >
              {tc.cancel}
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? tc.processing : `${t.sendBtn} (₹${finalQuoteAmount})`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
