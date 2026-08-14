import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Clock, CheckCircle2, HeartHandshake, Send, AlertCircle } from 'lucide-react';
import type { ProviderProfile } from '../types';
import { fetchProviderById, createServiceRequest } from '../services/api';

interface ProviderDetailModalProps {
  providerId: string | null;
  onClose: () => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({ providerId, onClose }) => {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqDate, setReqDate] = useState('');
  const [reqCustName, setReqCustName] = useState('');
  const [reqCustEmail, setReqCustEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    fetchProviderById(providerId)
      .then((data) => setProvider(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [providerId]);

  if (!providerId) return null;

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle || !reqDesc) {
      setErrorMsg("Please provide a service title and description.");
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await createServiceRequest({
        customer_name: reqCustName || 'Neighbor Customer',
        customer_email: reqCustEmail || 'neighbor@example.com',
        title: reqTitle,
        description: reqDesc,
        category: provider?.skills[0]?.category || 'General',
        location: provider?.user?.location || 'Chennai',
        preferred_date: reqDate
      });
      setRequestSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !provider ? (
          <div className="p-12 text-center text-zinc-500 font-bold">Loading provider profile...</div>
        ) : (
          <div className="space-y-6">
            
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-8 text-white rounded-t-3xl space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-2xl bg-white text-amber-600 font-black text-3xl flex items-center justify-center shadow-lg flex-shrink-0">
                  {provider.user?.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-3xl font-extrabold">{provider.user?.name}</h3>
                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                  <p className="text-amber-100 text-lg font-bold">{provider.title}</p>
                  
                  <div className="flex items-center space-x-4 text-xs font-bold text-amber-100 pt-1">
                    <span className="flex items-center bg-white/20 px-2 py-1 rounded-md">
                      <Star className="w-3.5 h-3.5 text-amber-200 fill-amber-200 mr-1" />
                      {provider.rating} ({provider.total_reviews} reviews)
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-amber-200" />
                      {provider.user?.location}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-amber-200" />
                      {provider.experience_years}+ Years Experience
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Bio Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">About Provider</h4>
                <p className="text-base text-zinc-800 leading-relaxed font-medium">
                  {provider.bio}
                </p>
              </div>

              {/* Skills Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Specialized Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {provider.skills.map((sk, i) => (
                    <div key={i} className="bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      <span>{sk.name}</span>
                      <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">({sk.proficiency})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Offerings */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Concrete Service Offerings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {provider.services.map((srv, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-sm text-zinc-900">{srv.name}</h5>
                        {srv.price_range && (
                          <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {srv.price_range}
                          </span>
                        )}
                      </div>
                      {srv.description && (
                        <p className="text-xs text-zinc-600 leading-normal">{srv.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Request Section */}
              {!showRequestForm ? (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/20 text-base flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
                  >
                    <HeartHandshake className="w-5 h-5" />
                    <span>Request Service from {provider.user?.name.split(' ')[0]}</span>
                  </button>
                </div>
              ) : !requestSuccess ? (
                <form onSubmit={handleSendRequest} className="bg-amber-50/60 p-6 rounded-2xl border-2 border-amber-200 space-y-4 pt-4 animate-in fade-in duration-200">
                  <h4 className="text-lg font-extrabold text-zinc-900 flex items-center space-x-2">
                    <Send className="w-5 h-5 text-amber-600" />
                    <span>Send Service Request to {provider.user?.name}</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Request Title *</label>
                      <input
                        type="text"
                        required
                        value={reqTitle}
                        onChange={(e) => setReqTitle(e.target.value)}
                        placeholder={`e.g. Order for traditional sweets for family gathering`}
                        className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Details & Special Instructions *</label>
                      <textarea
                        rows={3}
                        required
                        value={reqDesc}
                        onChange={(e) => setReqDesc(e.target.value)}
                        placeholder="Please describe quantity, date, or specific preferences..."
                        className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Preferred Date</label>
                        <input
                          type="text"
                          value={reqDate}
                          onChange={(e) => setReqDate(e.target.value)}
                          placeholder="e.g. Next Saturday"
                          className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          value={reqCustName}
                          onChange={(e) => setReqCustName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Your Email</label>
                        <input
                          type="email"
                          value={reqCustEmail}
                          onChange={(e) => setReqCustEmail(e.target.value)}
                          placeholder="Email Address"
                          className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-medium"
                        />
                      </div>
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
                      className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md text-sm cursor-pointer"
                    >
                      {isSubmitting ? 'Sending Request...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-base font-bold flex items-center space-x-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold">Service Request Sent Successfully!</p>
                    <p className="text-xs font-normal text-emerald-800 mt-1">
                      {provider.user?.name} has been notified and will contact you directly.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
