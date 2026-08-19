import React from 'react';
import { UserCheck, Search, ArrowRight, HeartHandshake } from 'lucide-react';
import type { UserRole } from '../types';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-blue-100 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg">
            <HeartHandshake className="w-9 h-9" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight">
            Welcome to SilverHands
          </h2>
          <p className="text-lg text-blue-800 font-bold">
            How would you like to use SilverHands today?
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Role A: Senior Citizen */}
          <button
            onClick={() => onSelectRole('SENIOR')}
            className="group p-8 rounded-3xl border-3 border-blue-200 bg-blue-50/50 hover:bg-blue-600 hover:border-blue-600 text-left transition-all shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white group-hover:bg-white group-hover:text-blue-600 flex items-center justify-center shadow-md transition-colors">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-zinc-900 group-hover:text-white transition-colors">
                  👵 I am a Senior Citizen
                </h3>
                <p className="text-sm font-semibold text-zinc-600 group-hover:text-blue-100 transition-colors mt-2 leading-relaxed">
                  I want to share my skills, offer services, earn livelihood, and receive customer requests.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-blue-700 group-hover:text-white font-extrabold text-base transition-colors">
              <span>Share Skills & Offer Services</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Role B: Customer */}
          <button
            onClick={() => onSelectRole('CUSTOMER')}
            className="group p-8 rounded-3xl border-3 border-blue-200 bg-blue-50/50 hover:bg-blue-600 hover:border-blue-600 text-left transition-all shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white group-hover:bg-white group-hover:text-blue-600 flex items-center justify-center shadow-md transition-colors">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-zinc-900 group-hover:text-white transition-colors">
                  👤 I am a Customer
                </h3>
                <p className="text-sm font-semibold text-zinc-600 group-hover:text-blue-100 transition-colors mt-2 leading-relaxed">
                  I want to search for authentic services, find skilled senior citizens, and request help.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-blue-700 group-hover:text-white font-extrabold text-base transition-colors">
              <span>Find & Request Services</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

        </div>

      </div>
    </div>
  );
};
