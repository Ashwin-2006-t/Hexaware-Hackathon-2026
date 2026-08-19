import React, { useState } from 'react';
import { MessageSquareHeart, Send, X, Sparkles, Bot, User, HelpCircle } from 'lucide-react';
import { askAIAssistant } from '../services/api';
import { VoiceInputButton } from './VoiceInputButton';
import { translations, type Language } from '../i18n';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export const AIAssistantDrawer: React.FC<{
  isOpen: boolean;
  language?: Language;
  onClose: () => void;
}> = ({
  isOpen,
  language = 'en',
  onClose
}) => {
  const t = translations[language].assistant;
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Namaste! I am your SilverHands Assistant. How can I help you share your skills or guide you on the platform today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "How can I create my profile?",
    "What services can I offer?",
    "How does local matching work?",
    "How can I improve discoverability?"
  ];

  const handleSend = async (textToSend?: string) => {
    const msg = textToSend || input;
    if (!msg.trim()) return;

    const userMsg: Message = { sender: 'user', text: msg };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await askAIAssistant(msg);
      setMessages((prev) => [...prev, { sender: 'bot', text: res.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "To create a profile, simply click 'Share My Skills' at the top and describe what you love doing!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-2 right-2 left-2 sm:left-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-full sm:max-w-md max-h-[85vh] h-[520px] bg-white rounded-3xl shadow-2xl border-2 border-blue-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
      
      {/* Drawer Header - Vibrant Blue */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center border border-blue-400/40">
            <MessageSquareHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-base leading-tight">{t.title}</h4>
            <p className="text-[11px] text-blue-100 font-medium">{t.subtitle}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-blue-950/40 hover:bg-blue-950/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Quick Questions Pills */}
      <div className="bg-blue-50/60 p-2.5 border-b border-blue-100 flex items-center space-x-1.5 overflow-x-auto text-xs">
        <HelpCircle className="w-4 h-4 text-blue-700 flex-shrink-0 ml-1" />
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="whitespace-nowrap bg-white hover:bg-blue-100 text-blue-950 font-bold px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs cursor-pointer min-h-[36px]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Voice Assistant Button */}
      <div className="p-2.5 bg-blue-50 border-b border-blue-100">
        <VoiceInputButton
          language={language}
          label={t.askVoiceLabel}
          onStartRecording={() => setInput('')}
          onTranscript={(txt) => {
            setInput(txt);
            handleSend(txt);
          }}
        />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start space-x-2 ${
              m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
              }`}
            >
              {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[82%] text-xs sm:text-sm font-semibold leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-zinc-800 border border-blue-100 shadow-2xs rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-800 italic">
            <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-blue-100 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 p-2.5 text-xs sm:text-sm font-medium border border-blue-200 rounded-xl focus:border-blue-600 focus:ring-0"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
