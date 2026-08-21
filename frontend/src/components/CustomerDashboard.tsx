import React, { useState, useEffect } from 'react';
import { 
  Search, Clock, Calendar, RefreshCw, AlertCircle, Star, Repeat, XCircle, 
  Heart, User, CheckCircle2, MapPin, Phone, ArrowRight, Eye, Check, IndianRupee, ShieldCheck, X, Video
} from 'lucide-react';
import type { ServiceRequest, ProviderProfile } from '../types';
import { 
  fetchMyCustomerRequests, cancelServiceRequest, fetchMySavedProvidersApi, removeSavedProviderApi, deleteMyAccountApi,
  acceptSeniorQuoteApi, rejectSeniorQuoteApi, customerConfirmPaymentApi, fetchUserProfile, saveUserRole, markProfileSetupCompleteApi
} from '../services/api';
import { CustomerMarketplace } from './CustomerMarketplace';
import { ReviewModal } from './ReviewModal';
import { VirtualRoomModal } from './VirtualRoomModal';
import { CallActionModal } from './CallActionModal';
import { getStoredLocalAuthSession } from '../services/supabase';
import { type Language } from '../i18n';

interface CustomerDashboardProps {
  language?: Language;
  activeSubTab?: 'overview' | 'find' | 'requests' | 'saved' | 'profile';
  onTabChange?: (tab: 'overview' | 'find' | 'requests' | 'saved' | 'profile') => void;
  onSelectProvider: (providerId: string) => void;
  isProfileSetupCompleted?: boolean;
  onProfileSetupCompleted?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  language = 'en',
  activeSubTab = 'overview',
  onTabChange,
  onSelectProvider,
  isProfileSetupCompleted = true,
  onProfileSetupCompleted
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'find' | 'requests' | 'saved' | 'profile'>(() => {
    return !isProfileSetupCompleted ? 'profile' : activeSubTab;
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Food & Catering']);

  useEffect(() => {
    if (!isProfileSetupCompleted) {
      setActiveTab('profile');
      if (onTabChange) onTabChange('profile');
    } else if (activeSubTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab, isProfileSetupCompleted]);

  const changeTab = (tab: 'overview' | 'find' | 'requests' | 'saved' | 'profile') => {
    if (!isProfileSetupCompleted && tab !== 'profile') {
      setActiveTab('profile');
      if (onTabChange) onTabChange('profile');
      return;
    }
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [selectedDetailReq, setSelectedDetailReq] = useState<ServiceRequest | null>(null);
  const [cancellingReq, setCancellingReq] = useState<ServiceRequest | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedReviewReq, setSelectedReviewReq] = useState<ServiceRequest | null>(null);
  const [paymentModalReq, setPaymentModalReq] = useState<ServiceRequest | null>(null);
  const [rejectingQuoteReq, setRejectingQuoteReq] = useState<ServiceRequest | null>(null);
  const [isRespondingQuote, setIsRespondingQuote] = useState(false);
  const [activeVirtualRoomBookingId, setActiveVirtualRoomBookingId] = useState<string | null>(null);
  const [activeCallRequestId, setActiveCallRequestId] = useState<string | null>(null);

  // Saved Providers State
  const [savedProviders, setSavedProviders] = useState<ProviderProfile[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Customer Profile & Account Deletion State
  const session = getStoredLocalAuthSession();
  const u = session?.user as any;
  const userPhone = session?.user?.phone || '';

  const [custName, setCustName] = useState(() => u?.name || u?.user_metadata?.full_name || '');
  const [custLocation, setCustLocation] = useState(() => u?.location || '');
  const [custLang, setCustLang] = useState<Language>(language);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeletingAccount(true);
    setDeleteAccountError(null);

    try {
      await deleteMyAccountApi();
      localStorage.clear();
      window.location.reload();
    } catch (err: any) {
      setDeleteAccountError(err.message || "Account deletion failed.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Load customer requests from DB
  const loadMyRequests = async () => {
    setIsLoadingRequests(true);
    setErrorMessage(null);
    try {
      const data = await fetchMyCustomerRequests();
      setMyRequests(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not load your service requests.");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Load saved providers from DB API
  const loadSavedProviders = async () => {
    setIsLoadingSaved(true);
    try {
      const list = await fetchMySavedProvidersApi();
      setSavedProviders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    loadMyRequests();
    if (session && session.user) {
      fetchUserProfile(session.user.id).then((p) => {
        if (p) {
          if (p.full_name && p.full_name !== 'SilverHands User') setCustName(p.full_name);
          if (p.location) setCustLocation(p.location);
        }
      }).catch((e) => console.warn('[CustomerDashboard] fetchUserProfile failed:', e));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedProviders();
    }
  }, [activeTab]);

  // Request status counts
  const pendingCount = myRequests.filter(r => r.status === 'PENDING' || r.status === 'open').length;
  const acceptedCount = myRequests.filter(r => r.status === 'ACCEPTED').length;
  const completedCount = myRequests.filter(r => r.status === 'COMPLETED').length;
  const cancelledCount = myRequests.filter(r => r.status === 'CANCELLED' || r.status === 'DECLINED').length;

  const handleConfirmCancelRequest = async () => {
    if (!cancellingReq) return;
    setIsCancelling(true);
    try {
      await cancelServiceRequest(cancellingReq.id);
      setCancellingReq(null);
      await loadMyRequests();
    } catch (err: any) {
      alert(err.message || "Could not cancel service request.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRemoveSavedProvider = async (id: string) => {
    try {
      await removeSavedProviderApi(id);
      await loadSavedProviders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCustomerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !session.user) return;
    try {
      await saveUserRole({
        userId: session.user.id,
        phone: session.user.phone || userPhone,
        role: 'CUSTOMER',
        fullName: custName,
        location: custLocation
      });
      await markProfileSetupCompleteApi();
      setProfileSuccessMsg("Customer profile saved to database successfully!");
      if (onProfileSetupCompleted) {
        onProfileSetupCompleted();
      }
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMessage("Could not save customer profile.");
    }
  };

  const filteredRequests = myRequests.filter((req) => {
    if (filterStatus === 'active') return req.status === 'PENDING' || req.status === 'ACCEPTED' || req.status === 'open';
    if (filterStatus === 'completed') return req.status === 'COMPLETED';
    if (filterStatus === 'cancelled') return req.status === 'CANCELLED' || req.status === 'DECLINED';
    return true;
  });

  return (
    <div className="space-y-6 py-2">
      
      {/* Customer Header Banner (Compact ~180-230px, Context-Only Workspace Header) */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-blue-200 border border-blue-400/30">
            <User className="w-3.5 h-3.5 text-blue-300" />
            <span>Customer Marketplace Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Find Trusted Senior Service Providers Near You
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed font-medium">
            Connect with experienced senior citizens & homemakers for authentic home cooking, tailoring, tutoring, terrace gardening, and home care.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD OVERVIEW (Default View) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Welcome & Action Cards (Navigation Actions, NOT duplicated tabs) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-xs space-y-5">
            <div>
              <h3 className="text-xl font-extrabold text-zinc-900">
                Welcome back, {custName}!
              </h3>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                Quick actions for managing your senior service requests & saved providers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => changeTab('find')}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-left hover:scale-[1.02] transition-transform shadow-sm cursor-pointer space-y-3 min-h-[110px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <span>Find a Service</span>
                  </h4>
                  <p className="text-[11px] text-blue-100 font-medium mt-0.5">Search local senior providers</p>
                </div>
              </button>

              <button
                onClick={() => changeTab('requests')}
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white text-left hover:scale-[1.02] transition-transform shadow-sm cursor-pointer space-y-3 min-h-[110px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <span>My Requests ({myRequests.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">Track active & past service requests</p>
                </div>
              </button>

              <button
                onClick={() => changeTab('saved')}
                className="p-5 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-700 text-white text-left hover:scale-[1.02] transition-transform shadow-sm cursor-pointer space-y-3 min-h-[110px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <span>Saved Providers ({savedProviders.length})</span>
                  </h4>
                  <p className="text-[11px] text-rose-100 font-medium mt-0.5">Quick access to favorite experts</p>
                </div>
              </button>

              <button
                onClick={() => changeTab('profile')}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-left hover:scale-[1.02] transition-transform shadow-sm cursor-pointer space-y-3 min-h-[110px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <span>My Profile</span>
                  </h4>
                  <p className="text-[11px] text-emerald-100 font-medium mt-0.5">Manage location & preferences</p>
                </div>
              </button>
            </div>
          </div>

          {/* REQUEST ACTIVITY SUMMARY GRID */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm space-y-4">
            <h3 className="text-xl font-extrabold text-zinc-900">
              My Request Activity Summary
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <span className="text-2xl font-black">{pendingCount}</span>
                <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Pending Requests</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                <span className="text-2xl font-black">{acceptedCount}</span>
                <p className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">Accepted Services</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                <span className="text-2xl font-black">{completedCount}</span>
                <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">Completed Services</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 space-y-1">
                <span className="text-2xl font-black">{cancelledCount}</span>
                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Cancelled / Declined</p>
              </div>
            </div>
          </div>

          {/* RECENT REQUESTS HIGHLIGHT */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-zinc-900">Recent Service Requests</h3>
              {myRequests.length > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All Requests</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {myRequests.length === 0 ? (
              <div className="py-10 text-center bg-blue-50/40 rounded-2xl border border-dashed border-blue-200 space-y-3">
                <Clock className="w-10 h-10 text-blue-400 mx-auto" />
                <h4 className="text-lg font-bold text-zinc-800">You Haven't Requested a Service Yet</h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Find verified local senior citizens for authentic cooking, catering, tailoring, and tutoring.
                </p>
                <button
                  onClick={() => setActiveTab('find')}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer min-h-[44px]"
                >
                  Find a Service Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.slice(0, 3).map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl border border-blue-100 bg-blue-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-extrabold text-zinc-900">{req.title}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                          req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          req.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          req.status === 'CANCELLED' || req.status === 'DECLINED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.provider?.user && (
                        <p className="text-xs text-blue-900 font-bold">Provider: {req.provider.user.name}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => setActiveCallRequestId(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs hover:bg-emerald-100 cursor-pointer flex items-center space-x-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Call</span>
                      </button>

                      {(req.status === 'ACCEPTED' || req.status === 'COMPLETED') && req.delivery_mode !== 'IN_PERSON' && (
                        <button
                          onClick={() => setActiveVirtualRoomBookingId(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 cursor-pointer flex items-center space-x-1"
                        >
                          <Video className="w-3.5 h-3.5 text-blue-300" />
                          <span>Class Room</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedDetailReq(req)}
                        className="px-4 py-1.5 rounded-xl border border-blue-200 text-blue-900 font-bold text-xs hover:bg-blue-50 cursor-pointer min-h-[36px]"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: FIND A SERVICE (Embedded Customer Marketplace) */}
      {/* ========================================================================= */}
      {activeTab === 'find' && (
        <div className="animate-in fade-in duration-150">
          <CustomerMarketplace
            language={language}
            onSelectProvider={onSelectProvider}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MY REQUESTS (Dedicated Tracking & History) */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-md space-y-6 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
            <div>
              <h3 className="text-2xl font-extrabold text-zinc-900">
                MY SERVICE REQUESTS
              </h3>
              <p className="text-xs text-zinc-500 font-semibold">
                Real-time status tracking for service requests submitted to senior providers
              </p>
            </div>

            <button
              onClick={loadMyRequests}
              disabled={isLoadingRequests}
              className="p-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer self-start sm:self-auto min-h-[40px]"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingRequests ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: `All Requests (${myRequests.length})` },
              { id: 'active', label: `Active (${pendingCount + acceptedCount})` },
              { id: 'completed', label: `Completed (${completedCount})` },
              { id: 'cancelled', label: `Cancelled / Declined (${cancelledCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[36px] ${
                  filterStatus === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50/60 text-blue-900 hover:bg-blue-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-bold text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoadingRequests ? (
            <div className="py-12 text-center text-zinc-500 font-medium space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p>Loading your requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center bg-blue-50/40 rounded-2xl border border-dashed border-blue-200 space-y-3">
              <Clock className="w-10 h-10 text-blue-400 mx-auto" />
              <h4 className="text-lg font-bold text-zinc-800">No service requests yet</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Find a local provider and create your first request.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRequests.map((req) => {
                const isPending = req.status === 'PENDING' || req.status === 'open';
                const isAccepted = req.status === 'ACCEPTED';
                const isCompleted = req.status === 'COMPLETED';
                const isCancelled = req.status === 'CANCELLED' || req.status === 'DECLINED';

                return (
                  <div
                    key={req.id}
                    className="p-5 sm:p-6 rounded-2xl border border-blue-100 bg-blue-50/20 hover:border-blue-300 transition-all space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-extrabold text-zinc-900">{req.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            isAccepted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            isCompleted ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            isCancelled ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                        {req.provider?.user && (
                          <p className="text-xs text-blue-900 font-bold mt-1">
                            Provider: {req.provider.user.name} ({req.provider.title || 'Senior Specialist'})
                          </p>
                        )}
                      </div>

                      {req.preferred_date && (
                        <div className="flex items-center space-x-1.5 text-xs text-blue-900 font-bold bg-white px-3 py-1.5 rounded-xl border border-blue-200 self-start sm:self-auto">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>{req.preferred_date}</span>
                        </div>
                      )}
                    </div>

                    {/* Step-by-Step Progress Timeline */}
                    <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2">
                      <p className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider">
                        Request Lifecycle Timeline
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-extrabold">
                        <div className={`p-2 rounded-lg ${isPending || isAccepted || isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          1. SENT
                        </div>
                        <div className={`p-2 rounded-lg ${isAccepted || isCompleted ? 'bg-blue-600 text-white' : isPending ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-400'}`}>
                          2. WAITING
                        </div>
                        <div className={`p-2 rounded-lg ${isAccepted || isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          3. ACCEPTED
                        </div>
                        <div className={`p-2 rounded-lg ${isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          4. COMPLETED
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-700 font-medium bg-white p-3.5 rounded-xl border border-blue-100">
                      "{req.description}"
                    </p>

                    {/* Requirement & Quote Breakdown Block */}
                    <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3 text-xs font-semibold">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2">
                        <div>
                          <span className="text-blue-900 font-extrabold uppercase tracking-wider block text-[10px]">Your Requested Requirement</span>
                          <span className="text-blue-950 font-black text-sm bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                            {req.requirement_quantity || 1} {req.requirement_unit || 'units'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-blue-900 font-extrabold uppercase tracking-wider block text-[10px]">Senior Configured Rate</span>
                          <span className="text-blue-950 font-bold text-xs">
                            ₹{req.agreed_price ?? 500} / {
                              req.agreed_pricing_unit === 'per_person' ? 'Per Person' :
                              req.agreed_pricing_unit === 'per_hour' ? 'Per Hour' :
                              req.agreed_pricing_unit === 'per_session' ? 'Per Session' :
                              req.agreed_pricing_unit === 'negotiable' ? 'Negotiable' : 'Per Service'
                            }
                          </span>
                        </div>
                      </div>

                      {/* Scenario 1: Waiting for Senior Quote */}
                      {req.status === 'PENDING' && !req.quote_amount && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-xs flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>WAITING FOR SENIOR QUOTE — Senior is reviewing your requirement details.</span>
                        </div>
                      )}

                      {/* Scenario 2: Senior Quote Received */}
                      {req.quote_amount !== null && req.quote_amount !== undefined && (
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-200">
                          <div className="flex justify-between items-center text-sm font-extrabold text-blue-950">
                            <span>Senior Final Quote:</span>
                            <span className="text-base font-black text-emerald-700">₹{req.quote_amount}</span>
                          </div>

                          {(req.quote_additional_charge || 0) > 0 && (
                            <div className="flex justify-between items-center text-xs text-zinc-600 font-medium">
                              <span>Includes Additional Charge:</span>
                              <span>+ ₹{req.quote_additional_charge}</span>
                            </div>
                          )}

                          {req.quote_note && (
                            <div className="text-xs text-blue-900 font-medium italic bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                              <strong>Senior Note:</strong> "{req.quote_note}"
                            </div>
                          )}

                          {req.quote_status === 'PENDING' && (
                            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-blue-100">
                              <button
                                onClick={async () => {
                                  setIsRespondingQuote(true);
                                  try {
                                    await acceptSeniorQuoteApi(req.id);
                                    await loadMyRequests();
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setIsRespondingQuote(false);
                                  }
                                }}
                                disabled={isRespondingQuote}
                                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer min-h-[44px]"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Accept Quote (₹{req.quote_amount})</span>
                              </button>

                              <button
                                onClick={() => setRejectingQuoteReq(req)}
                                disabled={isRespondingQuote}
                                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 disabled:bg-rose-100 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer min-h-[44px]"
                              >
                                <XCircle className="w-4 h-4 text-rose-600" />
                                <span>Reject Quote</span>
                              </button>
                            </div>
                          )}

                          {req.quote_status === 'REJECTED' && (
                            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 font-extrabold text-xs text-center">
                              Quote Rejected
                            </div>
                          )}
                        </div>
                      )}

                      {/* Scenario 3: Quote Accepted & Payment Details Exposed */}
                      {(req.quote_status === 'ACCEPTED' || isAccepted) && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 space-y-3">
                          <div className="flex items-center space-x-2 text-emerald-950 font-black text-xs">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>Quote Accepted! Completed Payment Details below:</span>
                          </div>

                          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-emerald-200 text-xs font-medium text-zinc-800">
                            <p><strong>Total Quoted Amount:</strong> ₹{req.agreed_price || req.quote_amount || 500}</p>
                            <p><strong>Payment Method:</strong> {req.payment_method?.toUpperCase() || 'UPI'}</p>
                            {req.payment_upi_id && <p><strong>UPI ID:</strong> <span className="font-mono font-bold text-emerald-800">{req.payment_upi_id}</span></p>}
                            <p><strong>Payment Instructions:</strong> "{req.payment_instructions || 'Pay after service completion'}"</p>
                          </div>

                          <p className="text-[11px] text-emerald-900 font-medium italic">
                            Online payment integration is coming soon. For this demo, SilverHands displays the Senior's payment instructions and records payment confirmation manually.
                          </p>

                          {req.payment_status === 'PAYMENT_PENDING' && (
                            <button
                              onClick={async () => {
                                try {
                                  await customerConfirmPaymentApi(req.id);
                                  await loadMyRequests();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer min-h-[44px]"
                            >
                              <IndianRupee className="w-4 h-4" />
                              <span>I Have Paid (Send Confirmation to Senior)</span>
                            </button>
                          )}

                          {req.payment_status === 'PAYMENT_CONFIRMATION' && (
                            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 font-extrabold text-xs text-center">
                              Payment confirmation sent! Waiting for Senior to confirm.
                            </div>
                          )}

                          {req.payment_status === 'PAID' && (
                            <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-black text-xs text-center flex items-center justify-center space-x-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Payment Confirmed & Service Scheduled</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => setSelectedDetailReq(req)}
                        className="px-4 py-2.5 rounded-xl border border-blue-200 text-blue-900 hover:bg-blue-50 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>View Details</span>
                      </button>

                      {isPending && (
                        <button
                          onClick={() => setCancellingReq(req)}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer min-h-[40px]"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Cancel Request</span>
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          onClick={() => setSelectedReviewReq(req)}
                          className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-extrabold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer min-h-[40px]"
                        >
                          <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                          <span>Write a Review</span>
                        </button>
                      )}

                      {(isCompleted || isAccepted || isCancelled) && req.provider_id && (
                        <button
                          onClick={() => onSelectProvider(req.provider_id!)}
                          className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 font-extrabold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer min-h-[40px]"
                        >
                          <Repeat className="w-4 h-4 text-blue-600" />
                          <span>Request Again (Rebook)</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: SAVED PROVIDERS */}
      {/* ========================================================================= */}
      {activeTab === 'saved' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-md space-y-6 animate-in fade-in duration-150">
          <div>
            <h3 className="text-2xl font-extrabold text-zinc-900">SAVED PROVIDERS</h3>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5">
              Quick access to your favorite local senior service experts
            </p>
          </div>

          {isLoadingSaved ? (
            <div className="py-12 text-center text-zinc-500 font-medium">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2">Loading saved providers...</p>
            </div>
          ) : savedProviders.length === 0 ? (
            <div className="py-12 text-center bg-rose-50/30 rounded-2xl border border-dashed border-rose-200 space-y-3">
              <Heart className="w-10 h-10 text-rose-400 mx-auto" />
              <h4 className="text-lg font-bold text-zinc-800">No Saved Providers Yet</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                While searching providers, click "♡ Save Provider" on any senior profile to add them here!
              </p>
              <button
                onClick={() => setActiveTab('find')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer min-h-[44px]"
              >
                Find a Service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedProviders.map((p) => (
                <div key={p.id} className="p-6 rounded-2xl border border-blue-100 bg-blue-50/20 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-extrabold text-zinc-900">{p.user?.name}</h4>
                      <p className="text-xs font-bold text-blue-800">{p.title}</p>
                      <p className="text-xs text-zinc-500 flex items-center mt-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1" />
                        {p.user?.location}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveSavedProvider(p.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove from saved"
                    >
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-600" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {p.skills.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-blue-100 text-xs font-bold text-blue-900">
                        {s.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => onSelectProvider(p.id)}
                      className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer min-h-[44px]"
                    >
                      View Profile & Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: MY PROFILE (Customer Profile Settings / Setup Onboarding) */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-md max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
          
          {!isProfileSetupCompleted && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-md space-y-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <h4 className="font-black text-base">Complete Your Customer Profile Setup</h4>
              </div>
              <p className="text-xs text-blue-100 font-medium leading-relaxed">
                Welcome to SilverHands! To discover and connect with local senior citizens & homemakers offering home cooking, catering, tailoring, and tutoring near you, please complete your profile setup.
              </p>
            </div>
          )}

          <div>
            <h3 className="text-2xl font-extrabold text-zinc-900">
              {isProfileSetupCompleted ? 'MY CUSTOMER PROFILE' : 'CUSTOMER PROFILE SETUP'}
            </h3>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5">
              Manage your customer contact details and delivery location
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveCustomerProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full p-4 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                Verified Phone Number (SMS Auth)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={userPhone}
                  className="w-full p-4 pl-11 rounded-2xl border-2 border-zinc-200 bg-zinc-100 text-base font-bold text-zinc-600"
                />
                <Phone className="w-5 h-5 text-zinc-400 absolute left-4 top-4" />
              </div>
              <p className="text-[11px] text-zinc-500 font-medium mt-1">Verified via Supabase SMS OTP Login</p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                Delivery & Service Location / Area <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={custLocation}
                  onChange={(e) => setCustLocation(e.target.value)}
                  placeholder="e.g., Mylapore, Chennai"
                  className="w-full p-4 pl-11 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900"
                />
                <MapPin className="w-5 h-5 text-blue-600 absolute left-4 top-4" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-2">
                Preferred Service Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Food & Catering',
                  'Traditional Sweets',
                  'Tailoring & Stitching',
                  'Education & Tutoring',
                  'Terrace Gardening',
                  'Elderly Assistance'
                ].map((cat) => {
                  const isSel = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          setSelectedCategories(selectedCategories.filter(c => c !== cat));
                        } else {
                          setSelectedCategories([...selectedCategories, cat]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-xs font-extrabold text-left transition-all cursor-pointer flex items-center justify-between min-h-[44px] ${
                        isSel
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                          : 'bg-slate-50 border-zinc-200 text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <span>{cat}</span>
                      {isSel && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                Preferred Interface Language
              </label>
              <div className="flex gap-3">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'ta', label: 'தமிழ்' },
                  { id: 'hi', label: 'हिंदी' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setCustLang(l.id as any)}
                    className={`flex-1 py-3 rounded-xl font-extrabold text-xs border cursor-pointer min-h-[44px] ${
                      custLang === l.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-zinc-800 border-zinc-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base transition-all shadow-md cursor-pointer min-h-[50px]"
            >
              Save Customer Profile
            </button>
          </form>

          {/* Danger Zone: Account Deletion */}
          <div className="pt-6 border-t border-rose-200 space-y-4">
            <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-200 space-y-3">
              <div className="flex items-center space-x-2 text-rose-900 font-extrabold">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Danger Zone</span>
              </div>
              <p className="text-xs text-rose-800 font-medium leading-relaxed">
                Deleting your account will permanently remove your SilverHands account, saved providers, and customer request history.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(true)}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REQUEST DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedDetailReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-100 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedDetailReq(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="space-y-1">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block ${
                selectedDetailReq.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                selectedDetailReq.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                selectedDetailReq.status === 'CANCELLED' || selectedDetailReq.status === 'DECLINED' ? 'bg-rose-100 text-rose-800' :
                'bg-amber-100 text-amber-900'
              }`}>
                {selectedDetailReq.status}
              </span>
              <h3 className="text-2xl font-extrabold text-zinc-900">{selectedDetailReq.title}</h3>
            </div>

            <div className="space-y-4 text-sm font-medium text-zinc-800 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
              {selectedDetailReq.provider?.user && (
                <p><strong>Provider:</strong> {selectedDetailReq.provider.user.name} ({selectedDetailReq.provider.title})</p>
              )}
              <p><strong>Location:</strong> {selectedDetailReq.location || 'Chennai'}</p>
              <p><strong>Preferred Date:</strong> {selectedDetailReq.preferred_date || 'As agreed'}</p>
              <p><strong>Requirement Details:</strong> "{selectedDetailReq.description}"</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2">
              <p className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider">
                Progress Timeline
              </p>
              <div className="space-y-2 text-xs font-bold">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>1. Service Request Sent</span>
                </div>
                {selectedDetailReq.status === 'PENDING' && (
                  <div className="flex items-center space-x-2 text-amber-700">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>2. Waiting for Senior Provider Acceptance</span>
                  </div>
                )}
                {(selectedDetailReq.status === 'ACCEPTED' || selectedDetailReq.status === 'COMPLETED') && (
                  <div className="flex items-center space-x-2 text-emerald-700">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>2. Provider Accepted & Service Scheduled</span>
                  </div>
                )}
                {selectedDetailReq.status === 'COMPLETED' && (
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>3. Service Completed</span>
                  </div>
                )}
                {(selectedDetailReq.status === 'CANCELLED' || selectedDetailReq.status === 'DECLINED') && (
                  <div className="flex items-center space-x-2 text-rose-700">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Request {selectedDetailReq.status}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedDetailReq(null)}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-extrabold text-sm hover:bg-blue-700 cursor-pointer min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CANCELLATION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cancellingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-100 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900">Cancel Service Request?</h3>
              <p className="text-xs text-zinc-600 font-medium">
                Are you sure you want to cancel your request for <strong>"{cancellingReq.title}"</strong>?
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setCancellingReq(null)}
                disabled={isCancelling}
                className="flex-1 py-3.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 cursor-pointer min-h-[48px]"
              >
                Keep Request
              </button>

              <button
                onClick={handleConfirmCancelRequest}
                disabled={isCancelling}
                className="flex-1 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-extrabold text-sm transition-all cursor-pointer min-h-[48px]"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REVIEW SUBMISSION MODAL */}
      {/* ========================================================================= */}
      {selectedReviewReq && (
        <ReviewModal
          requestId={selectedReviewReq.id}
          providerName={selectedReviewReq.provider?.user?.name || 'Senior Specialist'}
          serviceTitle={selectedReviewReq.title}
          onClose={() => setSelectedReviewReq(null)}
          onReviewSubmitted={() => {
            loadMyRequests();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ACCOUNT DELETION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900">Delete SilverHands Account?</h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Deleting your account will permanently remove your SilverHands account, saved providers, and customer request history.
              </p>
            </div>

            {deleteAccountError && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-950 font-bold text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{deleteAccountError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDeleteAccount} className="space-y-4">
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setDeleteAccountError(null);
                  }}
                  disabled={isDeletingAccount}
                  className="flex-1 py-3.5 rounded-xl border border-zinc-200 text-zinc-700 font-extrabold text-xs hover:bg-zinc-50 cursor-pointer min-h-[48px]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDeletingAccount}
                  className="flex-1 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer min-h-[48px]"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PAYMENT PENDING PLACEHOLDER MODAL (NO REAL PAYMENT GATEWAY) */}
      {/* ========================================================================= */}
      {paymentModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200 space-y-6 relative">
            
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">Service Confirmed</h3>
                  <p className="text-xs text-emerald-800 font-medium">Payment status for confirmed request</p>
                </div>
              </div>

              <button
                onClick={() => setPaymentModalReq(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-xs font-semibold">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                <span className="text-zinc-600">Service Request:</span>
                <span className="font-extrabold text-zinc-900">{paymentModalReq.title}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                <span className="text-zinc-600">Agreed Amount Due:</span>
                <span className="font-black text-emerald-800 text-base">₹{paymentModalReq.agreed_price ?? 500}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600">Payment Status:</span>
                <span className="font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  PAYMENT PENDING
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-2 text-xs font-medium">
              <div className="flex items-center space-x-2 font-extrabold text-blue-900">
                <IndianRupee className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Online Payment Gateway Coming Soon</span>
              </div>
              <p className="leading-relaxed">
                SilverHands online UPI / card payments architecture is payment-ready! No real payment gateway is connected right now and no money has been charged.
              </p>
            </div>

            <button
              onClick={() => setPaymentModalReq(null)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer min-h-[44px]"
            >
              Understand & Close
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: QUOTE REJECTION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {rejectingQuoteReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-200 space-y-6 relative">
            <div className="space-y-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900">Reject Senior Quote?</h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Are you sure you want to reject the quote of <strong>₹{rejectingQuoteReq.quote_amount}</strong> for "{rejectingQuoteReq.title}"? The request will stop progressing.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingQuoteReq(null)}
                disabled={isRespondingQuote}
                className="flex-1 py-3.5 rounded-xl border border-zinc-200 text-zinc-700 font-extrabold text-xs hover:bg-zinc-50 cursor-pointer min-h-[48px]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsRespondingQuote(true);
                  try {
                    await rejectSeniorQuoteApi(rejectingQuoteReq.id);
                    setRejectingQuoteReq(null);
                    await loadMyRequests();
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsRespondingQuote(false);
                  }
                }}
                disabled={isRespondingQuote}
                className="flex-1 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer min-h-[48px]"
              >
                {isRespondingQuote ? 'Rejecting...' : 'Yes, Reject Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Virtual Tuition Room Modal */}
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

    </div>
  );
};
