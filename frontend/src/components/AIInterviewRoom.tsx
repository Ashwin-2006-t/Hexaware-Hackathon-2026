import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mic, MicOff, Send, Bot, User, CheckCircle2, Sparkles, AlertCircle, 
  Award, Trash2, Volume2, ArrowRight, ShieldCheck, RefreshCw, Languages
} from 'lucide-react';
import type { AIInterviewSessionRecord } from '../types';
import { 
  startAIInterviewApi, answerAIInterviewQuestionApi, completeAIInterviewApi, 
  approveAIInterviewProfileApi 
} from '../services/api';

interface AIInterviewRoomProps {
  initialSessionType?: 'REGISTRATION' | 'UPDATE';
  initialLanguage?: 'en' | 'ta' | 'hi';
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const DOMAIN_OPTIONS = [
  { name: 'Food & Catering', defaultSkill: 'Traditional Home Cooking' },
  { name: 'Tailoring & Handicrafts', defaultSkill: 'Custom Stitching & Embroidery' },
  { name: 'Education & Tutoring', defaultSkill: 'High School Mathematics & Language Tutoring' },
  { name: 'Gardening & Home Care', defaultSkill: 'Terrace Organic Gardening & Plant Care' },
  { name: 'Childcare & Eldercare', defaultSkill: 'Senior Companionship & Household Care' },
];

import { useLanguage } from '../context/LanguageContext';

export const AIInterviewRoom: React.FC<AIInterviewRoomProps> = ({ 
  initialSessionType = 'REGISTRATION',
  initialLanguage: _initialLanguage = 'en',
  onClose, 
  onProfileUpdated 
}) => {
  const { language: globalLang, setLanguage: setGlobalLang } = useLanguage();
  const language = globalLang;
  const setLanguage = (l: 'en' | 'ta' | 'hi') => setGlobalLang(l);

  // Setup & Domain State
  const [selectedDomain, setSelectedDomain] = useState('Food & Catering');
  const [selectedSkill, setSelectedSkill] = useState('Traditional Home Cooking');
  const [customSkillInput, setCustomSkillInput] = useState('');
  
  // Session State
  const [session, setSession] = useState<AIInterviewSessionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Input & Voice State
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [inputMode, setInputMode] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Completion & Approval State
  const [approvedSkills, setApprovedSkills] = useState<string[]>([]);
  const [approvedServices, setApprovedServices] = useState<any[]>([]);
  const [bioSummary, setBioSummary] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom & Auto-play question via Speech Synthesis
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (session?.messages && session.messages.length > 0) {
      const lastMsg = session.messages[session.messages.length - 1];
      if (lastMsg.role === 'AI') {
        handleSpeakText(lastMsg.message, language);
      }
    }
  }, [session?.messages]);

  // Configure WebSpeech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Set recognition language
      if (language === 'ta') recognition.lang = 'ta-IN';
      else if (language === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentTranscript);
        setTypedAnswer(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const handleStartRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please type your answer in the box.');
      return;
    }
    setErrorMsg(null);
    setInputMode('VOICE');
    setVoiceTranscript('');
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleStartInterview = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const finalSkill = customSkillInput.trim() || selectedSkill;
    try {
      const res = await startAIInterviewApi(selectedDomain, finalSkill, initialSessionType, language);
      setSession(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Unable to start AI interview room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !typedAnswer.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const updated = await answerAIInterviewQuestionApi(session.id, typedAnswer.trim(), inputMode);
      setSession(updated);
      setTypedAnswer('');
      setVoiceTranscript('');
      setInputMode('TEXT');

      if (updated.is_completed_ready) {
        await handleTriggerCompletion(updated.id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerCompletion = async (sessionId?: string) => {
    const targetId = sessionId || session?.id;
    if (!targetId) return;
    setIsLoading(true);
    try {
      const completedSession = await completeAIInterviewApi(targetId);
      setSession(completedSession);

      if (completedSession.result) {
        try {
          const rawSkills = JSON.parse(completedSession.result.detected_skills);
          const skillNames = Array.isArray(rawSkills) ? rawSkills.map((s: any) => typeof s === 'string' ? s : s.name) : [];
          setApprovedSkills(skillNames);

          const rawServices = JSON.parse(completedSession.result.suggested_services);
          const serviceItems = Array.isArray(rawServices) ? rawServices : [];
          setApprovedServices(serviceItems);

          setBioSummary(completedSession.result.experience_summary || '');
        } catch (parseErr) {
          console.error("Error parsing result JSON:", parseErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate interview completion result.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakText = (text: string, lang: 'en' | 'ta' | 'hi' = 'en') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === 'ta') utterance.lang = 'ta-IN';
      else if (lang === 'hi') utterance.lang = 'hi-IN';
      else utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveToProfile = async () => {
    if (!session || isSavingProfile) return;
    setIsSavingProfile(true);
    setErrorMsg(null);
    try {
      await approveAIInterviewProfileApi(session.id, {
        approved_skills: approvedSkills,
        approved_services: approvedServices,
        bio_summary: bioSummary
      });
      setSaveSuccess(true);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save approved skills to profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ------------------------------------------------------------------
  // VIEW 1: SETUP & LANGUAGE SELECTION
  // ------------------------------------------------------------------
  if (!session) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {initialSessionType === 'UPDATE' ? 'Update Profile with AI Voice Interview' : 'AI Voice Skill Interview'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Talk naturally in Tamil, Hindi, or English to verify your skills
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
              <Languages className="w-4 h-4 text-indigo-600" />
              <span>Preferred Language / பேசும் மொழி</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English' },
                { id: 'ta', label: 'தமிழ் (Tamil)' },
                { id: 'hi', label: 'हिंदी (Hindi)' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLanguage(l.id as any)}
                  className={`py-3 rounded-2xl font-black text-xs border transition cursor-pointer ${
                    language === l.id 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider">Select Category / Domain</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DOMAIN_OPTIONS.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => {
                    setSelectedDomain(d.name);
                    setSelectedSkill(d.defaultSkill);
                  }}
                  className={`p-3.5 rounded-2xl text-left font-bold text-xs border transition cursor-pointer ${
                    selectedDomain === d.name 
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-xs' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-slate-900">{d.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">e.g. {d.defaultSkill}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Skill Input */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider">Specify Primary Skill / Expertise</label>
            <input
              type="text"
              value={customSkillInput || selectedSkill}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              placeholder="e.g. Traditional Sweets, Mathematics Tutoring..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartInterview}
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center space-x-2 transition cursor-pointer min-h-[50px]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Entering Interview Room...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Start Voice AI Interview</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 2: COMPLETED RESULT & HUMAN APPROVAL
  // ------------------------------------------------------------------
  if (session.status === 'COMPLETED' && session.result) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Here's What I Understood About Your Skills</h3>
                <p className="text-xs text-slate-500 font-semibold">Review and approve extracted skills before saving to your profile</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          {saveSuccess ? (
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-lg font-black text-slate-900">Profile Updated Successfully!</h4>
              <p className="text-xs font-bold text-slate-600">
                Your approved skills and services have been saved. The SilverHands Opportunity Engine will now match you with relevant local customer demand.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Close & View Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Confidence Score & Summary */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    AI Verified Match
                  </span>
                  <h4 className="text-base font-black text-slate-900">{session.result.confidence_score}% Confidence Score</h4>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">{session.result.experience_summary}</p>
                </div>
              </div>

              {/* Detected Skills Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Detected Skills (Select to Keep)</h4>
                  <span className="text-xs font-bold text-slate-500">{approvedSkills.length} Selected</span>
                </div>

                <div className="space-y-2">
                  {approvedSkills.map((skillName, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-black text-slate-900">{skillName}</span>
                      </div>
                      <button
                        onClick={() => setApprovedSkills(approvedSkills.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1 flex-shrink-0"
                        title="Remove Skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add Custom Skill Input */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom skill..."
                      className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-indigo-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setApprovedSkills([...approvedSkills, e.currentTarget.value.trim()]);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Suggested Services */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Suggested Market Services</h4>
                <div className="space-y-2.5">
                  {approvedServices.map((srv, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-900">{srv.name}</span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                            {srv.category || session.selected_domain}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{srv.description}</p>
                      </div>
                      <button
                        onClick={() => setApprovedServices(approvedServices.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1 flex-shrink-0"
                        title="Remove Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Profile Button */}
              <button
                onClick={handleSaveToProfile}
                disabled={isSavingProfile}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center space-x-2 transition cursor-pointer min-h-[50px]"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving Approved Skills to Profile...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Save My Profile</span>
                  </>
                )}
              </button>

            </div>
          )}

        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 3: ACTIVE VOICE INTERVIEW ROOM
  // ------------------------------------------------------------------
  const qCount = session.messages.filter(m => m.role === 'AI').length;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header & Progress */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 font-black text-xs">
                {session.selected_skill}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Question {qCount} of ~5 ({session.language === 'ta' ? 'தமிழ்' : session.language === 'hi' ? 'हिंदी' : 'English'})
              </span>
            </div>
            <div className="w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (qCount / 5) * 100)}%` }}
              />
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {session.messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex items-start space-x-3 ${msg.role === 'SENIOR' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                msg.role === 'AI' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {msg.role === 'AI' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <div className={`p-4 rounded-2xl max-w-md text-xs sm:text-sm font-semibold space-y-1.5 shadow-xs ${
                msg.role === 'AI' 
                  ? 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-none' 
                  : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
                <p className="leading-relaxed">{msg.message}</p>
                {msg.role === 'AI' && (
                  <button
                    type="button"
                    onClick={() => handleSpeakText(msg.message, language)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Replay Question</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Answer Input Area */}
        <div className="border-t border-slate-100 pt-4 space-y-3 flex-shrink-0">
          
          {/* Live Transcript / Input Preview */}
          <div className="relative">
            <textarea
              rows={3}
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Type your answer or click the microphone to speak..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-600 bg-slate-50/50"
            />
            {isRecording && (
              <div className="absolute top-2 right-3 flex items-center space-x-1.5 text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Listening: {voiceTranscript.slice(-25) || 'Speak now...'}</span>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-indigo-600" />
                  <span>Start Speaking</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <MicOff className="w-4 h-4" />
                  <span>Stop Recording</span>
                </button>
              )}

              {session.messages.filter(m => m.role === 'AI').length >= 3 && (
                <button
                  type="button"
                  onClick={() => handleTriggerCompletion()}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-extrabold text-xs hover:bg-indigo-100 transition cursor-pointer"
                >
                  <span>Finish & Evaluate</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={!typedAnswer.trim() || isSubmitting}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Answer</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
