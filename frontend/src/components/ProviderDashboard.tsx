import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, UserCheck, RefreshCw, Send, AlertCircle, Edit3, Eye, EyeOff, Bell, PlusCircle, ShieldCheck, Calendar, Clock, Trash2, Plus, X, MapPin, TrendingUp, Lightbulb, Mic } from 'lucide-react';
import { analyzeSkills, generateProfile, registerProvider, fetchIncomingSeniorRequests, updatePublishingStatus, deleteMyAccountApi, markProfileSetupCompleteApi, fetchSeniorDashboardStatsApi, incrementalUpdateProfileApi, fetchMyOpportunitiesApi, fetchMyProviderProfile, updateMyLocationApi, type SeniorDashboardStats } from '../services/api';
import { getStoredLocalAuthSession } from '../services/supabase';
import type { SkillAnalysisResult, ProfileGenerationResult, ProviderProfile, ProfileStatus, SeniorOpportunitiesResponse } from '../types';
import { VoiceInputButton } from './VoiceInputButton';
import { LocationPicker } from './LocationPicker';
import { ProfileCompletion } from './ProfileCompletion';
import { OpportunitySuggestions } from './OpportunitySuggestions';
import { ProfileUpdateSection } from './ProfileUpdateSection';
import { IncomingRequestsSection } from './IncomingRequestsSection';
import { AIInterviewRoom } from './AIInterviewRoom';
import { translations, type Language } from '../i18n';

