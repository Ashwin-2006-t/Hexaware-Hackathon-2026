import React from 'react';
import { CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ProviderProfile } from '../types';

interface ProfileCompletionProps {
  profile?: ProviderProfile | null;
  draftName?: string;
  draftEmail?: string;
  draftLocation?: string;
  draftSkills?: string[];
  draftServices?: string[];
  draftExperience?: number | null;
}

export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  profile,
  draftName = '',
  draftEmail = '',
  draftLocation = '',
  draftSkills = [],
  draftServices = [],
  draftExperience
}) => {
  const name = profile?.user?.name || draftName;
  const email = profile?.user?.email || draftEmail;
  const location = profile?.user?.location || draftLocation;
  const skills = profile?.skills ? profile.skills.map(s => s.name) : draftSkills;
  const services = profile?.services ? profile.services.map(s => s.name) : draftServices;
  const experience = profile?.experience_years !== undefined ? profile.experience_years : draftExperience;
  const availability = profile?.availability;

  let score = 0;
  const checks = [
    {
      label: 'Full Name & Email',
      met: Boolean(name.trim() && email.trim()),
      weight: 20,
      hint: 'Add your name and email to publish profile'
    },
    {
      label: 'Location & Area',
      met: Boolean(location.trim()),
      weight: 20,
      hint: 'Specify your local neighborhood or area'
    },
    {
      label: 'Skills & Specialties',
      met: skills.length > 0,
      weight: 20,
      hint: 'Add skills you excel at'
    },
    {
      label: 'Specific Service Offerings',
      met: services.length > 0,
      weight: 20,
      hint: 'List specific tasks or services offered'
    },
    {
      label: 'Experience Duration',
      met: experience !== null && experience !== undefined && experience > 0,
      weight: 10,
      hint: 'Add years of experience if applicable'
    },
    {
      label: 'Availability Schedule',
      met: Boolean(availability && availability.trim() && availability !== 'Not specified'),
      weight: 10,
      hint: 'Specify preferred working timings'
    }
  ];

  checks.forEach(c => {
    if (c.met) score += c.weight;
  });

  return (
    <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-lg">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-zinc-900">Profile Readiness Check</h3>
            <p className="text-xs text-zinc-500 font-medium">Calculated from actual provided information</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-blue-700">{score}%</span>
          <span className="text-xs text-zinc-400 block font-bold">Ready</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-blue-50 rounded-full h-3 overflow-hidden border border-blue-100">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Check list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {checks.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center space-x-2 ${
              item.met
                ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {item.met ? (
              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold block">{item.label}</span>
              {!item.met && <span className="text-[10px] text-slate-500 font-medium">{item.hint}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
