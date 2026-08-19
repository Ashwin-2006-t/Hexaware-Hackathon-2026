import React from 'react';
import { HeartHandshake, Search, LogOut, Home, Clock, Heart, User, Bell, UserCheck } from 'lucide-react';
import { translations, type Language } from '../i18n';
import type { UserRole } from '../types';

export type FontSize = 'standard' | 'large' | 'xlarge' | 'xlarge-voice';

interface NavbarProps {
  activeTab: 'landing' | 'provider' | 'customer';
  setActiveTab: (tab: 'landing' | 'provider' | 'customer') => void;
  customerSubTab?: 'overview' | 'find' | 'requests' | 'saved' | 'profile';
  setCustomerSubTab?: (subTab: 'overview' | 'find' | 'requests' | 'saved' | 'profile') => void;
  seniorSubTab?: 'create' | 'update' | 'requests' | 'profile';
  setSeniorSubTab?: (subTab: 'create' | 'update' | 'requests' | 'profile') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize?: FontSize;
  setFontSize?: (size: FontSize) => void;
  isHighContrast?: boolean;
  setIsHighContrast?: (val: boolean) => void;
  userRole?: UserRole | null;
  userPhone?: string | null;
  isProfileSetupCompleted?: boolean;
  onLogout?: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  customerSubTab = 'overview',
  setCustomerSubTab,
  seniorSubTab = 'create',
  setSeniorSubTab,
  language,
  userRole,
  isProfileSetupCompleted = false,
  onLogout,
  unreadCount = 0,
  onOpenNotifications
}) => {
  const t = translations[language];

  const navigateCustomer = (subTab: 'overview' | 'find' | 'requests' | 'saved' | 'profile') => {
    if (!isProfileSetupCompleted && subTab !== 'profile') {
      setActiveTab('customer');
      if (setCustomerSubTab) setCustomerSubTab('profile');
      return;
    }
    setActiveTab('customer');
    if (setCustomerSubTab) setCustomerSubTab(subTab);
  };

  const navigateSenior = (subTab: 'create' | 'update' | 'requests' | 'profile') => {
    if (!isProfileSetupCompleted && subTab !== 'create') {
      setActiveTab('provider');
      if (setSeniorSubTab) setSeniorSubTab('create');
      return;
    }
    setActiveTab('provider');
    if (setSeniorSubTab) setSeniorSubTab(subTab);
  };

  const customerNavItems = isProfileSetupCompleted
    ? [
        { id: 'overview', label: 'Dashboard', icon: Home },
        { id: 'find', label: 'Find a Service', icon: Search },
        { id: 'requests', label: 'My Requests', icon: Clock },
        { id: 'saved', label: 'Saved Providers', icon: Heart },
        { id: 'profile', label: 'My Profile', icon: User }
      ] as const
    : [
        { id: 'profile', label: 'Complete Customer Profile', icon: User }
      ] as const;

  const seniorNavItems = isProfileSetupCompleted
    ? [
        { id: 'update', label: 'Senior Dashboard', icon: Home },
        { id: 'requests', label: 'Incoming Requests', icon: Bell },
        { id: 'profile', label: 'My Profile', icon: User }
      ] as const
    : [
        { id: 'create', label: 'Complete Profile', icon: Home }
      ] as const;

  return (
    <div className="bg-white border-b border-blue-100 shadow-xs w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-wrap items-center justify-between min-h-[72px] py-3.5 gap-3 w-full">
          
          {/* Logo & Platform Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
            onClick={() => {
              if (userRole === 'SENIOR') navigateSenior('create');
              else if (userRole === 'CUSTOMER') navigateCustomer('overview');
              else setActiveTab('landing');
            }}
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
                  Silver<span className="text-blue-600">Hands</span>
                </span>
                <span className="bg-blue-100 text-blue-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-200">
                  India
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">Digital Livelihood Marketplace for Seniors</p>
            </div>
          </div>

          {/* Center Navigation Tabs: Fully Responsive & Always Visible with Flex-Wrap */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-blue-50/70 p-1.5 rounded-2xl border border-blue-100 min-w-0 max-w-full">
            
            {/* SENIOR ROLE NAVIGATION */}
            {userRole === 'SENIOR' && seniorNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === 'provider' && seniorSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateSenior(item.id)}
                  className={`px-3.5 py-2 rounded-xl font-extrabold transition-all text-xs flex items-center space-x-2 cursor-pointer min-h-[44px] flex-shrink-0 min-w-0 ${
                    isActive
                      ? item.id === 'requests'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-700 hover:text-blue-700 hover:bg-blue-100/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* CUSTOMER ROLE NAVIGATION */}
            {userRole === 'CUSTOMER' && customerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === 'customer' && customerSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateCustomer(item.id)}
                  className={`px-3.5 py-2 rounded-xl font-extrabold transition-all text-xs flex items-center space-x-2 cursor-pointer min-h-[44px] flex-shrink-0 min-w-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-700 hover:text-blue-700 hover:bg-blue-100/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Unauthenticated Landing Links */}
            {!userRole && (
              <button
                onClick={() => setActiveTab('landing')}
                className="px-4 py-2.5 rounded-xl font-extrabold text-xs text-blue-900 bg-white shadow-xs border border-blue-200 min-h-[44px] flex-shrink-0"
              >
                <span>{t.nav.home}</span>
              </button>
            )}

          </nav>

          {/* Right Actions: Professional Role Badge, Notifications Alert & Always Reachable Logout */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 ml-auto">
            {userRole && (
              <span className="inline-flex items-center space-x-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-extrabold text-blue-900 flex-shrink-0">
                {userRole === 'SENIOR' ? (
                  <>
                    <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Senior Provider</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Customer</span>
                  </>
                )}
              </span>
            )}

            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                title="View SilverHands Notifications & WhatsApp Alerts"
                className="relative px-3 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors border cursor-pointer bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 min-h-[44px] flex-shrink-0 shadow-xs"
              >
                <Bell className="w-4.5 h-4.5 text-amber-700 flex-shrink-0" />
                <span className="hidden sm:inline">Alerts</span>
                {unreadCount > 0 ? (
                  <span className="bg-rose-600 text-white font-black text-[11px] px-2 py-0.5 rounded-full border border-white">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="bg-amber-200/60 text-amber-900 font-bold text-[10px] px-1.5 py-0.5 rounded-md">
                    0
                  </span>
                )}
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout of SilverHands"
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors border cursor-pointer bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 min-h-[44px] flex-shrink-0 shadow-xs"
              >
                <LogOut className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Logout</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
