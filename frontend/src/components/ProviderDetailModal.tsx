import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Clock, CheckCircle2, HeartHandshake, Send, AlertCircle, UserCheck, Edit3, Heart, ArrowRight, Calendar } from 'lucide-react';
import type { ProviderProfile, ReviewRecord } from '../types';
import { fetchProviderById, createServiceRequest, saveProviderApi, fetchProviderReviews } from '../services/api';
import { translations, type Language } from '../i18n';

interface ProviderDetailModalProps {
  providerId: string | null;
  viewContext?: 'customer' | 'owner';
  language?: Language;
  onClose: () => void;
  onEditMyProfile?: () => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  providerId,
  viewContext = 'customer',
  language = 'en',
  onClose,
  onEditMyProfile
}) => {
  const t = translations[language].customer;
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // 2-Step Request Confirmation Flow: 'input' | 'summary' | 'receipt'
  const [bookingStep, setBookingStep] = useState<'input' | 'summary' | 'receipt'>('input');

  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqDate, setReqDate] = useState('');
  const [reqTime, setReqTime] = useState('10:00 AM');
  const [reqLocation, setReqLocation] = useState('Chennai, Tamil Nadu');
  const [reqQty, setReqQty] = useState<number>(1);
  const [reqUnit, setReqUnit] = useState<string>('people');
  const [reqCustName] = useState('');
  const [reqCustEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      }
    } catch {
      return dateStr;
    }
    return dateStr;
  };

  // Saved state
  const [isSaved, setIsSaved] = useState(false);

  const myProviderId = typeof window !== 'undefined' ? localStorage.getItem('silverhands_my_provider_id') : null;
  const isMyProfile = Boolean(myProviderId && provider && myProviderId === provider.id);
  const isOwnerMode = viewContext === 'owner' && isMyProfile;

  const [reviewsList, setReviewsList] = useState<ReviewRecord[]>([]);

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    fetchProviderById(providerId)
      .then((data) => {
        setProvider(data);
        if (data.user?.location) setReqLocation(data.user.location);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetchProviderReviews(providerId)
      .then((revs) => setReviewsList(revs))
      .catch((err) => console.error(err));
  }, [providerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!providerId) return null;

  const handleProceedToSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqDesc.trim()) {
      setErrorMsg("Please provide a service title and description.");
      return;
    }
    if (!reqDate) {
      setErrorMsg("Please select your preferred date");
      return;
    }
    if (!reqTime) {
      setErrorMsg("Please select your preferred time");
      return;
    }
    setErrorMsg(null);
    setBookingStep('summary');
  };

  const handleSendRequest = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await createServiceRequest({
        customer_name: reqCustName || 'Neighbor Customer',
        customer_email: reqCustEmail || 'neighbor@example.com',
        provider_id: provider?.id,
        title: reqTitle,
        description: `${reqDesc} (Time: ${reqTime})`,
        category: provider?.skills[0]?.category || 'General',
        location: reqLocation,
        preferred_date: reqDate,
        requirement_quantity: reqQty,
        requirement_unit: reqUnit
      });
      setBookingStep('receipt');
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!provider) return;
    try {
      await saveProviderApi(provider.id);
      setIsSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const hasReviews = provider && provider.total_reviews && provider.total_reviews > 0;
  const hasExp = provider && provider.experience_years !== null && provider.experience_years !== undefined && provider.experience_years > 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-blue-100 relative overflow-hidden animate-in fade-in zoom-in-95 my-auto"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close profile preview"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 p-2.5 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white border border-white/40 backdrop-blur-md transition-all cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-white min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-6 h-6" />
        </button>

        {loading || !provider ? (
          <div className="p-12 text-center text-zinc-500 font-bold">Loading provider profile...</div>
        ) : (
          <div className="flex flex-col h-full min-h-0">
            
            {/* Modal Header Banner - Vibrant Blue */}
            <div className="flex-shrink-0 relative bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 p-6 sm:p-8 text-white rounded-t-3xl border-b border-blue-600/30">
              <div className="flex items-start justify-between gap-4 pr-10 sm:pr-12">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 rounded-2xl bg-white text-blue-800 font-black text-3xl flex items-center justify-center shadow-lg flex-shrink-0">
                    {provider.user?.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-3xl font-extrabold">{provider.user?.name}</h3>
                      {isMyProfile ? (
                        <span className="bg-emerald-500/30 border border-emerald-400 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{t.myProfileBadge}</span>
                        </span>
                      ) : (
                        <span className="bg-blue-500/30 border border-blue-400/40 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {t.silverHandsProvider}
                        </span>
                      )}
                    </div>
                    <p className="text-blue-100 text-lg font-bold">{provider.title}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-blue-100 pt-1">
                      <span className="flex items-center bg-white/10 px-2.5 py-1 rounded-md border border-white/20">
                        <Star className="w-3.5 h-3.5 text-blue-200 fill-blue-200 mr-1" />
                        {hasReviews ? `${provider.rating} (${provider.total_reviews} reviews)` : t.newProvider}
                      </span>
                      <span className="flex items-center bg-white/10 px-2.5 py-1 rounded-md border border-white/20">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-blue-200" />
                        {provider.user?.location}
                      </span>
                      <span className="flex items-center bg-white/10 px-2.5 py-1 rounded-md border border-white/20">
                        <Clock className="w-3.5 h-3.5 mr-1 text-blue-200" />
                        {hasExp ? `${provider.experience_years}+ Years Exp` : 'Experience not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {!isOwnerMode && (
                  <button
                    onClick={handleSaveProvider}
                    className={`p-3 rounded-2xl border transition-colors cursor-pointer min-h-[48px] ${
                      isSaved ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                    title="Save Provider"
                  >
                    <Heart className={`w-6 h-6 ${isSaved ? 'fill-white' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              
              {/* About Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">About Provider</h4>
                <p className="text-base text-zinc-800 leading-relaxed font-medium">
                  {provider.bio}
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stated Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {provider.skills.map((sk, i) => (
                    <div key={i} className="bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>{sk.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Offerings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Service Offerings & Pricing</h4>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    {provider.price !== null && provider.price !== undefined ? `₹${provider.price}` : 'Price not set'} / {
                      provider.pricing_unit === 'per_person' ? 'Per Person' :
                      provider.pricing_unit === 'per_hour' ? 'Per Hour' :
                      provider.pricing_unit === 'per_session' ? 'Per Session' :
                      provider.pricing_unit === 'negotiable' ? 'Negotiable' : 'Per Service'
                    }
                  </span>
                </div>
                
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider block">Standard Marketplace Rate</span>
                    <p className="text-xs text-emerald-800 font-medium">Agreed price locked upon request acceptance</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-700">
                      {provider.price !== null && provider.price !== undefined ? `₹${provider.price}` : 'Not Set'}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-900 block uppercase">
                      {
                        provider.pricing_unit === 'per_person' ? 'Per Person' :
                        provider.pricing_unit === 'per_hour' ? 'Per Hour' :
                        provider.pricing_unit === 'per_session' ? 'Per Session' :
                        provider.pricing_unit === 'negotiable' ? 'Negotiable' : 'Per Service'
                      }
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {provider.services.map((srv, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-1">
                      <h5 className="font-bold text-sm text-zinc-900">{srv.name}</h5>
                      {srv.description && <p className="text-xs text-zinc-600 font-medium">{srv.description}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Customer Reviews Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Verified Customer Reviews</h4>
                  <span className="text-xs font-bold text-blue-900">
                    {reviewsList.length} {reviewsList.length === 1 ? 'Review' : 'Reviews'}
                  </span>
                </div>

                {reviewsList.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-medium">
                    No customer reviews submitted yet. Be the first neighbor to leave a review!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reviewsList.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-2xl border border-blue-100 bg-white shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-zinc-900">{rev.customer_name || 'Verified Customer'}</span>
                          <div className="flex items-center space-x-1 text-xs font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{rev.rating}.0</span>
                          </div>
                        </div>
                        {rev.comment && (
                          <p className="text-xs text-zinc-700 font-medium italic">"{rev.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* VIEWING CONTEXT PROTECTION */}
              {isOwnerMode ? (
                <div className="p-6 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-base">This is Your Live SilverHands Profile</h4>
                      <p className="text-xs text-blue-800">Previewing your public profile as seen by customers.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onEditMyProfile) onEditMyProfile();
                      else onClose();
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs min-w-0 flex-shrink-0 min-h-[44px]"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{t.editMyProfileBtn}</span>
                  </button>
                </div>
              ) : (
                <>
                  {!showRequestForm && (
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer min-h-[56px]"
                    >
                      <HeartHandshake className="w-6 h-6" />
                      <span>{t.requestServiceBtn} from {provider.user?.name}</span>
                    </button>
                  )}

                  {showRequestForm && bookingStep === 'input' && (
                    <form onSubmit={handleProceedToSummary} className="p-6 rounded-3xl bg-blue-50/70 border-2 border-blue-200 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                        <h4 className="font-extrabold text-blue-900 text-base flex items-center space-x-2">
                          <Send className="w-5 h-5 text-blue-600" />
                          <span>Step 1: Enter Service Request Details</span>
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">Service Title *</label>
                          <input
                            type="text"
                            required
                            value={reqTitle}
                            onChange={(e) => setReqTitle(e.target.value)}
                            placeholder="e.g. Need Dosa Live Station for Family Function"
                            className="w-full p-3 rounded-xl border border-blue-200 text-sm font-medium bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">Service Requirement Details *</label>
                          <textarea
                            rows={2}
                            required
                            value={reqDesc}
                            onChange={(e) => setReqDesc(e.target.value)}
                            placeholder="Provide details about guests, specific dishes, or special needs..."
                            className="w-full p-3 rounded-xl border border-blue-200 text-sm font-medium bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 mb-1">Requirement Quantity *</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={reqQty}
                              onChange={(e) => setReqQty(Math.max(1, parseInt(e.target.value) || 1))}
                              placeholder="e.g. 5"
                              className="w-full p-3 rounded-xl border border-blue-200 text-sm font-bold bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 mb-1">Requirement Unit *</label>
                            <input
                              type="text"
                              required
                              value={reqUnit}
                              onChange={(e) => setReqUnit(e.target.value)}
                              placeholder="e.g. people, hours, sessions, services"
                              className="w-full p-3 rounded-xl border border-blue-200 text-sm font-medium bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-extrabold text-zinc-800 mb-1.5 flex items-center space-x-1.5">
                              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span>Preferred Date *</span>
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={reqDate}
                                onChange={(e) => setReqDate(e.target.value)}
                                placeholder="Select preferred date"
                                className="w-full p-3 pl-10 rounded-xl border border-blue-200 text-sm sm:text-base font-bold bg-white text-zinc-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 min-h-[48px] cursor-pointer"
                              />
                              <Calendar className="w-5 h-5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            {reqDate ? (
                              <p className="text-xs text-blue-900 font-extrabold mt-1.5 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Selected: {formatDateDisplay(reqDate)}</span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-zinc-500 font-medium mt-1">Select preferred date (YYYY-MM-DD)</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs sm:text-sm font-extrabold text-zinc-800 mb-1.5 flex items-center space-x-1.5">
                              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span>Preferred Time *</span>
                            </label>
                            <div className="relative">
                              <select
                                required
                                value={reqTime}
                                onChange={(e) => setReqTime(e.target.value)}
                                className="w-full p-3 pl-10 rounded-xl border border-blue-200 text-sm sm:text-base font-bold bg-white text-zinc-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 min-h-[48px] cursor-pointer"
                              >
                                <option value="">-- Select preferred time --</option>
                                <option value="9:00 AM">9:00 AM</option>
                                <option value="10:00 AM">10:00 AM</option>
                                <option value="11:00 AM">11:00 AM</option>
                                <option value="12:00 PM">12:00 PM</option>
                                <option value="1:00 PM">1:00 PM</option>
                                <option value="2:00 PM">2:00 PM</option>
                                <option value="3:00 PM">3:00 PM</option>
                                <option value="4:00 PM">4:00 PM</option>
                                <option value="5:00 PM">5:00 PM</option>
                                <option value="6:00 PM">6:00 PM</option>
                                <option value="7:00 PM">7:00 PM</option>
                              </select>
                              <Clock className="w-5 h-5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">Location</label>
                          <input
                            type="text"
                            value={reqLocation}
                            onChange={(e) => setReqLocation(e.target.value)}
                            placeholder="Adyar, Chennai"
                            className="w-full p-3 rounded-xl border border-blue-200 text-sm font-medium bg-white"
                          />
                        </div>
                      </div>

                      {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowRequestForm(false)}
                          className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer min-h-[44px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md text-sm flex items-center space-x-1.5 cursor-pointer min-h-[44px]"
                        >
                          <span>Review Booking Summary</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step 2: Booking Summary Confirmation */}
                  {bookingStep === 'summary' && (
                    <div className="p-6 rounded-3xl bg-blue-50 border-2 border-blue-300 space-y-4 animate-in fade-in">
                      <h4 className="font-extrabold text-blue-900 text-base">Step 2: Confirm Your Booking Summary</h4>
                      
                      <div className="space-y-2 text-sm font-semibold text-zinc-800 bg-white p-4 rounded-2xl border border-blue-100">
                        <p><strong>Provider:</strong> {provider.user?.name}</p>
                        <p><strong>Service:</strong> {reqTitle}</p>
                        <p><strong>Date & Time:</strong> {formatDateDisplay(reqDate)}, {reqTime}</p>
                        <p><strong>Location:</strong> {reqLocation}</p>
                        <p><strong>Requirement:</strong> "{reqDesc}"</p>
                        <div className="pt-2 border-t border-blue-100 flex justify-between items-center text-emerald-900 font-extrabold text-xs">
                          <span>Service Price:</span>
                          <span className="text-emerald-950 font-black text-sm">
                            {provider.price !== null && provider.price !== undefined ? `₹${provider.price}` : 'Price not set'} / {
                              provider.pricing_unit === 'per_person' ? 'Per Person' :
                              provider.pricing_unit === 'per_hour' ? 'Per Hour' :
                              provider.pricing_unit === 'per_session' ? 'Per Session' :
                              provider.pricing_unit === 'negotiable' ? 'Negotiable' : 'Per Service'
                            }
                          </span>
                        </div>
                      </div>

                      {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setBookingStep('input')}
                          className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer min-h-[44px]"
                        >
                          Back to Edit
                        </button>
                        <button
                          type="button"
                          onClick={handleSendRequest}
                          disabled={isSubmitting}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md text-sm flex items-center space-x-2 cursor-pointer min-h-[44px]"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmitting ? 'Sending Request...' : 'CONFIRM AND SEND REQUEST'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Booking Receipt */}
                  {bookingStep === 'receipt' && (
                    <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-4 animate-in fade-in">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                        <div>
                          <h4 className="text-xl font-extrabold">Your request has been sent to {provider.user?.name}!</h4>
                          <p className="text-xs text-emerald-800 font-medium mt-0.5">The senior provider will receive your request on their dashboard.</p>
                        </div>
                      </div>

                      <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md cursor-pointer min-h-[48px]"
                      >
                        Done & Close
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
