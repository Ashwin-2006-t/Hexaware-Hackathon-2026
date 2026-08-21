import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, XCircle, Clock, MapPin, Calendar, RefreshCw, AlertCircle, Calculator, Check, Video, Phone } from 'lucide-react';
import type { ServiceRequest, RequestStatus } from '../types';
import { fetchIncomingSeniorRequests, updateRequestStatus, seniorConfirmPaymentReceivedApi } from '../services/api';
import { SeniorQuoteModal } from './SeniorQuoteModal';
import { VirtualRoomModal } from './VirtualRoomModal';
import { CallActionModal } from './CallActionModal';

import { translations, type Language } from '../i18n';

interface IncomingRequestsSectionProps {
  language?: Language;
}

export const IncomingRequestsSection: React.FC<IncomingRequestsSectionProps> = ({ language = 'en' }) => {
  const t = translations[language].incoming;
  const tc = translations[language].common;
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedQuoteReq, setSelectedQuoteReq] = useState<ServiceRequest | null>(null);
  const [activeVirtualRoomBookingId, setActiveVirtualRoomBookingId] = useState<string | null>(null);
  const [activeCallRequestId, setActiveCallRequestId] = useState<string | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchIncomingSeniorRequests();
      setRequests(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not load incoming requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdateStatus = async (requestId: string, status: RequestStatus) => {
    setUpdatingId(requestId);
    try {
      await updateRequestStatus(requestId, status);
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert(`Could not ${status.toLowerCase()} request. Please try again.`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-md space-y-6">
      
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-blue-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
              {t.title}
            </h3>
            <p className="text-xs text-zinc-500 font-semibold">
              {t.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={loadRequests}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
          title={t.refreshTooltip}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-bold text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Requests List */}
      {isLoading ? (
        <div className="py-12 text-center text-zinc-500 font-medium space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p>{tc.loading}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center bg-blue-50/40 rounded-2xl border border-dashed border-blue-200 space-y-3">
          <Clock className="w-10 h-10 text-blue-400 mx-auto" />
          <h4 className="text-lg font-bold text-zinc-800">{t.noRequestsTitle}</h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {t.noRequestsSub}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isPending = req.status === 'PENDING' || req.status === 'open';
            const isAccepted = req.status === 'ACCEPTED';
            const isDeclined = req.status === 'DECLINED';

            return (
              <div
                key={req.id}
                className="p-5 sm:p-6 rounded-2xl border border-blue-100 bg-blue-50/30 hover:border-blue-300 transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100/60 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-zinc-900 leading-snug">{req.title}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex-shrink-0 ${
                        isAccepted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        isDeclined ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 font-medium mt-1">
                      Customer: <strong className="text-zinc-900">{req.customer?.name || 'Neighbor Customer'}</strong>
                    </p>
                  </div>

                  {req.preferred_date && (
                    <div className="flex items-center space-x-1.5 text-xs text-blue-900 font-bold bg-white px-3 py-1.5 rounded-xl border border-blue-200 self-start sm:self-auto flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{req.preferred_date}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-zinc-800 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-blue-100 break-words">
                    "{req.description}"
                  </p>

                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs font-semibold">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-emerald-900 font-extrabold uppercase tracking-wider block text-[10px]">Customer Requirement</span>
                        <span className="text-emerald-950 font-black text-sm bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300">
                          {req.requirement_quantity || 1} {req.requirement_unit || 'units'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-emerald-900 font-extrabold uppercase tracking-wider block text-[10px]">Configured Base Rate</span>
                        <span className="text-emerald-950 font-bold text-xs">
                          ₹{req.agreed_price ?? 500} / {
                            req.agreed_pricing_unit === 'per_person' ? 'Per Person' :
                            req.agreed_pricing_unit === 'per_hour' ? 'Per Hour' :
                            req.agreed_pricing_unit === 'per_session' ? 'Per Session' :
                            req.agreed_pricing_unit === 'negotiable' ? 'Negotiable' : 'Per Service'
                          }
                        </span>
                      </div>
                    </div>

                    {req.quote_amount !== null && req.quote_amount !== undefined && (
                      <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-blue-900">Your Quoted Amount: ₹{req.quote_amount}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          req.quote_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          req.quote_status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          Quote: {req.quote_status || 'PENDING'}
                        </span>
                      </div>
                    )}
                  </div>

                  {req.location && (
                    <div className="flex items-center space-x-1.5 text-xs text-zinc-500 font-semibold">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="break-words">{req.location}</span>
                    </div>
                  )}
                </div>

                {/* Customer Payment Confirmation Banner for Senior */}
                {req.payment_status === 'PAYMENT_CONFIRMATION' && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                    <div className="flex items-center space-x-2 text-amber-950 font-extrabold text-xs">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <span>Customer reports payment completed ({req.payment_method?.toUpperCase() || 'UPI'}).</span>
                    </div>
                    <button
                      onClick={async () => {
                        setUpdatingId(req.id);
                        try {
                          await seniorConfirmPaymentReceivedApi(req.id);
                          await loadRequests();
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setUpdatingId(null);
                        }
                      }}
                      disabled={updatingId === req.id}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer min-h-[44px]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Payment Received</span>
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveCallRequestId(req.id)}
                    className="py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Call Customer</span>
                  </button>

                  {(isAccepted || req.status === 'COMPLETED') && req.delivery_mode !== 'IN_PERSON' && (
                    <button
                      onClick={() => setActiveVirtualRoomBookingId(req.id)}
                      className="py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-blue-300" />
                      <span>Join Virtual Tuition Class</span>
                    </button>
                  )}
                </div>

                {isPending && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 w-full">
                    <button
                      onClick={() => setSelectedQuoteReq(req)}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs min-h-[48px]"
                    >
                      <Calculator className="w-5 h-5 flex-shrink-0" />
                      <span>{req.quote_amount ? 'Review / Resend Quote' : 'Review & Send Quote'}</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(req.id, 'DECLINED')}
                      disabled={updatingId === req.id}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 disabled:bg-rose-100 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer min-h-[48px]"
                    >
                      <XCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                      <span>Decline Request</span>
                    </button>
                  </div>
                )}

                {isAccepted && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                      disabled={updatingId === req.id}
                      className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm min-h-[48px]"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Mark Service as Completed</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Virtual Room Modal */}
      {activeVirtualRoomBookingId && (
        <VirtualRoomModal
          bookingId={activeVirtualRoomBookingId}
          onClose={() => setActiveVirtualRoomBookingId(null)}
        />
      )}

      {/* Call Action Modal */}
      {activeCallRequestId && (
        <CallActionModal
          requestId={activeCallRequestId}
          onClose={() => setActiveCallRequestId(null)}
        />
      )}

      {/* Senior Quote Modal */}
      {selectedQuoteReq && (
        <SeniorQuoteModal
          language={language}
          request={selectedQuoteReq}
          onClose={() => setSelectedQuoteReq(null)}
          onQuoteSent={() => {
            setSelectedQuoteReq(null);
            loadRequests();
          }}
        />
      )}

    </div>
  );
};
