import React, { useState, useEffect } from 'react'
import { Calendar, ShieldCheck, Star } from 'lucide-react'
import type { Booking, User } from '../types'
import { api } from '../services/api'

interface DashboardProps {
  highContrast: boolean
  currentUser: User | null
}

export const Dashboard: React.FC<DashboardProps> = ({ highContrast, currentUser }) => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Review Modal State
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('Wonderful senior experience! Highly recommended.')
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false)

  const loadBookings = async () => {
    setLoading(true)
    try {
      const data = await api.getUserBookings(currentUser?.id || 1)
      setBookings(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const handleUpdateStatus = async (bookingId: number, status: string) => {
    try {
      await api.updateBookingStatus(bookingId, status)
      loadBookings()
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewBookingId) return
    setReviewSubmitting(true)
    try {
      await api.submitReview(reviewBookingId, rating, comment)
      alert('Thank you! Your 5-star review has been posted.')
      setReviewBookingId(null)
      loadBookings()
    } catch (err: any) {
      alert(`Review error: ${err.message}`)
    } finally {
      setReviewSubmitting(false)
    }
  }

  const totalEarned = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Profile Overview Card */}
      <div className={`card-senior p-8 rounded-3xl border-2 ${
        highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
              alt={currentUser?.full_name || 'Senior Provider'}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-amber-500 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-black">{currentUser?.full_name || 'Grandma Mary Johnson'}</h2>
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-slate-500 font-bold text-sm mt-0.5">
                Senior Provider • {currentUser?.location_name || 'San Francisco, CA'}
              </p>
              <p className="text-xs font-semibold text-amber-700 bg-amber-100 inline-block px-3 py-0.5 rounded-full mt-2">
                Verified Senior Craftsman & Mentor
              </p>
            </div>
          </div>

          {/* Earnings / Jobs Metrics */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <span className="text-xs font-bold text-amber-800 uppercase block">Total Earnings</span>
              <span className="text-3xl font-black text-amber-900">${totalEarned.toFixed(2)}</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-xs font-bold text-slate-500 uppercase block">Completed Jobs</span>
              <span className="text-3xl font-black text-slate-900">
                {bookings.filter((b) => b.status === 'completed').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-900">My Service Bookings ({bookings.length})</h3>
          <button
            onClick={loadBookings}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
          >
            Refresh List
          </button>
        </div>

        {loading && (
          <div className="py-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="font-bold text-sm">Loading bookings...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold">
            {error}
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border-2 border-dashed border-slate-300">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-xl font-bold">No active bookings yet.</p>
            <p className="text-sm mt-1">When customers book your service, details will appear here.</p>
          </div>
        )}

        {!loading && !error && bookings.map((booking) => (
          <div
            key={booking.id}
            className={`card-senior p-6 border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
              highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-white border-slate-200'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  booking.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-900'
                    : booking.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-amber-100 text-amber-900'
                }`}>
                  {booking.status}
                </span>
                <span className="text-xs text-slate-400 font-bold">ID #{booking.id}</span>
              </div>

              <h4 className="text-xl font-black text-slate-900">{booking.service_title}</h4>
              <p className="text-sm font-bold text-slate-600">
                Customer: {booking.customer_name} • Scheduled: {booking.scheduled_date}
              </p>
              {booking.notes && (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border">
                  "{booking.notes}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold uppercase block">Total Price</span>
                <span className="text-2xl font-black text-amber-600">${booking.total_price.toFixed(2)}</span>
              </div>

              {/* Action Buttons based on Status */}
              <div className="flex items-center gap-2">
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                    className="btn-large bg-emerald-600 text-white hover:bg-emerald-700 text-sm py-2 px-4"
                  >
                    Accept Booking
                  </button>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'completed')}
                    className="btn-large bg-blue-600 text-white hover:bg-blue-700 text-sm py-2 px-4"
                  >
                    Mark Completed
                  </button>
                )}

                {booking.status === 'completed' && (
                  <button
                    onClick={() => setReviewBookingId(booking.id)}
                    className="btn-large bg-amber-500 text-white hover:bg-amber-600 text-sm py-2 px-4"
                  >
                    <Star className="w-4 h-4" />
                    <span>Leave Review</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {reviewBookingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-senior max-w-lg w-full p-6 space-y-4 bg-white border-2 border-slate-300">
            <h3 className="text-2xl font-black">Submit Verified Review & Rating</h3>

            <div>
              <label className="block text-sm font-bold mb-1">Select Star Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-2 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Comment / Feedback</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border-2 border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setReviewBookingId(null)}
                className="btn-large w-1/2 bg-slate-200 text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="btn-large w-1/2 bg-amber-500 text-white hover:bg-amber-600"
              >
                {reviewSubmitting ? 'Posting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
