import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Language } from '../i18n';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onStartRecording?: () => void;
  language?: Language;
  label?: string;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  onStartRecording,
  language = 'en',
  label = 'Speak Your Skills / Tap to Speak',
  className = ''
}) => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [selectedLang, setSelectedLang] = useState<'en-IN' | 'ta-IN' | 'hi-IN'>('en-IN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync selected voice language whenever page language changes
  useEffect(() => {
    if (language === 'ta') setSelectedLang('ta-IN');
    else if (language === 'hi') setSelectedLang('hi-IN');
    else setSelectedLang('en-IN');
  }, [language]);

  const startVoiceInput = () => {
    // If currently listening, stop recording
    if (voiceState === 'listening' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setVoiceState('idle');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not supported in your browser. You can type directly in the text box below.");
      setVoiceState('error');
      return;
    }

    setErrorMessage(null);

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = selectedLang;
      recognition.interimResults = false;

      recognition.onstart = () => {
        // Fix: NEW recording session clears previous command in parent input!
        if (onStartRecording) {
          onStartRecording();
        }
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        setVoiceState('processing');
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          onTranscript(transcript.trim());
          setVoiceState('success');
          setTimeout(() => setVoiceState('idle'), 2500);
        } else {
          setVoiceState('error');
          setErrorMessage("Could not hear clearly. Please tap to try again.");
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setVoiceState('error');
        if (event.error === 'not-allowed') {
          setErrorMessage("Microphone access is needed for voice input. Please allow microphone permissions in your browser.");
        } else if (event.error === 'no-speech') {
          setErrorMessage("No speech detected. Please tap to try speaking again.");
        } else {
          setErrorMessage("Could not hear clearly. Please try again.");
        }
      };

      recognition.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setVoiceState('error');
      setErrorMessage("Microphone could not be started. Please try typing your input.");
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* Top Language Control & Voice Target Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Senior Language Selection Touch Buttons */}
        <div className="flex items-center space-x-2 bg-blue-50 border-2 border-blue-200 rounded-2xl px-3 py-2 text-sm font-bold text-blue-900 shadow-xs">
          <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs text-blue-700 font-extrabold uppercase tracking-wider">SPEAK IN:</span>
          <div className="flex bg-white rounded-xl p-0.5 border border-blue-200">
            {(
              [
                { id: 'ta-IN', label: 'தமிழ்' },
                { id: 'hi-IN', label: 'हिंदी' },
                { id: 'en-IN', label: 'English' }
              ] as const
            ).map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLang(lang.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
                  selectedLang === lang.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-700 hover:text-blue-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Indicator Badge */}
        {voiceState !== 'idle' && (
          <div className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5">
            {voiceState === 'listening' && (
              <span className="text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full animate-pulse flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                <span>Listening now... Speak clearly</span>
              </span>
            )}
            {voiceState === 'processing' && (
              <span className="text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full flex items-center space-x-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Understanding your voice...</span>
              </span>
            )}
            {voiceState === 'success' && (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Voice Captured!</span>
              </span>
            )}
            {voiceState === 'error' && (
              <span className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Voice error</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Large Senior-First Voice Input Button */}
      <button
        type="button"
        onClick={startVoiceInput}
        title="Tap to speak your input using voice"
        className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center space-x-3 transition-all duration-200 border-2 shadow-md cursor-pointer min-h-[56px] ${
          voiceState === 'listening'
            ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 animate-pulse shadow-rose-600/30'
            : voiceState === 'processing'
            ? 'bg-blue-800 text-white border-blue-900'
            : voiceState === 'success'
            ? 'bg-emerald-600 text-white border-emerald-700'
            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-blue-600/20 active:scale-98'
        }`}
      >
        {voiceState === 'listening' ? (
          <>
            <MicOff className="w-7 h-7 text-white animate-bounce" />
            <span>🔴 Listening... Tap to Stop</span>
          </>
        ) : voiceState === 'processing' ? (
          <>
            <Loader2 className="w-7 h-7 text-white animate-spin" />
            <span>⏳ Understanding your voice...</span>
          </>
        ) : voiceState === 'success' ? (
          <>
            <CheckCircle2 className="w-7 h-7 text-white" />
            <span>✓ Voice Captured Successfully</span>
          </>
        ) : (
          <>
            <Mic className="w-7 h-7 text-white flex-shrink-0" />
            <span>🎤 {label}</span>
          </>
        )}
      </button>

      {/* Permission & Friendly Error Display */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

    </div>
  );
};
