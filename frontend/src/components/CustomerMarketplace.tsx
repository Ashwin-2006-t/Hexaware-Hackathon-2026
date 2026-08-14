import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, RefreshCw, AlertCircle, ArrowUpRight } from 'lucide-react';
import { searchMatches } from '../services/api';
import type { MatchResult } from '../types';
import { MatchResults } from './MatchResults';

interface CustomerMarketplaceProps {
  onSelectProvider: (providerId: string) => void;
}

export const CustomerMarketplace: React.FC<CustomerMarketplaceProps> = ({ onSelectProvider }) => {
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
    { label: 'Math & Tutoring', value: 'Education & Tutoring' },
    { label: 'Arts & Culture', value: 'Arts & Culture' },
    { label: 'Terrace Gardening', value: 'Gardening & Home Care' },
    { label: 'Childcare & Stories', value: 'Childcare & Eldercare' }
  ];

  const quickSearchQueries = [
    "I need homemade Tamil sweets for a wedding",
    "Looking for Class 10 CBSE math tutor near Adyar",
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
      
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300 border border-indigo-400/30">
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Customer Marketplace</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            What service are you looking for?
          </h2>

          <p className="text-indigo-200 text-base leading-relaxed">
            Enter your exact requirement in natural language. Our AI matching engine calculates distance, experience, ratings, and skill overlap to find the best local seniors and homemakers.
          </p>
        </div>
      </div>

      {/* Main Search Input Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Query Input */}
            <div className="md:col-span-8">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Service Requirement *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. I need traditional Tamil sweets like Murukku for a function..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-zinc-200 focus:border-indigo-600 focus:ring-0 text-base font-semibold text-zinc-900"
                />
                <Search className="w-6 h-6 text-zinc-400 absolute left-4 top-4" />
              </div>
            </div>

            {/* Location Input */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Your Location / Area
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Chennai, Tamil Nadu"
                  className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-zinc-200 focus:border-indigo-600 text-base font-semibold text-zinc-900"
                />
                <MapPin className="w-5 h-5 text-indigo-600 absolute left-4 top-4" />
              </div>
            </div>

          </div>

          {/* Category Pill Selectors */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Filter by Skill Category:
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCategory(cat.value);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    category === cat.value
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-sm'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search Prompts */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-bold text-zinc-500">Popular Searches:</span>
            {quickSearchQueries.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(q);
                  setErrorMessage(null);
                }}
                className="text-indigo-800 bg-indigo-50 hover:bg-indigo-100 font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center space-x-1 cursor-pointer"
              >
                <span>"{q}"</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            ))}
          </div>

          {/* Submit Search Action Button */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="submit"
              disabled={isSearching}
              className="bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all transform active:scale-95 text-base flex items-center space-x-3 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Matching Providers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-indigo-300" />
                  <span>Find AI Matches</span>
                </>
              )}
            </button>

            <span className="text-xs text-zinc-500 font-medium hidden sm:inline-block">
              Matching Engine: Haversine Distance + Skill Overlap + Rating
            </span>
          </div>

        </form>

      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Render Match Results Component */}
      <MatchResults
        matches={matches}
        hasSearched={hasSearched}
        isSearching={isSearching}
        onSelectProvider={onSelectProvider}
      />

    </div>
  );
};
