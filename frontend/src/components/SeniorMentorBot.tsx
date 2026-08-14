import React, { useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { api } from '../services/api'

interface Message {
  sender: 'user' | 'bot'
  text: string
  suggestedActions?: string[]
}

interface SeniorMentorBotProps {
  highContrast: boolean
}

export const SeniorMentorBot: React.FC<SeniorMentorBotProps> = ({ highContrast }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hello! I am 'SilverBot', your personal business and platform mentor. I am here to help you set fair pricing, prepare for home visits, and confidently share your lifelong skills with neighbors!",
      suggestedActions: [
        "How should I set my hourly rate?",
        "Tips for safety during home visits",
        "How to request a 5-star review after a job"
      ]
    }
  ])
  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim()) return

    const newMessages: Message[] = [...messages, { sender: 'user', text: query }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.chatWithSeniorMentor(query)
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: res.reply,
          suggestedActions: res.suggested_actions
        }
      ])
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: "I am here for you! Setting an hourly rate between $20 and $35 is ideal for starting out on SilverHands."
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className={`card-senior p-6 rounded-3xl border-2 flex items-center gap-4 ${
        highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-white border-slate-200'
      }`}>
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
          <Bot className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">SilverHands AI Senior Business Mentor</h2>
          <p className="text-sm text-slate-600 font-medium mt-0.5">
            Empathetic pricing advice, safety guidelines, and platform guidance for senior citizens.
          </p>
        </div>
      </div>

      {/* Chat Window */}
      <div className={`card-senior p-6 border-2 min-h-[420px] flex flex-col justify-between ${
        highContrast ? 'bg-zinc-900 border-amber-400 text-white' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Messages Container */}
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl p-5 rounded-2xl text-lg font-medium shadow-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-white font-bold rounded-br-none'
                    : highContrast
                      ? 'bg-zinc-800 text-amber-300 border border-amber-400 rounded-bl-none'
                      : 'bg-white text-slate-900 border-2 border-slate-200 rounded-bl-none'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase text-amber-700">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>SilverBot Business Mentor</span>
                  </div>
                )}
                <p>{msg.text}</p>
              </div>

              {/* Suggested Action Chips */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((action, actionIdx) => (
                    <button
                      key={actionIdx}
                      onClick={() => handleSend(action)}
                      className="px-3.5 py-1.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-300 hover:bg-amber-200 transition-all cursor-pointer"
                    >
                      💡 {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 text-slate-500">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-bold text-sm">SilverBot is typing guidance...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SilverBot any question about pricing, hosting, or safety..."
              className="flex-1 p-4 rounded-2xl border-2 border-slate-300 text-lg font-medium focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 bg-white text-slate-900"
            />
            <button
              type="submit"
              disabled={loading}
              className={`btn-large ${
                highContrast ? 'bg-amber-400 text-black border-2 border-white' : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
