import React from 'react';
import { Sparkles, Search, ArrowRight, Utensils, Scissors, GraduationCap, Music, Flower2, Baby } from 'lucide-react';
import { translations, type Language } from '../i18n';

interface LandingHeroProps {
  language?: Language;
  onShareSkills: () => void;
  onFindService: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  language = 'en',
  onShareSkills,
  onFindService
}) => {
  const t = translations[language].hero;

  return (
    <div className="space-y-12 py-6">
      
      {/* Hero Banner Card - Vibrant Blue Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-8 md:p-14 shadow-2xl border border-blue-500/30">
        
        {/* Background Decorative Patterns */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-blue-900/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-blue-200 border border-blue-400/30">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>Senior Citizen Livelihood Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            {t.title}
          </h1>

          <p className="text-lg sm:text-xl text-blue-100 leading-relaxed font-medium">
            {t.subtitle}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={onShareSkills}
              className="bg-white hover:bg-blue-50 text-blue-950 font-extrabold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95 text-lg flex items-center justify-center space-x-3 group cursor-pointer min-h-[56px]"
            >
              <Sparkles className="w-6 h-6 text-blue-600 group-hover:rotate-12 transition-transform" />
              <span>{t.shareSkillsBtn}</span>
              <ArrowRight className="w-5 h-5 text-blue-700 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onFindService}
              className="bg-slate-900/90 hover:bg-slate-950 text-white font-extrabold px-8 py-4 rounded-2xl border border-blue-400/30 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 text-lg flex items-center justify-center space-x-3 cursor-pointer min-h-[56px]"
            >
              <Search className="w-6 h-6 text-blue-300" />
              <span>{t.findServiceBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Specialty Category Highlights */}
      <div className="space-y-6">
        <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Popular Senior Livelihood Specialties</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { icon: Utensils, title: "Food & Sweets", count: "12 Providers" },
            { icon: Scissors, title: "Tailoring & Fitting", count: "8 Providers" },
            { icon: GraduationCap, title: "Tutoring & Lang", count: "15 Providers" },
            { icon: Music, title: "Arts & Music", count: "6 Providers" },
            { icon: Flower2, title: "Terrace Garden", count: "7 Providers" },
            { icon: Baby, title: "Story & Care", count: "9 Providers" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all text-center space-y-2">
              <item.icon className="w-8 h-8 text-blue-600 mx-auto" />
              <h4 className="font-extrabold text-sm text-zinc-900">{item.title}</h4>
              <span className="text-[11px] text-zinc-500 font-bold block">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
