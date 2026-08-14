import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser speech recognition is not supported in your current browser. You can type your description directly!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Indian English / Tamil speech input support
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startVoiceInput}
      title="Speak your skills (Voice Input)"
      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
        isListening
          ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
      }`}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4 text-white" />
          <span>Listening...</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 text-amber-700" />
          <span>Voice Input</span>
        </>
      )}
    </button>
  );
};
