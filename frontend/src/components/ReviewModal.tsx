import React, { useState, useEffect } from 'react'
import {
  Star, CheckCircle2, AlertCircle, X, ShieldCheck
} from 'lucide-react'
import type { Booking, Review } from '../types'
import { api } from '../services/api'
import { translations, type Language } from '../i18n/translations'

interface ReviewModalProps {
  booking: Booking
  onClose: () => void
  onSuccess: () => void
  language?: Language
  highContrast?: boolean
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  onClose,
  onSuccess,
  language = 'en',
  highContrast = false
}) => {
  const t = translations[language]

  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  const [checkingExisting, setCheckingExisting] = useState<boolean>(true)

  useEffect(() => {
    const checkReview = async () => {
      setCheckingExisting(true)
      try {
        const rev = await api.getBookingReview(booking.id)
        if (rev) {
          setExistingReview(rev)
          setRating(rev.rating)
          setComment(rev.comment || '')
        }
      } catch {
        // no existing review
      } finally {
        setCheckingExisting(false)
      }
    }
    checkReview()
  }, [booking.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await api.submitReview(booking.id, rating, comment)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border ${
        highContrast ? 'bg-black border-2 border-amber-400 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-white flex items-center justify-center font-bold shadow-md">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Verified Customer Feedback
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {t.rateReviewTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {checkingExisting ? (
            <div className="p-10 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-[#4B32E6] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Checking booking status...</p>
            </div>
          ) : success ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-slate-900">Thank you for your feedback!</h4>
              <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
                Your authentic review has been saved and the provider's community rating and Smart Match standing have been recalculated.
              </p>
            </div>
          ) : existingReview ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-black text-emerald-800">Review Already Submitted</span>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    You have already submitted a {existingReview.rating}★ rating for this completed service.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-black">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= existingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  ))}
                  <span className="ml-1 text-slate-900 font-bold">({existingReview.rating}/5)</span>
                </div>
                {existingReview.comment && (
                  <p className="text-slate-700 italic">"{existingReview.comment}"</p>
                )}
                <span className="text-[10px] text-slate-400 block pt-1">
                  Submitted on {new Date(existingReview.created_at).toLocaleDateString()}
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Service & Provider summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-black uppercase text-[#4B32E6]">Completed Service</span>
                <h4 className="text-sm font-black text-slate-900">{booking.service_title}</h4>
                <p className="text-slate-500 font-medium">
                  Provider: <strong>{booking.provider_name}</strong> • Scheduled: {booking.scheduled_date}
                </p>
              </div>

              {/* Star Selector */}
              <div className="space-y-2 text-center">
                <label className="text-xs font-black text-slate-800 block">
                  How was your experience? (Rating 1 to 5 Stars) *
                </label>

                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(rating)}
                      onClick={() => setRating(star)}
                      className="p-1 rounded-xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={`w-9 h-9 ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <span className="text-xs font-black text-[#4B32E6]">
                  {rating === 5 && '★★★★★ Exceptional (5 / 5)'}
                  {rating === 4 && '★★★★ Very Good (4 / 5)'}
                  {rating === 3 && '★★★ Satisfactory (3 / 5)'}
                  {rating === 2 && '★★ Needs Improvement (2 / 5)'}
                  {rating === 1 && '★ Disappointing (1 / 5)'}
                </span>
              </div>

              {/* Optional Comment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Your Feedback / Comment (Optional)</span>
                  <span className="text-[10px] text-slate-400">Authentic review</span>
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the craftsmanship, punctuality, or learning experience..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 text-xs font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{submitting ? 'Submitting Review...' : 'Submit Rating & Review'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
