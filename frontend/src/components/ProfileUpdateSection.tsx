import React, { useState, useEffect } from 'react';
import { Edit3, Plus, Trash2, CheckCircle2, AlertTriangle, Send, RefreshCw, X, ShieldAlert, Phone, MapPin, Globe, UserCheck, ShieldCheck, Sparkles, Mic } from 'lucide-react';
import { updateProvider, deleteProvider, nlpUpdateProvider, addProviderSkillApi, analyzeSkills, updateMyLocationApi } from '../services/api';
import type { ProviderProfile, NLPUpdateProposal } from '../types';
import { VoiceInputButton } from './VoiceInputButton';
import { LocationPicker, type LocationData } from './LocationPicker';

import type { Language } from '../i18n';

interface ProfileUpdateSectionProps {
  currentProfile: ProviderProfile;
  pendingSuggestedService?: string | null;
  language?: Language;
  onClearPendingSuggestedService?: () => void;
  onProfileUpdated: (updated: ProviderProfile) => void;
  onProfileDeleted: () => void;
  onTriggerAiInterview?: (mode: 'UPDATE') => void;
}

import { useLanguage } from '../context/LanguageContext';

export const ProfileUpdateSection: React.FC<ProfileUpdateSectionProps> = ({
  currentProfile,
  pendingSuggestedService,
  onClearPendingSuggestedService,
  onProfileUpdated,
  onProfileDeleted,
  onTriggerAiInterview
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'form' | 'nlp' | 'voice_skill'>('form');
  const [prefilledRecommendation, setPrefilledRecommendation] = useState<string | null>(null);

  const getInitialSkills = (prof: ProviderProfile): string[] => {
    if (!prof || !prof.skills) return [];
    return prof.skills.map((s: any) => (typeof s === 'string' ? s : s.name));
  };

  const getInitialServices = (prof: ProviderProfile): string[] => {
    if (!prof || !prof.services) return [];
    return prof.services.map((s: any) => (typeof s === 'string' ? s : s.name));
  };

  // Direct form controls state
  const [name, setName] = useState(currentProfile.user?.name || '');
  const [title, setTitle] = useState(currentProfile.title || '');
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [experienceYears, setExperienceYears] = useState<number | ''>(currentProfile.experience_years ?? '');
  const [location, setLocation] = useState(currentProfile.user?.location || '');
  const [availability, setAvailability] = useState(currentProfile.availability || 'Available');
  const [languages, setLanguages] = useState(currentProfile.languages || 'Tamil, English');
  const [price, setPrice] = useState<number | ''>(currentProfile.price ?? '');
  const [pricingUnit, setPricingUnit] = useState<string>(currentProfile.pricing_unit || 'per_service');
  const [paymentMethod, setPaymentMethod] = useState<string>(currentProfile.payment_method || 'upi');
  const [paymentUpiId, setPaymentUpiId] = useState<string>(currentProfile.payment_upi_id || '');
  const [paymentInstructions, setPaymentInstructions] = useState<string>(currentProfile.payment_instructions || '');
  const [serviceDeliveryMode, setServiceDeliveryMode] = useState<string>(currentProfile.service_delivery_mode || 'BOTH');
  const [skills, setSkills] = useState<string[]>(() => getInitialSkills(currentProfile));
  const [services, setServices] = useState<string[]>(() => getInitialServices(currentProfile));

  const [newSkill, setNewSkill] = useState('');
  const [newService, setNewService] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [pendingLocationUpdate, setPendingLocationUpdate] = useState<LocationData | null>(null);

  const handleConfirmLocationUpdate = async () => {
    if (!pendingLocationUpdate) return;
    setIsUpdating(true);
    try {
      const res = await updateMyLocationApi({
        latitude: pendingLocationUpdate.latitude,
        longitude: pendingLocationUpdate.longitude,
        city: pendingLocationUpdate.city,
        state: pendingLocationUpdate.state,
        country: pendingLocationUpdate.country,
        readable_address: pendingLocationUpdate.readable_address
      });
      setLocation(res.location);
      setUpdateMsg(`Location updated to ${res.location}`);
      setPendingLocationUpdate(null);
      onProfileUpdated({ ...currentProfile, location: res.location, latitude: res.latitude, longitude: res.longitude });
    } catch (err: any) {
      console.error(err);
      alert('Failed to update location.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Tab C Voice Skill state
  const [voiceSkillInput, setVoiceSkillInput] = useState('');
  const [isAnalyzingVoiceSkill, setIsAnalyzingVoiceSkill] = useState(false);
  const [detectedSkill, setDetectedSkill] = useState<string | null>(null);
  const [isAddingVoiceSkill, setIsAddingVoiceSkill] = useState(false);
  const [voiceSkillMsg, setVoiceSkillMsg] = useState<string | null>(null);

  const handleAnalyzeVoiceSkill = async () => {
    if (!voiceSkillInput.trim()) return;
    setIsAnalyzingVoiceSkill(true);
    setDetectedSkill(null);
    setVoiceSkillMsg(null);
    try {
      const res = await analyzeSkills(voiceSkillInput);
      if (res && res.skills && res.skills.length > 0) {
        setDetectedSkill(res.skills[0]);
      } else {
        let clean = voiceSkillInput.trim();
        for (const p of ["i also do ", "i do ", "add ", "also ", "my skill is "]) {
          clean = clean.replace(new RegExp(p, 'gi'), '');
        }
        for (const s of [" to my skills", " to my profile", " skill"]) {
          clean = clean.replace(new RegExp(s, 'gi'), '');
        }
        setDetectedSkill(clean.trim().replace(/\b\w/g, c => c.toUpperCase()) || "Custom Skill");
      }
    } catch (err) {
      console.error(err);
      let clean = voiceSkillInput.trim();
      for (const p of ["i also do ", "i do ", "add ", "also ", "my skill is "]) {
        clean = clean.replace(new RegExp(p, 'gi'), '');
      }
      for (const s of [" to my skills", " to my profile", " skill"]) {
        clean = clean.replace(new RegExp(s, 'gi'), '');
      }
      setDetectedSkill(clean.trim().replace(/\b\w/g, c => c.toUpperCase()) || "Custom Skill");
    } finally {
      setIsAnalyzingVoiceSkill(false);
    }
  };

  const handleConfirmAddVoiceSkill = async () => {
    if (!detectedSkill) return;
    setIsAddingVoiceSkill(true);
    try {
      const updated = await addProviderSkillApi(detectedSkill);
      const newSkills = getInitialSkills(updated);
      setSkills(newSkills);
      setVoiceSkillMsg(`Skill '${detectedSkill}' added to your profile!`);
      onProfileUpdated(updated);
      setDetectedSkill(null);
      setVoiceSkillInput('');
    } catch (err: any) {
      console.error(err);
      alert('Could not add skill to profile.');
    } finally {
      setIsAddingVoiceSkill(false);
    }
  };

  // Sync state whenever currentProfile prop updates
  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.user?.name || '');
      setTitle(currentProfile.title || '');
      setBio(currentProfile.bio || '');
      setExperienceYears(currentProfile.experience_years ?? '');
      setLocation(currentProfile.user?.location || '');
      setAvailability(currentProfile.availability || 'Available');
      setLanguages(currentProfile.languages || 'Tamil, English');
      setPrice(currentProfile.price ?? '');
      setPricingUnit(currentProfile.pricing_unit || 'per_service');
      setPaymentMethod(currentProfile.payment_method || 'upi');
      setPaymentUpiId(currentProfile.payment_upi_id || '');
      setPaymentInstructions(currentProfile.payment_instructions || '');
      setServiceDeliveryMode(currentProfile.service_delivery_mode || 'BOTH');
      setSkills(getInitialSkills(currentProfile));
      setServices(getInitialServices(currentProfile));
    }
  }, [currentProfile]);

  // Handle prefill of suggested service recommendation without saving automatically
  useEffect(() => {
    if (pendingSuggestedService && pendingSuggestedService.trim()) {
      const trimmed = pendingSuggestedService.trim();
      setPrefilledRecommendation(trimmed);
      setActiveTab('form');
      setServices((prev) => {
        if (!prev.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
          return [...prev, trimmed];
        }
        return prev;
      });
    }
  }, [pendingSuggestedService]);


  // NLP Voice / Text Command state
  const [nlpCommand, setNlpCommand] = useState('');
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [proposal, setProposal] = useState<NLPUpdateProposal | null>(null);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.map(s => s.toLowerCase()).includes(newSkill.trim().toLowerCase())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase()));
  };

  const handleAddService = () => {
    if (newService.trim() && !services.map(s => s.toLowerCase()).includes(newService.trim().toLowerCase())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setServices(services.filter((s) => s.toLowerCase() !== serviceToRemove.toLowerCase()));
  };

  const handleSaveDirectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMsg(null);
    try {
      const updated = await updateProvider(currentProfile.id, {
        name,
        title,
        bio,
        experience_years: experienceYears === '' ? null : Number(experienceYears),
        location,
        languages,
        availability,
        service_delivery_mode: serviceDeliveryMode,
        price: price === '' ? undefined : Number(price),
        pricing_unit: pricingUnit,
        payment_method: paymentMethod,
        payment_upi_id: paymentUpiId,
        payment_instructions: paymentInstructions,
        skills,
        services
      });
      setUpdateMsg('Profile updated successfully!');
      setPrefilledRecommendation(null);
      if (onClearPendingSuggestedService) onClearPendingSuggestedService();
      onProfileUpdated(updated);
    } catch (err) {
      console.error(err);
      setUpdateMsg('Failed to save profile updates.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Step 1 of NLP update: Generate Confirmation Proposal
  const handleParseNlpCommand = async () => {
    if (!nlpCommand.trim()) return;
    setIsParsingNlp(true);
    setProposal(null);
    try {
      const res = await nlpUpdateProvider(currentProfile.id, nlpCommand);
      setProposal(res);
    } catch (err) {
      console.error(err);
      alert('Could not parse update command.');
    } finally {
      setIsParsingNlp(false);
    }
  };

  // Step 2 of NLP update: User Confirms Proposal
  const handleConfirmNlpProposal = async () => {
    if (!proposal) return;

    if (proposal.intent === 'DELETE_PROFILE') {
      setShowDeleteConfirm(true);
      setProposal(null);
      return;
    }

    setIsUpdating(true);
    try {
      const draft = proposal.draft_update;
      let newSkillsList = [...skills];
      let newServicesList = [...services];

      if (draft.skills && draft.skills.length > 0) {
        draft.skills.forEach((s) => {
          if (!newSkillsList.map(item => item.toLowerCase()).includes(s.toLowerCase())) newSkillsList.push(s);
        });
      }
      if (draft.services && draft.services.length > 0) {
        draft.services.forEach((s) => {
          if (!newServicesList.map(item => item.toLowerCase()).includes(s.toLowerCase())) newServicesList.push(s);
        });
      }

      const updated = await updateProvider(currentProfile.id, {
        experience_years: draft.experience_years !== undefined ? draft.experience_years : (experienceYears === '' ? null : Number(experienceYears)),
        location: draft.location || location,
        languages: languages,
        skills: newSkillsList,
        services: newServicesList
      });

      setSkills(newSkillsList);
      setServices(newServicesList);
      if (draft.experience_years !== undefined) setExperienceYears(draft.experience_years ?? '');
      if (draft.location) setLocation(draft.location);

      setUpdateMsg(`Confirmed & Applied: ${proposal.summary}`);
      onProfileUpdated(updated);
      setProposal(null);
      setNlpCommand('');
    } catch (err) {
      console.error(err);
      alert('Failed to apply update.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProfile = async () => {
    setIsDeleting(true);
    try {
      await deleteProvider(currentProfile.id);
      onProfileDeleted();
    } catch (err) {
      console.error(err);
      alert('Could not delete profile.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200 shadow-md space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
        <div>
          <h3 className="text-2xl font-extrabold text-blue-950 flex items-center space-x-2">
            <Edit3 className="w-6 h-6 text-blue-600" />
            <span>Manage My Senior Profile</span>
          </h3>
          <p className="text-sm text-zinc-600">Update personal information, stated skills, services, rates, and availability</p>
        </div>

        {/* Update Profile with AI Action */}
        {onTriggerAiInterview && (
          <button
            type="button"
            onClick={() => onTriggerAiInterview('UPDATE')}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md flex items-center space-x-2 transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Update My Profile with AI Voice Interview</span>
          </button>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-blue-50 p-1 rounded-2xl border border-blue-200 self-start sm:self-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'form' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-900 hover:bg-blue-100'
            }`}
          >
            A. Direct Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nlp')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'nlp' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-900 hover:bg-blue-100'
            }`}
          >
            B. Voice / Speech Update
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voice_skill')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === 'voice_skill' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>C. Add Skill Using Voice</span>
          </button>
        </div>
      </div>

      {prefilledRecommendation && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-extrabold text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black flex-shrink-0 shadow-xs">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold block text-sm text-amber-950">
                Recommendation Prefilled: "{prefilledRecommendation}"
              </span>
              <span className="text-[11px] font-semibold text-amber-900 leading-snug">
                This suggested service has been prefilled into your draft below. <strong>It is NOT saved to the database yet.</strong> Review your details and click <strong>"Save Profile Changes"</strong> below to persist it to your public profile.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleRemoveService(prefilledRecommendation);
              setPrefilledRecommendation(null);
              if (onClearPendingSuggestedService) onClearPendingSuggestedService();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white text-amber-900 border border-amber-300 font-extrabold text-xs hover:bg-amber-100 cursor-pointer whitespace-nowrap self-end sm:self-center min-h-[36px]"
          >
            Discard Prefill
          </button>
        </div>
      )}

      {updateMsg && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span>{updateMsg}</span>
        </div>
      )}

      {/* Tab A: Form Controls */}
      {activeTab === 'form' && (
        <form onSubmit={handleSaveDirectUpdate} className="space-y-8">

          {/* SECTION A: PERSONAL INFORMATION */}
          <div className="p-6 rounded-3xl bg-blue-50/40 border-2 border-blue-100 space-y-5">
            <div className="flex items-center space-x-2 border-b border-blue-200/60 pb-3">
              <UserCheck className="w-5 h-5 text-blue-700" />
              <h4 className="text-lg font-black text-blue-950 uppercase tracking-wide">A. Personal Information</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Verified Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={currentProfile.user?.phone || 'Verified Phone'}
                    className="w-full p-3.5 pl-11 rounded-2xl border-2 border-zinc-200 bg-zinc-100 text-base font-bold text-zinc-600"
                  />
                  <Phone className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">Verified via Supabase SMS Auth</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Current Service Location</label>
              
              <LocationPicker
                initialLocation={location}
                initialLat={currentProfile.latitude || currentProfile.user?.latitude}
                initialLon={currentProfile.longitude || currentProfile.user?.longitude}
                onLocationDetected={(locData) => {
                  setPendingLocationUpdate(locData);
                }}
              />

              {/* Confirmation Modal */}
              {pendingLocationUpdate && (
                <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-950 space-y-3 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <span className="text-xs font-black">
                      Update your service location to: <strong>📍 {pendingLocationUpdate.readable_address}</strong>?
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setPendingLocationUpdate(null)}
                      className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-extrabold text-xs hover:bg-indigo-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmLocationUpdate}
                      disabled={isUpdating}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                    >
                      {isUpdating ? 'Updating...' : 'Confirm Location'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Location / Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Mylapore, Chennai"
                    className="w-full p-3.5 pl-11 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900 bg-white"
                  />
                  <MapPin className="w-5 h-5 text-blue-600 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Spoken & Written Languages</label>
                <div className="relative">
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="e.g. Tamil, English, Hindi"
                    className="w-full p-3.5 pl-11 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900 bg-white"
                  />
                  <Globe className="w-5 h-5 text-blue-600 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Personal Biography & Background</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your personal background..."
                className="w-full p-3.5 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900 bg-white"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-100/60 border border-blue-200 flex items-center space-x-3 text-xs text-blue-900 font-bold">
              <ShieldCheck className="w-5 h-5 text-blue-700 flex-shrink-0" />
              <span>Verified Senior Citizen Service Provider • SilverHands Marketplace</span>
            </div>
          </div>


          {/* SECTION B: SERVICE PROFILE */}
          <div className="p-6 rounded-3xl bg-emerald-50/30 border-2 border-emerald-200 space-y-6">
            <div className="flex items-center space-x-2 border-b border-emerald-200 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h4 className="text-lg font-black text-emerald-950 uppercase tracking-wide">B. Service Profile & Skills</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Professional Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Traditional Home Cook & Catering Specialist"
                  className="w-full p-3.5 rounded-2xl border-2 border-emerald-100 focus:border-emerald-600 text-base font-semibold text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Years of Experience</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 20 (leave blank if unstated)"
                  className="w-full p-3.5 rounded-2xl border-2 border-emerald-100 focus:border-emerald-600 text-base font-semibold text-zinc-900 bg-white"
                />
              </div>
            </div>

            {/* SERVICE DELIVERY PREFERENCE */}
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-emerald-200">
              <label className="block text-xs font-black uppercase text-emerald-950 tracking-wider">
                {t('profileUpdate.serviceDeliveryHeader')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'IN_PERSON', label: `📍 ${t('profileUpdate.modeInPerson')}`, desc: 'On-site visits' },
                  { id: 'ONLINE', label: `💻 ${t('profileUpdate.modeOnline')}`, desc: 'Virtual Live Room' },
                  { id: 'BOTH', label: `🌐 ${t('profileUpdate.modeBoth')}`, desc: 'In-Person & Virtual' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setServiceDeliveryMode(item.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                      serviceDeliveryMode === item.id
                        ? 'bg-emerald-700 border-emerald-800 text-white shadow-md ring-2 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-xs font-black">{item.label}</span>
                    <span className={`text-[10px] font-bold mt-1 ${serviceDeliveryMode === item.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* STATED SKILLS MANAGEMENT */}
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-emerald-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                  Stated Skills ({skills.length})
                </label>
                <span className="text-[11px] font-bold text-zinc-500 italic">Loaded from database profile</span>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[36px] items-center p-2 bg-slate-50 rounded-xl border border-zinc-200">
                {skills.length === 0 ? (
                  <span className="text-xs text-zinc-400 font-medium italic">No skills added yet. Use the field below to add your skills.</span>
                ) : (
                  skills.map((s, idx) => (
                    <span key={idx} className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-2xs">
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="hover:text-rose-600 transition-colors p-0.5 rounded-full hover:bg-rose-50 cursor-pointer"
                        title={`Remove ${s}`}
                      >
                        <X className="w-4 h-4 text-emerald-800 hover:text-rose-600" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="flex space-x-2 pt-1 max-w-md">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                  placeholder="Add another skill (e.g. Traditional Sweet Making)..."
                  className="flex-1 p-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 text-xs font-bold bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-3 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Skill</span>
                </button>
              </div>
            </div>

            {/* OFFERED SERVICES MANAGEMENT */}
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-emerald-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                  Services Offered ({services.length})
                </label>
                <span className="text-[11px] font-bold text-zinc-500 italic">Marketplace offerings</span>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[36px] items-center p-2 bg-slate-50 rounded-xl border border-zinc-200">
                {services.length === 0 ? (
                  <span className="text-xs text-zinc-400 font-medium italic">No service offerings added yet.</span>
                ) : (
                  services.map((srv, idx) => {
                    const isPrefilled = prefilledRecommendation && srv.toLowerCase() === prefilledRecommendation.toLowerCase();
                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-2xs transition-all ${
                          isPrefilled
                            ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 font-black ring-2 ring-amber-200'
                            : 'bg-indigo-100 text-indigo-950 border border-indigo-300'
                        }`}
                      >
                        <span>{srv}</span>
                        {isPrefilled && (
                          <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                            Draft Prefill
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveService(srv);
                            if (isPrefilled) setPrefilledRecommendation(null);
                          }}
                          className="hover:text-rose-600 transition-colors p-0.5 rounded-full hover:bg-rose-50 cursor-pointer"
                          title={`Remove ${srv}`}
                        >
                          <X className={`w-4 h-4 ${isPrefilled ? 'text-amber-900' : 'text-indigo-800'} hover:text-rose-600`} />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>

              <div className="flex space-x-2 pt-1 max-w-md">
                <input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
                  placeholder="Add another service offering (e.g. Wedding Catering)..."
                  className="flex-1 p-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-600 text-xs font-bold bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="bg-indigo-800 hover:bg-indigo-900 text-white font-extrabold px-4 py-3 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Offering</span>
                </button>
              </div>
            </div>

            {/* Service Pricing & Rates */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-emerald-950 uppercase tracking-wider block">Service Pricing & Rates</label>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  Marketplace Rate: {price !== '' && price !== null ? `₹${price} / ${pricingUnit}` : 'Price not set yet'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Service Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 200"
                    className="w-full p-3.5 rounded-2xl border-2 border-emerald-200 focus:border-emerald-600 text-base font-bold text-zinc-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Pricing Unit</label>
                  <select
                    value={pricingUnit}
                    onChange={(e) => setPricingUnit(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border-2 border-emerald-200 focus:border-emerald-600 text-base font-bold text-zinc-900 bg-white cursor-pointer"
                  >
                    <option value="per_person">Per Person</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_service">Per Service</option>
                    <option value="per_session">Per Session</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Details Configuration */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-4">
              <div>
                <label className="text-xs font-black text-emerald-950 uppercase tracking-wider block">Payment Details & Instructions</label>
                <p className="text-xs text-zinc-600 font-medium mt-0.5">
                  Displayed to customers <strong>ONLY AFTER</strong> quote acceptance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Preferred Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-base font-bold text-zinc-900 bg-white cursor-pointer"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash / Pay After Service</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="other">Other / Negotiable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">UPI ID (If applicable)</label>
                  <input
                    type="text"
                    value={paymentUpiId}
                    onChange={(e) => setPaymentUpiId(e.target.value)}
                    placeholder="e.g. seniorname@upi or 9876543210@paytm"
                    className="w-full p-3.5 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-base font-bold text-zinc-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Payment Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="e.g. Pay after service completion. GPay to +91 98765 43210 or cash on delivery."
                  className="w-full p-3.5 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-xs font-medium text-zinc-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">Availability Schedule</label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g. Available Monday - Saturday, 9 AM to 6 PM"
                className="w-full p-3.5 rounded-2xl border-2 border-emerald-100 focus:border-emerald-600 text-base font-semibold text-zinc-900 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-zinc-200 gap-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-rose-600 hover:text-rose-800 text-xs font-extrabold flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete My Profile</span>
            </button>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-md text-base flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[50px]"
            >
              <Send className="w-4 h-4" />
              <span>{isUpdating ? 'Saving Updates...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab B: Voice / Speech Update */}
      {activeTab === 'nlp' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-blue-50/70 border-2 border-blue-200 space-y-4">
            <h4 className="text-lg font-black text-blue-950">B. Voice or Natural Language Profile Update</h4>
            <p className="text-xs text-blue-900 font-medium">
              Speak or type updates in plain language (e.g. <em>"Add traditional sweet making as my skill"</em> or <em>"Update my experience to 25 years"</em>).
            </p>

            <div className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={nlpCommand}
                  onChange={(e) => setNlpCommand(e.target.value)}
                  placeholder="e.g. Add traditional sweet making to my skills and change my location to Mylapore"
                  className="w-full p-4 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-sm font-semibold text-zinc-900 bg-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <VoiceInputButton onTranscript={(text: string) => setNlpCommand(text)} />
                <button
                  type="button"
                  onClick={handleParseNlpCommand}
                  disabled={isParsingNlp || !nlpCommand.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center space-x-2 cursor-pointer shadow-md"
                >
                  {isParsingNlp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Parse Voice Update</span>
                </button>
              </div>
            </div>
          </div>

          {proposal && (
            <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-4 shadow-sm">
              <h5 className="text-base font-extrabold text-amber-950 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Review & Confirm Proposed Update</span>
              </h5>

              <p className="text-xs text-amber-900 font-bold bg-white p-3.5 rounded-xl border border-amber-200">
                {proposal.summary}
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProposal(null)}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmNlpProposal}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md"
                >
                  Confirm & Apply Update
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab C: Add New Skill Using Voice */}
      {activeTab === 'voice_skill' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-emerald-50/60 border-2 border-emerald-200 space-y-5">
            <div className="flex items-center space-x-3 border-b border-emerald-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-black text-emerald-950">C. Add New Skill Using Voice</h4>
                <p className="text-xs text-emerald-800 font-semibold">
                  Speak or type additional skills to add to your existing SilverHands senior profile.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-2">
                  Speak Your New Skill Below:
                </label>
                <textarea
                  rows={3}
                  value={voiceSkillInput}
                  onChange={(e) => setVoiceSkillInput(e.target.value)}
                  placeholder='e.g. "I also do stone work embroidery" or "Traditional South Indian breakfast catering"'
                  className="w-full p-4 rounded-2xl border-2 border-emerald-200 focus:border-emerald-600 text-sm font-semibold text-zinc-900 bg-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <VoiceInputButton onTranscript={(text: string) => setVoiceSkillInput(text)} />
                  <span className="text-xs font-bold text-emerald-800 hidden sm:inline">Click mic to record skill</span>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeVoiceSkill}
                  disabled={isAnalyzingVoiceSkill || !voiceSkillInput.trim()}
                  className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white font-black px-6 py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-md min-h-[48px]"
                >
                  {isAnalyzingVoiceSkill ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Analyze Spoken Skill</span>
                </button>
              </div>
            </div>
          </div>

          {voiceSkillMsg && (
            <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-sm flex items-center space-x-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <span>{voiceSkillMsg}</span>
            </div>
          )}

          {detectedSkill && (
            <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 space-y-4 shadow-md animate-in fade-in">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <h5 className="text-lg font-black text-emerald-950">Detected Skill: "{detectedSkill}"</h5>
              </div>

              <p className="text-xs font-semibold text-emerald-900 bg-white p-3.5 rounded-xl border border-emerald-200">
                Would you like to add <strong>"{detectedSkill}"</strong> to your existing SilverHands provider profile? This will not alter your existing pricing, experience, or service offerings.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDetectedSkill(null)}
                  className="px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-900 font-bold text-xs hover:bg-emerald-100 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddVoiceSkill}
                  disabled={isAddingVoiceSkill}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md min-h-[44px] flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingVoiceSkill ? 'Adding Skill...' : 'Add To My Profile'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-rose-200 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-rose-600">
              <ShieldAlert className="w-8 h-8" />
              <h4 className="text-xl font-black text-zinc-900">Delete Profile?</h4>
            </div>

            <p className="text-xs text-zinc-600 font-medium leading-relaxed">
              This action will permanently delete your Senior Service Profile. Your account and authentication will remain active.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-xs hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
