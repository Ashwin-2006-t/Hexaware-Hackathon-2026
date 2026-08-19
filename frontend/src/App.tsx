import { useState, useEffect } from 'react';
import { Navbar, type FontSize } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { ProviderDashboard } from './components/ProviderDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ProviderDetailModal } from './components/ProviderDetailModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthScreen } from './components/AuthScreen';
import { RoleSelector } from './components/RoleSelector';
import { HeartHandshake, ShieldCheck, Accessibility, Globe, MessageSquareHeart, Sparkles } from 'lucide-react';
import type { ProviderProfile, UserRole, NotificationRecord } from './types';
import { translations, type Language } from './i18n';
import { getStoredLocalAuthSession, setStoredLocalAuthSession, supabase } from './services/supabase';
import { saveUserRole, fetchUserProfile, fetchMyNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from './services/api';

export function App() {
  const [session, setSession] = useState<any | null>(() => getStoredLocalAuthSession());
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  const [activeTab, setActiveTab] = useState<'landing' | 'provider' | 'customer'>('landing');
  const [customerSubTab, setCustomerSubTab] = useState<'overview' | 'find' | 'requests' | 'saved' | 'profile'>('overview');
  const [seniorSubTab, setSeniorSubTab] = useState<'create' | 'update' | 'requests' | 'profile'>('create');

  const [language, setLanguage] = useState<Language>('en');
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('silverhands_font_size') as FontSize) || 'large';
  });
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('silverhands_high_contrast') === 'true';
  });
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [providerViewContext, setProviderViewContext] = useState<'customer' | 'owner'>('customer');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  const t = translations[language];

  const [isProfileSetupCompleted, setIsProfileSetupCompleted] = useState<boolean>(false);

  const loadNotifications = async () => {
    if (session && session.user) {
      try {
        const notifs = await fetchMyNotificationsApi();
        setNotifications(notifs);
      } catch (e) {
        // Silently fail if offline or unauthorized
      }
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 10000);
    return () => clearInterval(timer);
  }, [session]);

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-accessibility', fontSize);
    document.documentElement.setAttribute('data-high-contrast', isHighContrast ? 'true' : 'false');
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('silverhands_font_size', fontSize);
    localStorage.setItem('silverhands_high_contrast', String(isHighContrast));
  }, [fontSize, isHighContrast, language]);

  // Sync Supabase Auth session & User Role with profile setup state
  useEffect(() => {
    if (session && session.user) {
      fetchUserProfile(session.user.id).then(profile => {
        if (profile) {
          setUserRole(profile.role);
          const setupDone = Boolean(profile.profile_setup_completed);
          setIsProfileSetupCompleted(setupDone);
          localStorage.setItem(`silverhands_role_${session.user.id}`, profile.role);
          if (profile.role === 'SENIOR') {
            setActiveTab('provider');
            if (setupDone) {
              setSeniorSubTab('update');
            } else {
              setSeniorSubTab('create');
            }
          } else {
            setActiveTab('customer');
          }
        } else {
          const storedRole = localStorage.getItem(`silverhands_role_${session.user.id}`) as UserRole | null;
          if (storedRole) {
            setUserRole(storedRole);
            setActiveTab(storedRole === 'SENIOR' ? 'provider' : 'customer');
          }
        }
      }).catch(() => {
        const storedRole = localStorage.getItem(`silverhands_role_${session.user.id}`) as UserRole | null;
        if (storedRole) {
          setUserRole(storedRole);
          setActiveTab(storedRole === 'SENIOR' ? 'provider' : 'customer');
        }
      });
    }
  }, [session]);

  const handleAuthenticated = (newSession: any, role?: UserRole, profileSetupCompleted?: boolean) => {
    setSession(newSession);
    setStoredLocalAuthSession(newSession);
    const userId = newSession.user.id;
    const targetRole = role || (localStorage.getItem(`silverhands_role_${userId}`) as UserRole | null) || 'SENIOR';
    const setupDone = Boolean(profileSetupCompleted);
    setUserRole(targetRole);
    setIsProfileSetupCompleted(setupDone);
    localStorage.setItem(`silverhands_role_${userId}`, targetRole);
    
    if (targetRole === 'SENIOR') {
      setActiveTab('provider');
      if (setupDone) {
        setSeniorSubTab('update');
      } else {
        setSeniorSubTab('create');
      }
    } else {
      setActiveTab('customer');
    }
  };

  const handleRoleSelected = async (role: UserRole) => {
    if (!session || !session.user) return;
    const userId = session.user.id;
    const phone = session.user.phone || '';
    
    setUserRole(role);
    localStorage.setItem(`silverhands_role_${userId}`, role);
    setActiveTab(role === 'SENIOR' ? 'provider' : 'customer');

    try {
      await saveUserRole({
        userId,
        phone,
        role,
        fullName: role === 'SENIOR' ? 'Senior Citizen' : 'Customer'
      });
    } catch (err) {
      console.warn('[App] Non-critical role save error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setStoredLocalAuthSession(null);
    setSession(null);
    setUserRole(null);
    setSelectedProviderId(null);
    setIsProfileSetupCompleted(false);
    setActiveTab('landing');
  };

  const handleProfileCreated = (profile: ProviderProfile) => {
    localStorage.setItem('silverhands_my_provider_id', profile.id);
    setSelectedProviderId(profile.id);
    setProviderViewContext('owner');
    setIsProfileSetupCompleted(true);
    setSeniorSubTab('update');
  };

  // 1. Unauthenticated state -> Show Senior-Friendly Phone OTP Auth Screen
  if (!session) {
    return <AuthScreen language={language} onAuthenticated={handleAuthenticated} />;
  }

  // 2. Authenticated but no role selected -> Show Role Selector
  if (!userRole) {
    return <RoleSelector onSelectRole={handleRoleSelected} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col font-sans transition-all">
      
      {/* Unified Sticky Header Container (Predictable Single Sticky Bar, Top-0, Z-40) */}
      <header className="sticky top-0 z-40 bg-white border-b border-blue-100 shadow-xs">
        
        {/* Top Utility Bar: Page Language Switcher + Accessibility Controls */}
        <div className="bg-blue-900 text-white text-xs py-2 px-3 sm:px-6 border-b border-blue-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 w-full">
            
            {/* Left: Page Language Selector */}
            <div className="flex flex-wrap items-center gap-2 font-bold min-w-0">
              <Globe className="w-4 h-4 text-blue-300 flex-shrink-0" />
              <span className="text-blue-200 hidden sm:inline">{t.nav.pageLanguage}</span>
              <div className="flex flex-wrap bg-blue-950 p-1 rounded-xl border border-blue-700/60 gap-1">
                {(
                  [
                    { id: 'en', label: 'English' },
                    { id: 'ta', label: 'தமிழ்' },
                    { id: 'hi', label: 'हिंदी' }
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer min-h-[36px] ${
                      language === lang.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Accessibility Controls */}
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              {/* Font Size Selector */}
              <div className="flex items-center space-x-1.5">
                <Accessibility className="w-4 h-4 text-blue-300 hidden sm:inline flex-shrink-0" />
                <span className="text-blue-200 font-bold hidden sm:inline">{t.nav.fontSizeLabel}</span>
                <div className="flex flex-wrap bg-blue-950 p-1 rounded-xl border border-blue-700/60 gap-1">
                  {(
                    [
                      { id: 'standard', label: t.nav.standardText },
                      { id: 'large', label: t.nav.largeText },
                      { id: 'xlarge', label: t.nav.extraLarge },
                      { id: 'xlarge-voice', label: t.nav.extraLargeVoice }
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setFontSize(mode.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer min-h-[36px] ${
                        fontSize === mode.id
                          ? 'bg-blue-600 text-white shadow-xs border border-blue-400'
                          : 'text-blue-200 hover:text-white hover:bg-blue-800/60'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Contrast Independent Toggle */}
              <div className="flex items-center space-x-1.5">
                <span className="text-blue-200 font-bold hidden sm:inline">{t.nav.highContrastLabel}</span>
                <div className="flex bg-blue-950 p-1 rounded-xl border border-blue-700/60 gap-1">
                  <button
                    onClick={() => setIsHighContrast(false)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer min-h-[36px] ${
                      !isHighContrast
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-blue-200 hover:text-white hover:bg-blue-800/60'
                    }`}
                  >
                    {t.nav.highContrastOff}
                  </button>
                  <button
                    onClick={() => setIsHighContrast(true)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer min-h-[36px] ${
                      isHighContrast
                        ? 'bg-blue-500 text-white font-black shadow-xs border border-amber-300'
                        : 'text-blue-200 hover:text-white hover:bg-blue-800/60'
                    }`}
                  >
                    {t.nav.highContrastOn}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          customerSubTab={customerSubTab}
          setCustomerSubTab={setCustomerSubTab}
          seniorSubTab={seniorSubTab}
          setSeniorSubTab={setSeniorSubTab}
          language={language}
          setLanguage={setLanguage}
          fontSize={fontSize}
          setFontSize={setFontSize}
          isHighContrast={isHighContrast}
          setIsHighContrast={setIsHighContrast}
          userRole={userRole}
          userPhone={session?.user?.phone}
          isProfileSetupCompleted={isProfileSetupCompleted}
          onLogout={handleLogout}
          unreadCount={notifications.filter(n => !n.is_read).length}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        />

      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'landing' && (
          <LandingHero
            language={language}
            onShareSkills={() => {
              setActiveTab('provider');
              setSeniorSubTab('create');
            }}
            onFindService={() => {
              setActiveTab('customer');
              setCustomerSubTab('find');
            }}
          />
        )}

        {/* SENIOR WORKSPACE: Senior Profile Creation, Updates, & Incoming Requests */}
        {activeTab === 'provider' && (
          <ProviderDashboard
            language={language}
            activeSubTab={seniorSubTab}
            onTabChange={setSeniorSubTab}
            onProfileCreated={handleProfileCreated}
            onPreviewProfile={(id) => {
              setSelectedProviderId(id);
              setProviderViewContext('owner');
            }}
          />
        )}

        {/* CUSTOMER WORKSPACE: Find a Service Marketplace & My Requests Tracking */}
        {activeTab === 'customer' && (
          <CustomerDashboard
            language={language}
            activeSubTab={customerSubTab}
            onTabChange={setCustomerSubTab}
            isProfileSetupCompleted={isProfileSetupCompleted}
            onProfileSetupCompleted={() => {
              setIsProfileSetupCompleted(true);
              setCustomerSubTab('overview');
            }}
            onSelectProvider={(id) => {
              setSelectedProviderId(id);
              setProviderViewContext('customer');
            }}
          />
        )}

      </main>

      {/* Floating Global AI Assistant Launcher Button */}
      <button
        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-blue-700 hover:bg-blue-800 text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center space-x-2 border-2 border-blue-300 cursor-pointer min-h-[56px] min-w-[56px] focus:ring-4 focus:ring-blue-400"
        title={t.assistant.title}
        aria-label={t.nav.aiSupport}
      >
        <MessageSquareHeart className="w-7 h-7 text-amber-300 flex-shrink-0" />
        <span className="font-extrabold text-base hidden sm:inline-block tracking-wide">{t.nav.aiSupport}</span>
      </button>

      {/* Global AIAssistantDrawer Widget */}
      <AIAssistantDrawer
        language={language}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* Provider Detail & Service Request Modal */}
      <ProviderDetailModal
        language={language}
        providerId={selectedProviderId}
        viewContext={providerViewContext}
        onClose={() => setSelectedProviderId(null)}
        onEditMyProfile={() => {
          setSelectedProviderId(null);
          setActiveTab('provider');
        }}
      />

      {/* Proactive Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        userName={session?.user?.user_metadata?.full_name || 'Senior Provider'}
        userPhone={session?.user?.phone || '+91 98765 43210'}
        onNavigateToRequest={() => {
          if (userRole === 'SENIOR') {
            setActiveTab('provider');
            setSeniorSubTab('requests');
          } else {
            setActiveTab('customer');
            setCustomerSubTab('requests');
          }
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 mt-16 border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-white">SilverHands</span>
                <p className="text-xs text-slate-400">Digital Livelihood Marketplace for Seniors & Homemakers</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs text-slate-400 font-semibold">
              <span className="flex items-center">
                <ShieldCheck className="w-4 h-4 text-blue-400 mr-1" />
                Senior Citizen Accessible Design
              </span>
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 text-blue-400 mr-1" />
                Multi-Lingual Voice & AI Grounded Safety
              </span>
            </div>

          </div>

          <div className="text-center text-xs text-slate-500 border-t border-slate-800/80 pt-6">
            © 2026 SilverHands India. Built for empowering senior citizens and homemakers across India.
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
