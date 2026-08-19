import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { searchMatches } from '../services/api';
import type { MatchResult } from '../types';
import { MatchResults } from './MatchResults';
import { VoiceInputButton } from './VoiceInputButton';
import { translations, type Language } from '../i18n';

interface CustomerMarketplaceProps {
  language?: Language;
  onSelectProvider: (providerId: string) => void;
}

export const CustomerMarketplace: React.FC<CustomerMarketplaceProps> = ({
  language = 'en',
  onSelectProvider
}) => {
  const t = translations[language].customer;
  const [query, setQuery] = useState('I need homemade Tamil sweets for a wedding function');
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState('Chennai, Tamil Nadu');
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categories = [
    { label: 'All Services', value: '' },
    { label: 'Food & Catering', value: 'Food & Catering' },
    { label: 'Tailoring & Craft', value: 'Tailoring & Handicrafts' },
    { label: 'Hindi & Math Tutoring', value: 'Education & Tutoring' },
    { label: 'Arts & Culture', value: 'Arts & Culture' },
    { label: 'Terrace Gardening', value: 'Gardening & Home Care' },
    { label: 'Childcare & Stories', value: 'Childcare & Eldercare' }
  ];

  const quickSearchQueries = [
    "I need homemade Tamil sweets for a wedding",
    "I need Hindi tutoring for children up to age 16",
    "Saree blouse designer stitching in T. Nagar",
    "Rooftop terrace vegetable garden setup",
    "After school childcare and storytelling in Alwarpet"
  ];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setErrorMessage("Please enter a service requirement or select a category.");
      return;
    }
    setErrorMessage(null);
    setIsSearching(true);
    try {
      const results = await searchMatches({
        query,
        category: category || undefined,
        location,
        latitude: 13.0827,
        longitude: 80.2707
      });
      setMatches(results);
      setHasSearched(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-8 py-4">
      
      {/* Search Header Banner - Vibrant Blue */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-blue-200 border border-blue-400/30">
            <Search className="w-4 h-4 text-blue-300" />
            <span>Customer Marketplace</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t.title}
          </h2>

          <p className="text-blue-100 text-base leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Service Search Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-blue-200 shadow-sm space-y-5">
        <div className="flex items-center space-x-2.5 border-b border-blue-100 pb-3">
          <Search className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-extrabold text-zinc-900">Service Search & Filter Panel</h3>
        </div>

        {/* Prominent Senior Voice Button for Hands-Free Search */}
        <VoiceInputButton
          language={language}
          label={t.voiceLabel}
          onStartRecording={() => setQuery('')}
          onTranscript={(text) => {
            setQuery(text);
          }}
        />

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Query Input */}
            <div className="md:col-span-8">
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                {t.queryLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.queryPlaceholder}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 text-base font-semibold text-zinc-900 bg-white"
                />
                <Search className="w-6 h-6 text-zinc-400 absolute left-4 top-4" />
              </div>
            </div>

            {/* Location Input */}
            <div className="md:col-span-4">
              <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                {t.locationLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Chennai, Tamil Nadu"
                  className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-blue-100 focus:border-blue-600 text-base font-semibold text-zinc-900 bg-white"
                />
                <MapPin className="w-5 h-5 text-blue-600 absolute left-4 top-4" />
              </div>
            </div>

          </div>

          {/* Category Filter Pills */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider block">
              Filter by Specialty Category:
            </span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
                    category === cat.value
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50/60 text-blue-900 border border-blue-100 hover:border-blue-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Example Searches */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block">
              Try an example search:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickSearchQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(q);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-100 text-blue-950 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Find Matches Action Button */}
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-lg flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer min-h-[56px]"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{t.searchingBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{t.searchBtn}</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Match Results Listing */}
      <MatchResults
        matches={matches}
        hasSearched={hasSearched}
        isSearching={isSearching}
        onSelectProvider={onSelectProvider}
      />

    </div>
  );
};
