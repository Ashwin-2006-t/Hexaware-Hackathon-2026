import React, { useState } from 'react';
import { Star, MapPin, CheckCircle2, Sparkles, Map, ListFilter, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';
import type { MatchResult } from '../types';
import { MapView } from './MapView';

interface MatchResultsProps {
  matches: MatchResult[];
  hasSearched: boolean;
  isSearching: boolean;
  onSelectProvider: (providerId: string) => void;
}

export const MatchResults: React.FC<MatchResultsProps> = ({
  matches,
  hasSearched,
  isSearching,
  onSelectProvider
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  if (isSearching) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900">Calculating AI Match Percentages...</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Evaluating Haversine local distance, skill overlap, experience years, and community rating.
        </p>
      </div>
    );
  }

  if (!hasSearched) return null;

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-900">No direct matches found</h3>
        <p className="text-base text-zinc-600 max-w-lg mx-auto">
          No strong matches found. Try expanding your location or service description to discover nearby providers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls: Results Count & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h3 className="text-xl font-extrabold text-zinc-900 flex items-center space-x-2">
            <span>Ranked Provider Matches ({matches.length})</span>
            <span className="bg-emerald-100 text-emerald-900 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-300">
              AI Distance & Skill Ranked
            </span>
          </h3>
          <p className="text-xs text-zinc-500 font-medium">Click on any provider card to view full profile or request service</p>
        </div>

        {/* View Mode Toggle: List vs Map */}
        <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Map className="w-4 h-4 text-indigo-600" />
            <span>Interactive Map</span>
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

          return (
            <div
              key={provider.id}
              className="bg-white rounded-3xl border-2 border-zinc-200/90 hover:border-amber-400 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-200 space-y-6 group"
            >
              
              {/* Card Header: Score Badge + Provider Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-100 pb-5">
                
                <div className="flex items-start space-x-4">
                  {/* Avatar Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-amber-500/20 flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-2xl font-extrabold text-zinc-900 group-hover:text-amber-700 transition-colors">
                        {user.name}
                      </h4>
                      <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                        {provider.experience_years}+ Years Exp
                      </span>
                    </div>

                    <p className="text-base font-bold text-zinc-700">{provider.title}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 font-semibold pt-0.5">
                      <span className="flex items-center text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 mr-1" />
                        {provider.rating} ({provider.total_reviews} reviews)
                      </span>
                      <span className="flex items-center text-indigo-900 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 mr-1" />
                        {user.location} • {match.distance_km} km away
                      </span>
                      <span className="flex items-center text-emerald-800 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                        {provider.availability}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PROMINENT MATCH PERCENTAGE BADGE */}
                <div className="self-start sm:self-auto bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-teal-500/20 text-center flex-shrink-0 border border-teal-400/30">
                  <span className="block text-2xl font-black tracking-tight">{match.score}%</span>
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-teal-100">MATCH SCORE</span>
                </div>

              </div>

              {/* WHY THIS MATCH? Breakdown Section */}
              <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/80 space-y-3">
                <h5 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>WHY THIS MATCH?</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {match.reasons.map((reason, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs font-extrabold text-zinc-800 bg-white p-2 rounded-xl border border-amber-200/60 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{reason.replace("✓ ", "")}</span>
                    </div>
                  ))}
                </div>

                {/* Natural Language Explanation */}
                {match.explanation && (
                  <p className="text-xs text-zinc-700 italic border-t border-amber-200/60 pt-2 font-medium">
                    💬 "{match.explanation}"
                  </p>
                )}
              </div>

              {/* Bio & Offered Skills */}
              <div className="space-y-3">
                <p className="text-sm text-zinc-600 leading-relaxed font-medium line-clamp-2">
                  {provider.bio}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {provider.skills.map((sk, i) => (
                    <span key={i} className="bg-zinc-100 text-zinc-800 text-xs font-bold px-3 py-1 rounded-xl border border-zinc-200">
                      {sk.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-100">
                <div className="text-xs text-zinc-500 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Verified Senior / Homemaker Provider</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => onSelectProvider(provider.id)}
                    className="flex-1 sm:flex-initial bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold px-6 py-3 rounded-xl border border-zinc-300 text-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => onSelectProvider(provider.id)}
                    className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-3 rounded-xl shadow-md shadow-amber-500/20 text-sm transition-all transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Request Service</span>
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
