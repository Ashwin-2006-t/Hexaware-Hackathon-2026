import React from 'react';
import { Sparkles, Search, MapPin, ShieldCheck, ArrowRight, Utensils, Scissors, GraduationCap, Music, Flower2, Baby } from 'lucide-react';

interface LandingHeroProps {
  onShareSkills: () => void;
  onFindService: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onShareSkills, onFindService }) => {
  return (
    <div className="space-y-12 py-6">
      
      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-8 md:p-14 shadow-2xl shadow-amber-500/20 border border-amber-400/30">
        
        {/* Background Decorative Patterns */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-amber-900/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-amber-50 border border-white/30">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Hexaware Hackathon 2026 • Track 3 Solution</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Turn Your Skills Into <span className="text-amber-200 underline decoration-amber-300 decoration-wavy underline-offset-8">Opportunities</span>
          </h1>

          <p className="text-lg sm:text-xl text-amber-50 leading-relaxed font-medium">
            India's AI-Powered Digital Livelihood Platform enabling senior citizens and homemakers to monetize decades of home expertise — from authentic cooking to tutoring, tailoring, and arts.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={onShareSkills}
              className="bg-white hover:bg-amber-50 text-amber-900 font-extrabold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95 text-lg flex items-center justify-center space-x-3 group cursor-pointer"
            >
              <Sparkles className="w-6 h-6 text-amber-600 group-hover:rotate-12 transition-transform" />
              <span>Share My Skills</span>
              <ArrowRight className="w-5 h-5 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onFindService}
              className="bg-indigo-950/80 hover:bg-indigo-950 text-white font-extrabold px-8 py-4 rounded-2xl border border-indigo-400/40 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 text-lg flex items-center justify-center space-x-3 cursor-pointer"
            >
              <Search className="w-6 h-6 text-indigo-300" />
              <span>Find a Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Core Value Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-8 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">✨ AI Skill Discovery</h3>
          <p className="text-zinc-600 text-base leading-relaxed">
            Simply speak or type your story in natural language. Our Gemini AI extracts structured skills, experience, and builds a professional profile automatically.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">📍 Smart Local Matching</h3>
          <p className="text-zinc-600 text-base leading-relaxed">
            Deterministic weighted matching engine ranks local providers by skill overlap, experience, Haversine distance, availability, and community rating.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">🤝 Dignified & Trusted</h3>
          <p className="text-zinc-600 text-base leading-relaxed">
            Designed specifically for senior citizens and homemakers with extra-large typography, clear match rationale, and direct local neighbor requests.
          </p>
        </div>

      </div>

      {/* Popular Categories Grid */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-900">Explore Skill Categories</h2>
            <p className="text-zinc-500 font-medium text-base">Popular livelihood services offered by local seniors and homemakers</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { icon: Utensils, label: 'Food & Catering', desc: 'Tamil sweets, tiffin & snacks', color: 'bg-amber-50 text-amber-800 border-amber-200' },
            { icon: Scissors, label: 'Tailoring & Craft', desc: 'Blouse stitching & embroidery', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
            { icon: GraduationCap, label: 'Math & Tutoring', desc: 'CBSE / Board exam prep', color: 'bg-blue-50 text-blue-800 border-blue-200' },
            { icon: Music, label: 'Arts & Culture', desc: 'Bharatanatyam & vocal lessons', color: 'bg-purple-50 text-purple-800 border-purple-200' },
            { icon: Flower2, label: 'Terrace Gardening', desc: 'Organic setup & plant care', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
            { icon: Baby, label: 'Childcare & Stories', desc: 'After-school care & Panchatantra', color: 'bg-rose-50 text-rose-800 border-rose-200' },
          ].map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                onClick={onFindService}
                className={`p-5 rounded-2xl border ${cat.color} cursor-pointer hover:scale-105 transition-transform flex flex-col items-center text-center space-y-3`}
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">{cat.label}</h4>
                  <p className="text-xs text-zinc-600 mt-0.5">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
