import React from 'react';
import { HeartHandshake, Sparkles, Search, MessageSquareHeart, Type } from 'lucide-react';

interface NavbarProps {
  activeTab: 'landing' | 'provider' | 'customer' | 'assistant';
  setActiveTab: (tab: 'landing' | 'provider' | 'customer' | 'assistant') => void;
  largeFont: boolean;
  setLargeFont: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  largeFont,
  setLargeFont
}) => {
  return (
    <header className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Platform Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('landing')}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
                  Silver<span className="text-amber-600">Hands</span>
                </span>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                  India
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">Digital Livelihood for Seniors & Homemakers</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200/80">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center space-x-2 ${
                activeTab === 'landing'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('provider')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center space-x-2 ${
                activeTab === 'provider'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-zinc-700 hover:text-amber-600 hover:bg-amber-50/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Share My Skills</span>
            </button>

            <button
              onClick={() => setActiveTab('customer')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center space-x-2 ${
                activeTab === 'customer'
                  ? 'bg-indigo-900 text-white shadow-md shadow-indigo-900/20'
                  : 'text-zinc-700 hover:text-indigo-900 hover:bg-indigo-50/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Find a Service</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center space-x-2 ${
                activeTab === 'assistant'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'text-zinc-700 hover:text-teal-700 hover:bg-teal-50/50'
              }`}
            >
              <MessageSquareHeart className="w-4 h-4" />
              <span>AI Support</span>
            </button>
          </nav>

          {/* Right Action & Senior Accessibility Font Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setLargeFont(!largeFont)}
              title="Toggle Large Accessible Font Size for Senior Citizens"
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border ${
                largeFont
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>{largeFont ? 'Font: Extra Large' : 'Font: Standard'}</span>
            </button>

            <button
              onClick={() => setActiveTab('provider')}
              className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-transform active:scale-95 text-sm items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Offer Services</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