interface ProviderDashboardProps {
  language?: Language;
  activeSubTab?: 'create' | 'update' | 'requests' | 'profile';
  onTabChange?: (tab: 'create' | 'update' | 'requests' | 'profile') => void;
  onProfileCreated?: (profile: ProviderProfile) => void;
  onPreviewProfile?: (providerId: string) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  language = 'en',
  activeSubTab = 'create',
  onTabChange,
  onProfileCreated,
  onPreviewProfile
}) => {
  const t = translations[language].provider;
  const [activeTab, setActiveTab] = useState<'create' | 'update' | 'requests' | 'profile'>(activeSubTab);
  const [showAiInterviewModal, setShowAiInterviewModal] = useState(false);
  const [aiInterviewMode, setAiInterviewMode] = useState<'REGISTRATION' | 'UPDATE'>('REGISTRATION');

  useEffect(() => {
    if (activeSubTab) setActiveTab(activeSubTab);
  }, [activeSubTab]);

  const changeTab = (tab: 'create' | 'update' | 'requests' | 'profile') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SkillAnalysisResult | null>(null);
  const [profileResult, setProfileResult] = useState<ProfileGenerationResult | null>(null);
  const [stepConfirmed, setStepConfirmed] = useState(false);

  // AI Add Skill Modal State
  const [showAddSkillAiModal, setShowAddSkillAiModal] = useState(false);
  const [aiAddSkillText, setAiAddSkillText] = useState('');
  const [isAnalyzingNewSkills, setIsAnalyzingNewSkills] = useState(false);
  const [proposedNewSkills, setProposedNewSkills] = useState<string[]>([]);
  const [manualAddSkillText, setManualAddSkillText] = useState('');

  // Unselected category-specific progressive profiling state (ALL initially empty!)
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedServicesOffered, setSelectedServicesOffered] = useState<string[]>([]);
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<string>('');
  const [selectedTeachingMode, setSelectedTeachingMode] = useState<string>('');

  // Form registration state — start strictly clean/empty unless from authenticated user session or DB!
  const [providerName, setProviderName] = useState(() => {
    const s = getStoredLocalAuthSession();
    const u = s?.user as any;
    return u?.user_metadata?.full_name || u?.name || '';
  });
  const [providerEmail, setProviderEmail] = useState(() => {
    const s = getStoredLocalAuthSession();
    const u = s?.user as any;
    return u?.email || '';
  });
  const [providerLocation, setProviderLocation] = useState(() => {
    const s = getStoredLocalAuthSession();
    const u = s?.user as any;
    return u?.location || '';
  });
  const [providerBio, setProviderBio] = useState('');
  const [providerLanguages, setProviderLanguages] = useState('Tamil, English');
  const [serviceDeliveryMode, setServiceDeliveryMode] = useState<'IN_PERSON' | 'ONLINE' | 'BOTH'>('BOTH');

  const [activeProfile, setActiveProfile] = useState<ProviderProfile | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const [dashboardStats, setDashboardStats] = useState<SeniorDashboardStats | null>(null);
  const [opportunitiesData, setOpportunitiesData] = useState<SeniorOpportunitiesResponse | null>(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [pendingSuggestedService, setPendingSuggestedService] = useState<string | null>(null);

  const loadOpportunities = async () => {
    try {
      const opps = await fetchMyOpportunitiesApi();
      setOpportunitiesData(opps);
    } catch (err) {
      console.warn('[ProviderDashboard] Could not fetch opportunities:', err);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats = await fetchSeniorDashboardStatsApi();
      setDashboardStats(stats);
      setPendingRequestsCount(stats.pending_requests_count);
      await loadOpportunities();
    } catch (err) {
      console.warn('[ProviderDashboard] Could not fetch senior dashboard stats:', err);
    }
  };

  const handleAddSuggestedService = (serviceName: string) => {
    setPendingSuggestedService(serviceName);
    changeTab('profile');
  };

  const handleIncrementalUpdate = async (data: {
    add_skills?: string[];
    remove_skills?: string[];
    add_services?: string[];
    remove_services?: string[];
    update_fields?: Record<string, any>;
  }) => {
    try {
      const updated = await incrementalUpdateProfileApi(data);
      setActiveProfile(updated);
      await loadDashboardStats();
    } catch (err) {
      console.error('[ProviderDashboard] Incremental update error:', err);
    }
  };

  const handleOpenAddSkillModal = () => {
    if (activeProfile) {
      setShowAddSkillAiModal(true);
      setAiAddSkillText('');
      setProposedNewSkills([]);
      setManualAddSkillText('');
    } else {
      changeTab('create');
    }
  };

  const handleAnalyzeNewSkillsAi = async () => {
    if (!aiAddSkillText || !aiAddSkillText.trim()) return;
    setIsAnalyzingNewSkills(true);
    try {
      const res = await analyzeSkills(aiAddSkillText.trim());
      if (res && res.skills && res.skills.length > 0) {
        const existingSkillNames = (activeProfile?.skills || []).map(s => s.name.toLowerCase());
        const newExtracted = res.skills.filter(s => !existingSkillNames.includes(s.toLowerCase()));
        setProposedNewSkills(listUnique([...proposedNewSkills, ...newExtracted]));
      } else {
        alert("No clear new skills detected from the input. You can add skills manually below.");
      }
    } catch (e) {
      console.error(e);
      alert("Could not analyze skills with AI. You can add skills manually below.");
    } finally {
      setIsAnalyzingNewSkills(false);
    }
  };

  const handleConfirmAddProposedSkills = async () => {
    if (proposedNewSkills.length === 0) {
      alert("No new skills selected to add.");
      return;
    }
    setIsSaving(true);
    try {
      await handleIncrementalUpdate({ add_skills: proposedNewSkills });
      setSaveSuccess(`Added ${proposedNewSkills.length} new skill${proposedNewSkills.length > 1 ? 's' : ''} to your SilverHands profile!`);
      setShowAddSkillAiModal(false);
      setProposedNewSkills([]);
      setAiAddSkillText('');
      changeTab('profile');
    } catch (err) {
      alert("Could not add proposed skills.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const session = getStoredLocalAuthSession();
    if (session && session.user) {
      fetchMyProviderProfile(session.user.id).then(prof => {
        if (prof) {
          setActiveProfile(prof);
          if (prof.user?.name) setProviderName(prof.user.name);
          if (prof.user?.email) setProviderEmail(prof.user.email);
          if (prof.user?.location) setProviderLocation(prof.user.location);
          if (prof.bio) setProviderBio(prof.bio);
          if (prof.languages) setProviderLanguages(prof.languages);
        }
      }).catch(err => console.warn('[ProviderDashboard] fetchMyProviderProfile failed:', err));
    }
    loadDashboardStats();
    fetchIncomingSeniorRequests().then((reqs) => {
      const pending = reqs.filter(r => r.status === 'PENDING' || r.status === 'open').length;
      setPendingRequestsCount(pending);
    }).catch(() => {});
  }, [activeTab]);

  const handleToggleStatus = async (newStatus: ProfileStatus) => {
    if (!activeProfile) return;
    try {
      const updated = await updatePublishingStatus(activeProfile.id, newStatus);
      setActiveProfile(updated);
    } catch (e) {
      alert("Could not update publishing status.");
    }
  };

  const samplePrompts = [
    "I have been making traditional Tamil sweets for 20 years. I prepare murukku, adhirasam and seedai from home.",
    "I make dosa, chapati, chicken gravy and chicken biryani for family functions.",
    "I am good in Hindi and ready to teach children till age 16.",
    "I do custom saree blouse stitching, Aari hand embroidery work, and garment alterations in T. Nagar.",
    "I set up rooftop terrace vegetable gardens, organic soil prep, and balcony plant care."
  ];

  const toggleSelection = (item: string, currentList: string[], setList: (val: string[]) => void) => {
    if (currentList.includes(item)) {
      setList(currentList.filter((i) => i !== item));
    } else {
      setList([...currentList, item]);
    }
  };

  const handleAnalyzeSkills = async () => {
    if (!description.trim()) {
      setErrorMessage("Please type or tap the voice button to describe your skills first.");
      return;
    }
    setErrorMessage(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeSkills(description);
      setAnalysisResult(result);

      const prof = await generateProfile({
        skills: result.skills,
        experience_years: result.experience_years,
        services: result.services
      });
      setProfileResult(prof);
      setStepConfirmed(false);
      setSelectedItems([]);
      setSelectedServicesOffered([]);
      setSelectedWorkLocation('');
      setSelectedTeachingMode('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Skill analysis encountered an issue. Using fallback extraction.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim() || !providerEmail.trim()) {
      setErrorMessage("Please enter your Full Name and Email to publish your profile.");
      return;
    }
    if (!analysisResult) return;

    setIsSaving(true);
    setErrorMessage(null);

    let finalServices = [...analysisResult.services];
    if (selectedItems.length > 0) {
      finalServices.push(`Items: ${selectedItems.join(', ')}`);
    }
    if (selectedServicesOffered.length > 0) {
      finalServices.push(`Offerings: ${selectedServicesOffered.join(', ')}`);
    }
    if (selectedWorkLocation) {
      finalServices.push(`Service Location: ${selectedWorkLocation}`);
    }
    if (selectedTeachingMode) {
      finalServices.push(`Mode: ${selectedTeachingMode}`);
    }

    try {
      const expYears = (analysisResult.experience_years !== null && analysisResult.experience_years !== undefined)
        ? analysisResult.experience_years
        : undefined;

      const savedProfile = await registerProvider({
        name: providerName,
        email: providerEmail,
        location: providerLocation,
        latitude: 13.0339,
        longitude: 80.2687,
        title: profileResult?.suggested_title || analysisResult.suggested_title,
        bio: providerBio || profileResult?.bio || `Provider offering authentic services on SilverHands.`,
        experience_years: expYears,
        languages: providerLanguages,
        target_age_group: analysisResult.target_age_group || undefined,
        availability: undefined,
        service_delivery_mode: serviceDeliveryMode,
        skills: analysisResult.skills,
        services: listUnique(finalServices)
      });

      setActiveProfile(savedProfile);
      setSaveSuccess(t.successTitle);
      try {
        await markProfileSetupCompleteApi();
      } catch (e) {
        console.warn('[ProviderDashboard] Non-critical profile setup completion mark:', e);
      }
      if (onProfileCreated) onProfileCreated(savedProfile);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not save profile. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  function listUnique(arr: string[]): string[] {
    return Array.from(new Set(arr));
  }

  const handleAddOpportunityService = (serviceName: string) => {
    if (activeProfile) {
      const updatedServices = [...activeProfile.services.map(s => s.name), serviceName];
      setActiveProfile({
        ...activeProfile,
        services: updatedServices.map(s => ({ name: s }))
      });
      alert(`Added "${serviceName}" to your active services list! Click "My Services" tab to save changes.`);
    } else if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        services: listUnique([...analysisResult.services, serviceName])
      });
    }
  };

  const cat = analysisResult?.category || '';

  const previewServices = listUnique([
    ...(analysisResult?.services || []),
    ...(selectedItems.length > 0 ? [`Items: ${selectedItems.join(', ')}`] : []),
    ...(selectedServicesOffered.length > 0 ? [`Offerings: ${selectedServicesOffered.join(', ')}`] : []),
    ...(selectedWorkLocation ? [`Service Location: ${selectedWorkLocation}`] : []),
    ...(selectedTeachingMode ? [`Mode: ${selectedTeachingMode}`] : [])
  ]);

  return (
    <div className="space-y-6 py-2">
      
      {/* SENIOR DASHBOARD: Work & Activity Overview Only */}
      {activeTab === 'update' && (
        <>
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-blue-200 border border-blue-400/30">
                <UserCheck className="w-3.5 h-3.5 text-blue-300" />
                <span>Senior Provider Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Senior Citizen Livelihood Dashboard
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed font-medium">
                Share your skills, receive local customer requests, and manage your SilverHands service activity.
              </p>
            </div>

            <button
              onClick={handleOpenAddSkillModal}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center space-x-2 min-h-[44px] min-w-0 flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>+ Add New Skill Profile</span>
            </button>
          </div>

          {/* 4 Live Database KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm space-y-1">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">New Requests</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-amber-700">
                  {dashboardStats ? dashboardStats.pending_requests_count : pendingRequestsCount}
                </span>
                <span className="text-sm font-bold text-slate-700">pending</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm space-y-1">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Upcoming Services</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-blue-700">
                  {dashboardStats ? dashboardStats.upcoming_services_count : 0}
                </span>
                <span className="text-sm font-bold text-slate-700">scheduled</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm space-y-1">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Completed Services</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-emerald-700">
                  {dashboardStats ? dashboardStats.completed_services_count : 0}
                </span>
                <span className="text-sm font-bold text-slate-700">completed</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm space-y-1">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Overall Rating</span>
              <div className="flex items-baseline space-x-2">
                {dashboardStats?.rating ? (
                  <>
                    <span className="text-3xl font-black text-amber-600">{dashboardStats.rating} ★</span>
                    <span className="text-sm font-bold text-slate-700">({dashboardStats.total_reviews})</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-slate-700 italic mt-2">No reviews yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Pending Requests Alert Banner */}
          {pendingRequestsCount > 0 && (
            <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-extrabold flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md animate-in fade-in">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-amber-950">
                    YOU HAVE {pendingRequestsCount} NEW CUSTOMER REQUEST{pendingRequestsCount > 1 ? 'S' : ''}!
                  </h3>
                  <p className="text-xs text-amber-900 font-bold mt-0.5">
                    Local neighbors are requesting your services. Click below to view and respond.
                  </p>
                </div>
              </div>
              <button
                onClick={() => changeTab('requests')}
                className="py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-all shadow-md cursor-pointer min-h-[48px] whitespace-nowrap"
              >
                VIEW REQUESTS NOW
              </button>
            </div>
          )}

          {/* AI Skill Interview Room Action Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-700/50">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center font-black text-2xl flex-shrink-0 border border-white/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                    Interactive AI Tool
                  </span>
                  <span className="text-xs font-bold text-indigo-200">Voice & Text Enabled</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Take the AI Skill Interview
                </h3>
                <p className="text-xs text-indigo-100 font-semibold max-w-lg">
                  Answer 3-5 conversational questions about your practical expertise. AI extracts your verified skills and services for human approval.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAiInterviewModal(true)}
              className="py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center space-x-2 whitespace-nowrap self-start sm:self-auto min-h-[48px]"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>START AI INTERVIEW NOW</span>
            </button>
          </div>

          {/* Live Upcoming Services Section */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-zinc-900">Upcoming Scheduled Services</h3>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                {dashboardStats?.upcoming_services.length || 0} scheduled
              </span>
            </div>

            {dashboardStats?.upcoming_services && dashboardStats.upcoming_services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardStats.upcoming_services.map((service) => (
                  <div key={service.id} className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-zinc-900">{service.title}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                        ACCEPTED
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-600 space-y-1">
                      <p className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Customer: {service.customer_name}</span>
                      </p>
                      {service.customer_location && (
                        <p className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>Location: {service.customer_location}</span>
                        </p>
                      )}
                      {service.preferred_date && (
                        <p className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Date: {service.preferred_date}</span>
                        </p>
                      )}
                      <div className="pt-1 flex items-center justify-between border-t border-blue-100 text-xs font-bold text-emerald-900">
                        <span>Agreed Amount: {service.agreed_price !== null && service.agreed_price !== undefined ? `₹${service.agreed_price}` : 'Pending Quote'}</span>
                        <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-300">
                          Payment: {service.payment_status || 'Payment Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-500 space-y-2 bg-slate-50/60 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-xs font-extrabold text-zinc-600">No upcoming services scheduled</p>
                <button
                  onClick={() => changeTab('requests')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  View Incoming Requests
                </button>
              </div>
            )}
          </div>

          {/* Live Recent Customer Reviews Section */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-zinc-900">Recent Customer Reviews</h3>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                {dashboardStats?.total_reviews || 0} reviews
              </span>
            </div>

            {dashboardStats?.recent_reviews && dashboardStats.recent_reviews.length > 0 ? (
              <div className="space-y-3">
                {dashboardStats.recent_reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-zinc-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-500 font-extrabold text-sm">
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)} ({rev.rating}.0)
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-400">
                        {rev.customer_name}
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="text-xs font-medium text-zinc-800 italic">"{rev.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs font-extrabold bg-slate-50/60 rounded-2xl border border-dashed border-zinc-200">
                No customer reviews yet.
              </div>
            )}
          </div>

          {/* AI-Assisted Opportunity Discovery Section (Shown ONLY when Senior has low/no request activity) */}
          {opportunitiesData && opportunitiesData.has_low_request_activity && opportunitiesData.suggestions.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-3xl p-6 border-2 border-blue-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Lightbulb className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-blue-950 tracking-tight">Opportunities for You</h3>
                    <p className="text-xs text-blue-800 font-medium">
                      No new requests right now. Here are some opportunities based on your skills and local activity to help you reach more customers.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold bg-blue-200/70 text-blue-900 px-3 py-1 rounded-full border border-blue-300 self-start sm:self-auto">
                  Proactive Discovery
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {opportunitiesData.suggestions.map((opp) => (
                  <div key={opp.id} className="bg-white rounded-2xl p-5 border-2 border-blue-100 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-base text-zinc-900 leading-snug">{opp.title}</h4>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex-shrink-0 flex items-center space-x-1 border ${
                          opp.type === 'REAL_DEMAND'
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                            : 'bg-blue-50 text-blue-950 border-blue-300'
                        }`}>
                          {opp.type === 'REAL_DEMAND' ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-700 mr-1 inline" />
                              <span>{opp.badge_label}</span>
                            </>
                          ) : (
                            <>
                              <Lightbulb className="w-3 h-3 text-blue-700 mr-1 inline" />
                              <span>{opp.badge_label}</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                        <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                          🔥 {opp.demand_count || 3} customer requests in your area
                        </span>
                        <span className="bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200">
                          ⚡ Skill Match: {opp.match_score || 85}%
                        </span>
                        <span className="bg-blue-50 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200">
                          💰 Est. Earning: ₹{(opp.estimated_earning || 2500).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-zinc-700 leading-relaxed">{opp.reason}</p>

                      {opp.matched_skills && opp.matched_skills.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">Matches Your Skills:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {opp.matched_skills.map((sk, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-200">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddSuggestedService(opp.suggested_service_name)}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer border border-blue-500"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add This Service</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-bold text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-6 rounded-3xl bg-blue-50 border-2 border-blue-200 text-blue-950 font-extrabold text-base flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <span>{saveSuccess}</span>
              <p className="text-xs text-blue-700 font-medium mt-1">Neighbors in your area can now discover your services!</p>
            </div>
          </div>
          {activeProfile && onPreviewProfile && (
            <button
              onClick={() => onPreviewProfile(activeProfile.id)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap min-h-[44px]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Preview Live Profile</span>
            </button>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                1
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900">{t.step1Title}</h3>
                <p className="text-xs text-zinc-500 font-medium">{t.step1Subtitle}</p>
              </div>
            </div>

            {/* Location Detection Section */}
            <LocationPicker
              initialLocation={providerLocation}
              onLocationDetected={(locData) => {
                setProviderLocation(locData.readable_address);
                updateMyLocationApi({
                  latitude: locData.latitude,
                  longitude: locData.longitude,
                  city: locData.city,
                  state: locData.state,
                  country: locData.country,
                  readable_address: locData.readable_address
                }).catch(err => console.error("Location sync error:", err));
              }}
            />

            {/* Primary Recommended Option: Talk to AI Skill Interviewer */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 text-white shadow-lg space-y-4 border border-indigo-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center font-black text-xl border border-white/20">
                    <Mic className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Recommended Experience
                    </span>
                    <h4 className="text-lg font-black text-white">Talk to our AI Skill Interviewer</h4>
                    <p className="text-xs text-indigo-100 font-semibold">Answer dynamic voice questions in Tamil, Hindi, or English</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiInterviewMode('REGISTRATION');
                    setShowAiInterviewModal(true);
                  }}
                  className="py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 whitespace-nowrap self-start sm:self-auto min-h-[48px]"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>START VOICE INTERVIEW NOW</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs font-black text-slate-400 uppercase tracking-widest">or Describe Skills Manually Below</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <VoiceInputButton
              language={language}
              label={t.voiceLabel}
              onStartRecording={() => setDescription('')}
              onTranscript={(text) => setDescription(text)}
            />

            <div>
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-2">
                Skill Description (Tamil, Hindi, or English)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.inputPlaceholder}
                className="w-full p-4 rounded-2xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 text-base font-semibold text-zinc-900 bg-white"
              />
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block">
                Tap an example to try:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDescription(prompt)}
                    className="p-3 rounded-2xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100 text-blue-950 text-xs font-semibold text-left transition-colors cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeSkills}
              disabled={isAnalyzing || !description.trim()}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-base flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer min-h-[56px]"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{t.analyzingBtn}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{t.analyzeBtn}</span>
                </>
              )}
            </button>
          </div>

          {analysisResult && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-200 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-zinc-900">{t.step2Title}</h3>
                    <p className="text-xs text-zinc-500 font-medium">{t.step2Subtitle}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {!stepConfirmed ? (
                    <button
                      type="button"
                      onClick={() => setStepConfirmed(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center space-x-1.5 shadow-xs cursor-pointer min-h-[44px]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.looksGoodBtn}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStepConfirmed(false)}
                      className="px-4 py-2 rounded-xl bg-blue-100 text-blue-900 text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer min-h-[44px]"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{t.editBtn}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                  <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">Primary Category & Title</span>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-full">
                      {analysisResult.category}
                    </span>
                    <span className="text-base font-bold text-zinc-900">{profileResult?.suggested_title || analysisResult.suggested_title}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                  <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">Extracted Skills (Review & Correct)</span>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.skills.map((s, idx) => (
                      <span key={idx} className="bg-white border border-blue-200 text-blue-950 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs">
                        <span>✓ {s}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (analysisResult) {
                              const remaining = analysisResult.skills.filter(item => item !== s);
                              setAnalysisResult({
                                ...analysisResult,
                                skills: remaining
                              });
                              if (activeProfile) {
                                await handleIncrementalUpdate({ remove_skills: [s] });
                              }
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 text-xs font-extrabold p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                          title="Remove skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Incremental Skill Add */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add another skill..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newSkillInput.trim() && analysisResult) {
                          const added = newSkillInput.trim();
                          setAnalysisResult({
                            ...analysisResult,
                            skills: Array.from(new Set([...analysisResult.skills, added]))
                          });
                          setNewSkillInput('');
                          if (activeProfile) {
                            await handleIncrementalUpdate({ add_skills: [added] });
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Skill</span>
                    </button>
                  </div>
                </div>
              </div>

              {cat.includes('Food') && (
                <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-4">
                  <h4 className="text-sm font-extrabold text-blue-950 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Food & Catering Options (Optional — Select all that apply):</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-700 block mb-2">1. Specific Items Prepared:</span>
                      <div className="flex flex-wrap gap-2">
                        {['Murukku', 'Adhirasam', 'Seedai', 'Laddu', 'Mysore Pak', 'Dosa', 'Chapati', 'Chicken Biryani'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleSelection(item, selectedItems, setSelectedItems)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
                              selectedItems.includes(item)
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-zinc-700 border border-zinc-200 hover:border-blue-300'
                            }`}
                          >
                            {selectedItems.includes(item) ? '✓ ' : '+ '}{item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-zinc-700 block mb-2">2. Order Types Accepted:</span>
                      <div className="flex flex-wrap gap-2">
                        {['Individual Orders', 'Family Functions', 'Festival Orders', 'Bulk Catering'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleSelection(item, selectedServicesOffered, setSelectedServicesOffered)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
                              selectedServicesOffered.includes(item)
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-zinc-700 border border-zinc-200 hover:border-blue-300'
                            }`}
                          >
                            {selectedServicesOffered.includes(item) ? '✓ ' : '+ '}{item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(cat.includes('Tailor') || cat.includes('Craft')) && (
                <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-4">
                  <h4 className="text-sm font-extrabold text-blue-950 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Tailoring & Craft Options (Optional — Select all that apply):</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-700 block mb-2">1. Garments & Work Offered:</span>
                      <div className="flex flex-wrap gap-2">
                        {['Saree Blouse', 'Churidar', 'Garment Fitting', 'Express Alterations', 'Aari Hand Embroidery'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleSelection(item, selectedItems, setSelectedItems)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
                              selectedItems.includes(item)
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-zinc-700 border border-zinc-200 hover:border-blue-300'
                            }`}
                          >
                            {selectedItems.includes(item) ? '✓ ' : '+ '}{item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(cat.includes('Education') || cat.includes('Tutor')) && (
                <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-4">
                  <h4 className="text-sm font-extrabold text-blue-950 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Education & Teaching Options (Optional):</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-700 block mb-2">Teaching Mode:</span>
                      <div className="flex flex-wrap gap-2">
                        {['In Person Class', 'Online Class', 'Both In Person & Online'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setSelectedTeachingMode(selectedTeachingMode === mode ? '' : mode)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
                              selectedTeachingMode === mode
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-zinc-700 border border-zinc-200 hover:border-blue-300'
                            }`}
                          >
                            {selectedTeachingMode === mode ? '✓ ' : '+ '}{mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-blue-100 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-zinc-900">{t.step3Title}</h3>
                    <p className="text-xs text-zinc-500 font-medium">{t.step3Subtitle}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">{t.nameLabel}</label>
                      <input
                        type="text"
                        required
                        value={providerName}
                        onChange={(e) => setProviderName(e.target.value)}
                        placeholder="e.g. Lakshmi Ammal"
                        className="w-full p-3.5 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">{t.emailLabel}</label>
                      <input
                        type="email"
                        required
                        value={providerEmail}
                        onChange={(e) => setProviderEmail(e.target.value)}
                        placeholder="lakshmi@example.com"
                        className="w-full p-3.5 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">{t.locationLabel}</label>
                      <input
                        type="text"
                        required
                        value={providerLocation}
                        onChange={(e) => setProviderLocation(e.target.value)}
                        placeholder="Mylapore, Chennai"
                        className="w-full p-3.5 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900"
                      />
                    </div>
                  </div>

                  {/* Explicit Review Your SilverHands Profile Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 p-6 rounded-3xl border-2 border-blue-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-6 h-6 text-blue-700" />
                        <h4 className="text-lg font-black text-blue-950">Review Your SilverHands Profile</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStepConfirmed(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-900 text-xs font-extrabold flex items-center space-x-1 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 bg-white/80 rounded-2xl border border-blue-100">
                        <span className="text-zinc-500 font-extrabold uppercase block text-[10px] tracking-wider">Full Name</span>
                        <span className="text-sm font-black text-zinc-900">{providerName || <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">Not provided</span>}</span>
                      </div>

                      <div className="p-3 bg-white/80 rounded-2xl border border-blue-100">
                        <span className="text-zinc-500 font-extrabold uppercase block text-[10px] tracking-wider">Location</span>
                        <span className="text-sm font-black text-zinc-900">{providerLocation || <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">Not provided</span>}</span>
                      </div>

                      <div className="p-3 bg-white/80 rounded-2xl border border-blue-100">
                        <span className="text-zinc-500 font-extrabold uppercase block text-[10px] tracking-wider">Category</span>
                        <span className="text-sm font-black text-blue-800">{analysisResult.category}</span>
                      </div>

                      <div className="p-3 bg-white/80 rounded-2xl border border-blue-100">
                        <span className="text-zinc-500 font-extrabold uppercase block text-[10px] tracking-wider">Experience</span>
                        <span className="text-sm font-black text-zinc-900">
                          {(analysisResult.experience_years !== null && analysisResult.experience_years !== undefined)
                            ? `${analysisResult.experience_years} years`
                            : <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">Not provided</span>
                          }
                        </span>
                      </div>

                      <div className="p-3 bg-white/80 rounded-2xl border border-blue-100 sm:col-span-2">
                        <span className="text-zinc-500 font-extrabold uppercase block text-[10px] tracking-wider">Extracted Skills</span>
                        <span className="text-xs font-bold text-zinc-800">
                          {analysisResult.skills.length > 0
                            ? analysisResult.skills.join(', ')
                            : <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">Not provided</span>
                          }
                        </span>
                      </div>

                      <div className="p-3 bg-white/80 rounded-2xl border border-blue-100 sm:col-span-2">
                        <span className="text-zinc-500 font-extrabold uppercase block text-[10px] tracking-wider">Languages</span>
                        <span className="text-xs font-bold text-zinc-800">
                          {providerLanguages
                            ? providerLanguages
                            : <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">Not provided</span>
                          }
                        </span>
                      </div>

                      <div className="p-3 bg-white/80 rounded-2xl border border-blue-100 sm:col-span-4">
                        <span className="text-zinc-500 font-extrabold uppercase block text-[10px] tracking-wider">Services Offered</span>
                        <span className="text-xs font-bold text-zinc-800">
                          {previewServices.length > 0
                            ? previewServices.join(', ')
                            : <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">Not provided</span>
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <ProfileCompletion
                    draftName={providerName}
                    draftEmail={providerEmail}
                    draftLocation={providerLocation}
                    draftSkills={analysisResult.skills}
                    draftServices={analysisResult.services}
                    draftExperience={analysisResult.experience_years}
                  />

                  {/* How would you like to provide your services? */}
                  <div className="space-y-3 p-5 rounded-3xl bg-blue-50/70 border-2 border-blue-200">
                    <label className="block text-xs font-black uppercase text-blue-950 tracking-wider">
                      How would you like to provide your services?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'IN_PERSON', label: '📍 In Person', desc: 'On-site visits only' },
                        { id: 'ONLINE', label: '💻 Online / Virtual', desc: 'Virtual Live Room enabled' },
                        { id: 'BOTH', label: '🌐 Both Modes', desc: 'Flexible In-Person & Virtual' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setServiceDeliveryMode(item.id as any)}
                          className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                            serviceDeliveryMode === item.id
                              ? 'bg-blue-700 border-blue-800 text-white shadow-md ring-2 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                          }`}
                        >
                          <span className="text-xs font-black">{item.label}</span>
                          <span className={`text-[10px] font-bold mt-1 ${serviceDeliveryMode === item.id ? 'text-blue-100' : 'text-slate-500'}`}>
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving || !providerName.trim() || !providerEmail.trim()}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-lg flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer min-h-[56px]"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{t.publishingBtn}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>{t.publishBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>
          )}

          <OpportunitySuggestions
            providerId={activeProfile?.id}
            onAddSuggestedService={handleAddOpportunityService}
          />
        </div>
      )}

      {/* INCOMING REQUESTS: Request Management Only */}
      {activeTab === 'requests' && (
        <IncomingRequestsSection />
      )}

      {/* MY PROFILE: Personal + Service Profile + Status & Strength + Danger Zone */}
      {activeTab === 'profile' && (
        <div className="space-y-8 animate-in fade-in duration-150">

          {/* Profile Header & Status Controls */}
          {activeProfile && (
            <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-extrabold text-zinc-900">Profile Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 ${
                    (activeProfile.status || 'PUBLISHED') === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                    <span>{activeProfile.status || 'PUBLISHED'}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs font-bold text-zinc-600">
                  <span>Profile Strength:</span>
                  <div className="w-36 h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${activeProfile.readiness_score || 85}%` }}></div>
                  </div>
                  <span className="text-blue-700 font-black">{activeProfile.readiness_score || 85}%</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {onPreviewProfile && (
                  <button
                    onClick={() => onPreviewProfile(activeProfile.id)}
                    className="px-4 py-2.5 rounded-2xl border-2 border-blue-200 text-blue-900 font-extrabold text-xs flex items-center space-x-1.5 hover:bg-blue-50 transition-colors cursor-pointer min-h-[48px]"
                  >
                    <Eye className="w-4 h-4 text-blue-700" />
                    <span>View Public Profile</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleStatus((activeProfile.status || 'PUBLISHED') === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED')}
                  className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center space-x-1.5 border-2 transition-colors cursor-pointer min-h-[48px] ${
                    (activeProfile.status || 'PUBLISHED') === 'PUBLISHED'
                      ? 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {(activeProfile.status || 'PUBLISHED') === 'PUBLISHED' ? (
                    <>
                      <EyeOff className="w-4 h-4 text-rose-700" />
                      <span>Unpublish Profile</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-emerald-700" />
                      <span>Publish Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Service Profile & Incremental Skill/Field Editor */}
          {activeProfile && (
            <ProfileUpdateSection
              currentProfile={activeProfile}
              pendingSuggestedService={pendingSuggestedService}
              language={language}
              onClearPendingSuggestedService={() => setPendingSuggestedService(null)}
              onTriggerAiInterview={(mode) => {
                setAiInterviewMode(mode);
                setShowAiInterviewModal(true);
              }}
              onProfileUpdated={async (updated) => {
                setActiveProfile(updated);
                setPendingSuggestedService(null);
                setSaveSuccess("Profile updated successfully!");
                await loadOpportunities();
                if (onPreviewProfile) {
                  onPreviewProfile(updated.id);
                }
              }}
              onProfileDeleted={() => {
                setActiveProfile(null);
                localStorage.removeItem('silverhands_my_provider_id');
                setActiveTab('create');
                alert("Your profile has been deleted.");
              }}
            />
          )}

          {/* Danger Zone: Account Deletion */}
          <div className="pt-6 border-t border-rose-200 space-y-4">
            <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-200 space-y-3">
              <div className="flex items-center space-x-2 text-rose-900 font-extrabold">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Danger Zone</span>
              </div>
              <p className="text-xs text-rose-800 font-medium leading-relaxed">
                Deleting your account will permanently remove your SilverHands account and marketplace profile. Your published services will no longer be visible to customers.
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

      {/* Add New Skill Profile AI Modal */}
      {showAddSkillAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[85vh] md:max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border-2 border-blue-100 overflow-hidden relative">
            
            {/* Sticky Header with Always Reachable Close Button */}
            <div className="sticky top-0 z-20 bg-white border-b border-blue-100 p-4 sm:p-5 flex items-center justify-between shadow-xs flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900">Add New Skills with AI</h3>
                  <p className="text-xs text-zinc-500 font-medium">Describe your new service or skill in voice or text</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddSkillAiModal(false);
                  setProposedNewSkills([]);
                  setAiAddSkillText('');
                }}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer min-h-[44px]"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vertically Scrollable Body */}
            <div className="overflow-y-auto overflow-x-hidden p-5 sm:p-7 space-y-6 flex-1 max-w-full">
              
              {/* Voice & Text Input */}
              <div className="space-y-4">
                <VoiceInputButton
                  language={language}
                  label="Speak your new skill (e.g. 'I also prepare traditional chapati and parotta')"
                  onStartRecording={() => setAiAddSkillText('')}
                  onTranscript={(text) => setAiAddSkillText(text)}
                />

                <textarea
                  rows={3}
                  value={aiAddSkillText}
                  onChange={(e) => setAiAddSkillText(e.target.value)}
                  placeholder="Type your new skill or service offering here (e.g., 'I prepare traditional chapati, parotta, and side gravies for small home functions')..."
                  className="w-full p-4 rounded-2xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 text-sm font-medium bg-slate-50/50"
                />

                <button
                  type="button"
                  onClick={handleAnalyzeNewSkillsAi}
                  disabled={isAnalyzingNewSkills || !aiAddSkillText.trim()}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 min-h-[48px]"
                >
                  {isAnalyzingNewSkills ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting New Skills with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Analyze New Skills with AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* CURRENT PROFILE SKILLS DISPLAY */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-zinc-200 space-y-2.5">
                <span className="text-xs font-extrabold text-zinc-600 uppercase tracking-wider block">
                  Current Profile Skills (Preserved)
                </span>
                <div className="flex flex-wrap gap-2 max-w-full">
                  {activeProfile?.skills.map((s) => (
                    <span key={s.name} className="bg-white border border-zinc-300 text-zinc-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs">
                      <span>✓ {s.name}</span>
                      <button
                        type="button"
                        onClick={() => handleIncrementalUpdate({ remove_skills: [s.name] })}
                        className="text-rose-600 hover:text-rose-800 text-xs font-extrabold p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                        title="Remove skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* PROPOSED NEW SKILLS DISPLAY */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">
                    Proposed New Skills to Add
                  </span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    {proposedNewSkills.length} selected
                  </span>
                </div>

                {proposedNewSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-w-full">
                    {proposedNewSkills.map((s) => (
                      <span key={s} className="bg-white border-2 border-blue-400 text-blue-950 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-xs">
                        <span className="text-emerald-600 font-black">+</span>
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => setProposedNewSkills(proposedNewSkills.filter(item => item !== s))}
                          className="text-rose-600 hover:text-rose-800 text-xs font-extrabold p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                          title="Remove proposed skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 font-medium italic">
                    No new skills proposed yet. Speak or type above to generate new skills with AI, or enter a skill manually below.
                  </p>
                )}

                {/* Manual Add Input inside Modal */}
                <div className="flex items-center space-x-2 pt-2 border-t border-blue-100">
                  <input
                    type="text"
                    placeholder="Enter skill manually (e.g. Parotta Preparation)..."
                    value={manualAddSkillText}
                    onChange={(e) => setManualAddSkillText(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-blue-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (manualAddSkillText.trim()) {
                        const added = manualAddSkillText.trim();
                        setProposedNewSkills(listUnique([...proposedNewSkills, added]));
                        setManualAddSkillText('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center space-x-1 cursor-pointer min-h-[38px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Sticky Bottom Footer */}
            <div className="sticky bottom-0 z-20 bg-slate-50 border-t border-blue-100 p-4 sm:p-5 flex items-center justify-end space-x-3 shadow-xs flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddSkillAiModal(false);
                  setProposedNewSkills([]);
                  setAiAddSkillText('');
                }}
                className="px-5 py-3 rounded-xl border border-zinc-300 text-zinc-700 font-extrabold text-xs hover:bg-zinc-100 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAddProposedSkills}
                disabled={proposedNewSkills.length === 0 || isSaving}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2 min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Add Selected Skills to My Profile ({proposedNewSkills.length})</span>
              </button>
            </div>

          </div>
        </div>
      )}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900">Delete SilverHands Account?</h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Deleting your account will permanently remove your SilverHands account and marketplace profile. Your published services will no longer be visible to customers.
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

      {/* AI Skill Interview Room Modal */}
      {showAiInterviewModal && (
        <AIInterviewRoom
          initialSessionType={aiInterviewMode}
          onClose={() => setShowAiInterviewModal(false)}
          onProfileUpdated={loadDashboardStats}
        />
      )}

    </div>
  );
};
