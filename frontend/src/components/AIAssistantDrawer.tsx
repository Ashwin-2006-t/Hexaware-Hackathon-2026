import React, { useState } from 'react';
import { MessageSquareHeart, Send, X, Sparkles, Bot, User, HelpCircle } from 'lucide-react';
import { askAIAssistant } from '../services/api';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export const AIAssistantDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Namaste! I am your SilverHands Assistant. How can I help you share your skills or find local services today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "How can I create my profile?",
    "What services can I offer?",
    "What skills should I add?",
    "How does local matching work?"
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
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-teal-200 overflow-hidden flex flex-col h-[520px] animate-in fade-in slide-in-from-bottom-6 duration-200">
      
      {/* Drawer Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center border border-teal-400/40">
            <MessageSquareHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-base leading-tight">SilverHands Assistant</h4>
            <p className="text-[11px] text-teal-100 font-medium">Senior Citizens & Homemakers Guide</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-teal-900/40 hover:bg-teal-900/80 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Quick Questions Pills */}
      <div className="bg-teal-50/60 p-2.5 border-b border-teal-100 flex items-center space-x-1.5 overflow-x-auto text-xs">
        <HelpCircle className="w-4 h-4 text-teal-700 flex-shrink-0 ml-1" />
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="whitespace-nowrap bg-white hover:bg-teal-100 text-teal-900 font-bold px-2.5 py-1 rounded-lg border border-teal-200 transition-colors shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start space-x-2 ${
              m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                m.sender === 'user' ? 'bg-amber-500 text-white' : 'bg-teal-700 text-white'
              }`}
            >
              {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[82%] text-xs sm:text-sm font-semibold leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-amber-500 text-white rounded-tr-none'
                  : 'bg-white text-zinc-800 border border-zinc-200/80 shadow-2xs rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs font-bold text-teal-800 italic">
            <Sparkles className="w-4 h-4 animate-spin text-teal-600" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-zinc-200 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any question..."
          className="flex-1 p-2.5 text-xs sm:text-sm font-medium border border-zinc-300 rounded-xl focus:border-teal-600 focus:ring-0"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-teal-700 hover:bg-teal-800 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
