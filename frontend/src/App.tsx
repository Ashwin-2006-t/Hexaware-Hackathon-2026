import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { ProviderDashboard } from './components/ProviderDashboard';
import { CustomerMarketplace } from './components/CustomerMarketplace';
import { ProviderDetailModal } from './components/ProviderDetailModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { MessageSquareHeart, HeartHandshake, Sparkles, ShieldCheck } from 'lucide-react';
import type { ProviderProfile } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'provider' | 'customer' | 'assistant'>('landing');
  const [largeFont, setLargeFont] = useState(true); // Default to extra large accessible font
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleProfileCreated = (profile: ProviderProfile) => {
    setSelectedProviderId(profile.id);
  };

  return (
    <div className={`min-h-screen bg-[#FAF8F5] text-zinc-900 flex flex-col font-sans transition-all ${
      largeFont ? 'text-lg' : 'text-base'
    }`}>
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        largeFont={largeFont}
        setLargeFont={setLargeFont}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'landing' && (
          <LandingHero
            onShareSkills={() => setActiveTab('provider')}
            onFindService={() => setActiveTab('customer')}
          />
        )}

        {activeTab === 'provider' && (
          <ProviderDashboard onProfileCreated={handleProfileCreated} />
        )}

        {activeTab === 'customer' && (
          <CustomerMarketplace onSelectProvider={(id) => setSelectedProviderId(id)} />
        )}

        {activeTab === 'assistant' && (
          <div className="space-y-6">
            <div className="bg-teal-800 text-white rounded-3xl p-8 shadow-md">
              <h2 className="text-3xl font-extrabold">SilverHands AI Assistant</h2>
              <p className="text-teal-100 mt-2 font-medium">
                Ask any question about sharing your skills, setting up a profile, or finding trusted local providers.
              </p>
            </div>
            <CustomerMarketplace onSelectProvider={(id) => setSelectedProviderId(id)} />
          </div>
        )}

      </main>

      {/* Floating AI Assistant Launcher Button */}
      <button
        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
        className="fixed bottom-6 right-6 z-40 bg-teal-700 hover:bg-teal-800 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center space-x-2 border-2 border-teal-300 cursor-pointer"
        title="Open AI Assistant Support"
      >
        <MessageSquareHeart className="w-7 h-7" />
        <span className="font-extrabold text-sm hidden sm:inline-block">AI Support</span>
      </button>

      {/* AIAssistantDrawer Modal Widget */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* Provider Detail & Service Request Modal */}
      <ProviderDetailModal
        providerId={selectedProviderId}
        onClose={() => setSelectedProviderId(null)}
      />

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-300 mt-16 border-t border-zinc-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-white">SilverHands</span>
                <p className="text-xs text-zinc-400">Hexaware Mavericks Hackathon 2026 • Track 3 Solution</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs text-zinc-400 font-semibold">
              <span className="flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1" />
                Senior Citizen Accessible Design
              </span>
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 text-amber-400 mr-1" />
                Gemini AI Agent Intelligence
              </span>
            </div>

          </div>

          <div className="text-center text-xs text-zinc-500 border-t border-zinc-800/80 pt-6">
            © 2026 SilverHands India. Built for empowering senior citizens and homemakers across India.
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
