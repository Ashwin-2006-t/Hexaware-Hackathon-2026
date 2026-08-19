import React, { useEffect, useState } from 'react';
import { Lightbulb, PlusCircle, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchMyOpportunitiesApi } from '../services/api';
import type { OpportunitySuggestionItem, SeniorOpportunitiesResponse } from '../types';

interface OpportunitySuggestionsProps {
  providerId?: string;
  onAddSuggestedService?: (serviceName: string) => void;
}

export const OpportunitySuggestions: React.FC<OpportunitySuggestionsProps> = ({
  providerId,
  onAddSuggestedService
}) => {
  const [data, setData] = useState<SeniorOpportunitiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setErrorMessage(null);
    fetchMyOpportunitiesApi()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('[OpportunitySuggestions] Error fetching recommendations:', err);
        setErrorMessage('Could not load profile recommendations at this time.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [providerId]);

  const suggestions: OpportunitySuggestionItem[] = data?.suggestions || [];
  const statusMessage = data?.status_message;

  return (
    <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/30 text-blue-300 flex items-center justify-center border border-blue-400/40 shadow-xs">
            <Lightbulb className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">Profile Improvement Suggestions</h3>
            <p className="text-xs text-blue-200 font-medium">
              Explainable recommendations derived from actual customer demand in your area over the last 30 days
            </p>
          </div>
        </div>

        <span className="bg-blue-800/80 text-blue-200 text-xs font-extrabold px-3 py-1 rounded-full border border-blue-700/80 self-start sm:self-auto uppercase tracking-wider">
          Market Demand Signals
        </span>
      </div>

      {loading ? (
        <div className="text-sm text-blue-200 py-6 animate-pulse flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-400 animate-ping"></div>
          <span>Analyzing 30-day local customer demand...</span>
        </div>
      ) : errorMessage ? (
        <div className="p-4 rounded-2xl bg-rose-900/40 border border-rose-700 text-rose-200 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
          <p className="text-sm font-extrabold text-blue-100">
            {statusMessage || "No new local service opportunities found in the last 30 days."}
          </p>
          <p className="text-xs text-blue-300/80 font-medium">
            Your current services are aligned with your active neighborhood market.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between space-y-4 hover:bg-white/15 transition-all shadow-md"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                    <span>{item.badge_label || "REAL MARKET DEMAND"}</span>
                  </span>
                  {item.category && (
                    <span className="text-[11px] text-blue-300 font-bold bg-blue-900/50 px-2 py-0.5 rounded-lg border border-blue-700">
                      {item.category}
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-base text-white leading-snug">{item.title}</h4>
                
                <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
                  {item.reason}
                </p>

                {item.demand_count !== null && item.demand_count !== undefined && (
                  <div className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-400/30 inline-block">
                    🔥 {item.demand_count} customer request{item.demand_count > 1 ? 's' : ''} in last 30 days
                  </div>
                )}
              </div>

              {onAddSuggestedService && (
                <button
                  type="button"
                  onClick={() => onAddSuggestedService(item.suggested_service_name)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg active:scale-98"
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                  <span>Review & Add Suggestion</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

