import React, { useState } from 'react';
import { Star, MapPin, CheckCircle2, Sparkles, Map, ListFilter, ShieldCheck, HeartHandshake } from 'lucide-react';
import type { MatchResult } from '../types';
import { MapView } from './MapView';
import { translations, type Language } from '../i18n';

interface MatchResultsProps {
  matches: MatchResult[];
  hasSearched: boolean;
  isSearching: boolean;
  language?: Language;
  onSelectProvider: (providerId: string) => void;
}

export const MatchResults: React.FC<MatchResultsProps> = ({
  matches,
  hasSearched,
  isSearching,
  language = 'en',
  onSelectProvider
}) => {
  const t = translations[language];
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  if (isSearching) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-blue-100 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900">{t.customer.searchingBtn}</h3>
      </div>
    );
  }

  if (!hasSearched) return null;

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-blue-100 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-900">{t.match.noMatchesTitle}</h3>
        <p className="text-base text-zinc-600 max-w-lg mx-auto">
          {t.match.noMatchesSub}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls: Results Count & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-blue-100 shadow-xs">
        <div>
          <h3 className="text-xl font-extrabold text-zinc-900 flex items-center space-x-2">
            <span>{t.match.resultsTitle.replace('{count}', String(matches.length))}</span>
          </h3>
        </div>

        {/* View Mode Toggle: List vs Map */}
        <div className="flex items-center space-x-1 bg-blue-50/60 p-1 rounded-xl border border-blue-100 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-blue-900 shadow-xs border border-blue-200'
                : 'text-zinc-600 hover:text-blue-700'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-blue-900 shadow-xs border border-blue-200'
                : 'text-zinc-600 hover:text-blue-700'
            }`}
          >
            <Map className="w-4 h-4 text-blue-600" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Map View Mode */}
      {viewMode === 'map' && (
        <MapView matches={matches} onSelectProvider={onSelectProvider} />
      )}

      {/* Provider Match Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {matches.map((match) => {
          const provider = match.provider;
          const user = provider?.user;
          if (!provider || !user) return null;

          const hasReviews = provider.total_reviews && provider.total_reviews > 0;

          return (
            <div
              key={provider.id}
              className="bg-white rounded-3xl border-2 border-blue-100 hover:border-blue-500 p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-200 space-y-6 group"
            >
              
              {/* Card Header: Score Badge + Provider Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-blue-50 pb-5">
                
                <div className="flex items-start space-x-4">
                  {/* Avatar Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-600/20 flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-2xl font-extrabold text-zinc-900 group-hover:text-blue-700 transition-colors">
                        {user.name}
                      </h4>
                    </div>

                    <p className="text-base font-bold text-zinc-700">{provider.title}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 font-semibold pt-0.5">
                      <span className="flex items-center text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600 mr-1" />
                        {hasReviews ? `${provider.rating} (${provider.total_reviews})` : t.customer.newProvider}
                      </span>

                      <span className="flex items-center text-slate-800 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1" />
                        {user.location} {match.distance_km !== undefined && match.distance_km !== null ? `(${match.distance_km} km away)` : ''}
                      </span>

                      <span className="flex items-center text-emerald-950 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        💰 {provider.price !== null && provider.price !== undefined ? `₹${provider.price}` : 'Price on request'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* MATCH SCORE BADGE */}
                <div className="self-start sm:self-auto bg-blue-700 text-white px-6 py-3.5 rounded-2xl shadow-md text-center flex-shrink-0 border border-blue-500">
                  <span className="block text-2xl font-black tracking-tight">{match.score}%</span>
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-blue-100">{t.customer.matchScore}</span>
                </div>

              </div>

              {/* WHY THIS MATCH? Section */}
              <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 space-y-3">
                <h5 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>{t.match.matchedBecause}</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {match.reasons.map((reason, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs font-extrabold text-zinc-800 bg-white p-2 rounded-xl border border-blue-200/60 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{reason.replace("✓ ", "")}</span>
                    </div>
                  ))}
                </div>

                {match.explanation && (
                  <p className="text-xs text-zinc-700 italic border-t border-blue-200/60 pt-2 font-medium">
                    💬 "{match.explanation}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-blue-50">
                <div className="text-xs text-zinc-500 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>{t.customer.silverHandsProvider}</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => onSelectProvider(provider.id)}
                    className="flex-1 sm:flex-initial bg-white hover:bg-blue-50 text-blue-900 font-extrabold px-6 py-3 rounded-xl border border-blue-200 text-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer min-h-[44px]"
                  >
                    <span>{t.customer.viewProfileBtn}</span>
                  </button>

                  <button
                    onClick={() => onSelectProvider(provider.id)}
                    className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md text-sm transition-all transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>{t.customer.requestServiceBtn}</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
