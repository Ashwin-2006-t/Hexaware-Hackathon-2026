import React, { useState } from 'react';
import { Sparkles, CheckCircle2, UserCheck, BookOpen, RefreshCw, Send, AlertCircle } from 'lucide-react';
import { analyzeSkills, generateProfile, registerProvider } from '../services/api';
import type { SkillAnalysisResult, ProfileGenerationResult, ProviderProfile } from '../types';
import { VoiceInputButton } from './VoiceInputButton';

interface ProviderDashboardProps {
  onProfileCreated?: (profile: ProviderProfile) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ onProfileCreated }) => {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SkillAnalysisResult | null>(null);
  const [profileResult, setProfileResult] = useState<ProfileGenerationResult | null>(null);

  // Form registration state
  const [providerName, setProviderName] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerLocation, setProviderLocation] = useState('Mylapore, Chennai, Tamil Nadu');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const samplePrompts = [
    "I have been making traditional Tamil sweets for 20 years. I prepare murukku, adhirasam and seedai from home.",
    "I am a retired high school mathematics professor with 30 years experience. I teach Class 9 to 12 CBSE and State Board algebra.",
    "I do custom saree blouse stitching, Aari hand embroidery work, and garment alterations with 15 years experience in T. Nagar.",
    "I have 18 years experience setting up rooftop terrace vegetable gardens, organic soil prep, and balcony plant care."
  ];

  const handleAnalyzeSkills = async () => {
    if (!description.trim()) {
      setErrorMessage("Please enter or select a skill description first.");
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
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Skill analysis encountered an issue. Using fallback extraction.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName || !providerEmail) {
      setErrorMessage("Please enter your Name and Email to publish your profile.");
      return;
    }
    if (!analysisResult) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const savedProfile = await registerProvider({
        name: providerName,
        email: providerEmail,
        location: providerLocation,
        latitude: 13.0339,
        longitude: 80.2687,
        title: profileResult?.suggested_title || analysisResult.suggested_title,
        bio: profileResult?.bio || `Experienced provider with ${analysisResult.experience_years}+ years of expertise.`,
        experience_years: analysisResult.experience_years,
        availability: 'Available Daily',
        skills: analysisResult.skills,
        services: analysisResult.services
      });

      setSaveSuccess(`Congratulations ${providerName}! Your SilverHands profile is now active and discoverable by local customers.`);
      if (onProfileCreated) onProfileCreated(savedProfile);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not save profile. Please check connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 text-white shadow-lg shadow-amber-500/10">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Skill Intelligence</span>
          </div>
          <h2 className="text-3xl font-extrabold">Describe Your Life Experience & Skills</h2>
          <p className="text-amber-100 text-base">
            No complicated resumes needed! Just speak or write in your own natural words about what you enjoy doing. Our AI automatically structures your professional profile.
          </p>
        </div>
      </div>

      {/* Main Input & Analysis Card */}
      <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm space-y-6">
        
        {/* Sample Prompt Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-zinc-700">
              💡 Quick Demo Examples (Click any prompt to try):
            </label>
            <VoiceInputButton onTranscript={(txt) => setDescription((prev) => (prev ? prev + " " + txt : txt))} />
          </div>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDescription(prompt);
                  setErrorMessage(null);
                }}
                className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold px-3 py-2 rounded-xl border border-amber-200 transition-colors text-left cursor-pointer"
              >
                "{prompt.slice(0, 55)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-lg font-bold text-zinc-900">
              Tell us what skills you offer:
            </label>
            <span className="text-xs text-zinc-500 font-medium">Tamil / English / Speech supported</span>
          </div>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., I have been preparing traditional South Indian sweets and festival snacks for 20 years. I specialize in Murukku, Adhirasam and seedai made from home..."
            className="w-full p-4 rounded-2xl border-2 border-zinc-200 focus:border-amber-500 focus:ring-0 text-base text-zinc-900 placeholder-zinc-400 font-medium"
          />
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleAnalyzeSkills}
            disabled={isAnalyzing || !description.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 disabled:opacity-50 text-base flex items-center space-x-3 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Extracting Skills with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-100" />
                <span>✨ Analyze My Skills</span>
              </>
            )}
          </button>

          <span className="text-xs text-zinc-500 font-medium hidden sm:inline-block">
            Powered by Gemini AI • Guaranteed Fallback Safety
          </span>
        </div>

      </div>

      {/* AI Extraction & Generated Profile Card */}
      {analysisResult && (
        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-3xl p-8 border-2 border-amber-200 shadow-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900">Extracted Skill Intelligence</h3>
                <p className="text-xs text-amber-900 font-medium">Structured by SilverHands AI Agent</p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Category: {analysisResult.category}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Extracted Skills & Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Suggested Title</h4>
                <p className="text-lg font-extrabold text-zinc-900 mt-1">
                  {profileResult?.suggested_title || analysisResult.suggested_title}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Extracted Skills</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysisResult.skills.map((skill, i) => (
                    <span key={i} className="bg-white text-amber-900 text-sm font-bold px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <div className="bg-white px-4 py-2 rounded-xl border border-amber-200">
                  <span className="text-xs text-zinc-500 block">Experience</span>
                  <span className="text-base font-extrabold text-amber-900">{analysisResult.experience_years} Years</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-amber-200">
                  <span className="text-xs text-zinc-500 block">Service Items</span>
                  <span className="text-base font-extrabold text-amber-900">{analysisResult.services.length} Offerings</span>
                </div>
              </div>
            </div>

            {/* Right Column: AI Generated Dignified Bio */}
            <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Generated Professional Biography</span>
              </div>
              <p className="text-zinc-700 text-base leading-relaxed font-medium italic">
                "{profileResult?.bio || `Dedicated specialist with ${analysisResult.experience_years}+ years of experience.`}"
              </p>

              <div className="pt-2">
                <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Service Description Highlights:</h5>
                <ul className="space-y-1 text-xs text-zinc-700">
                  {analysisResult.services.map((srv, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span className="font-semibold">{srv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* Registration Form to Save Profile */}
          {!saveSuccess ? (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-amber-200 space-y-4 pt-6">
              <h4 className="text-lg font-bold text-zinc-900 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <span>Finalize & Publish Your Profile</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="e.g. Lakshmi Ammal"
                    className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Your Email Address *</label>
                  <input
                    type="email"
                    required
                    value={providerEmail}
                    onChange={(e) => setProviderEmail(e.target.value)}
                    placeholder="e.g. lakshmi@example.com"
                    className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Location / Area</label>
                  <input
                    type="text"
                    value={providerLocation}
                    onChange={(e) => setProviderLocation(e.target.value)}
                    placeholder="e.g. Mylapore, Chennai"
                    className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-md transition-all text-base flex items-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSaving ? 'Publishing Profile...' : 'Save & Publish Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-base font-bold flex items-center space-x-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
