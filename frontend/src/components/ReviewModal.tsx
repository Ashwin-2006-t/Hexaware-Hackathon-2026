import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { createReview } from '../services/api';

import { translations, type Language } from '../i18n';

interface ReviewModalProps {
  requestId: string;
  providerName: string;
  serviceTitle: string;
  language?: Language;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  requestId,
  providerName,
  serviceTitle,
  language = 'en',
  onClose,
  onReviewSubmitted
}) => {
  const t = translations[language].review;
  const tc = translations[language].common;
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await createReview({
        request_id: requestId,
        rating,
        comment: comment.trim() || undefined
      });
      setIsSuccess(true);
      setTimeout(() => {
        onReviewSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not submit review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-100 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-2xl font-extrabold text-zinc-900">
            {t.title}
          </h3>
          <p className="text-sm font-semibold text-blue-900">
            {serviceTitle} by {providerName}
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-bold text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-xl font-extrabold text-emerald-950">{tc.success}</h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Rating Stars Selection */}
            <div className="space-y-2 text-center">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600">
                {t.ratingLabel}
              </label>
              <div className="flex items-center justify-center space-x-3 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-2 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Area */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600">
                {t.commentLabel}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.commentPlaceholder}
                rows={4}
                className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium resize-none bg-zinc-50/50"
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl border border-zinc-200 text-zinc-700 font-extrabold text-sm hover:bg-zinc-50 transition-colors cursor-pointer min-h-[52px]"
              >
                {tc.cancel}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[52px]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{tc.processing}</span>
                  </>
                ) : (
                  <span>{t.submitBtn}</span>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
