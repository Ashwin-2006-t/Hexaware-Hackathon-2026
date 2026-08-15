import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, HighContrastColors, Typography } from './src/theme/tokens'
import { translations, type Language } from './src/i18n/translations'
import { api } from './src/services/api'
import type { User } from './src/types'

// Screens & Components
import { Header } from './src/components/Header'
import { AuthModal } from './src/components/AuthModal'
import { SplashScreen } from './src/screens/SplashScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { OpportunitiesScreen } from './src/screens/OpportunitiesScreen'
import { MarketplaceScreen } from './src/screens/MarketplaceScreen'
import { SkillBuilderScreen } from './src/screens/SkillBuilderScreen'
import { AssistantScreen } from './src/screens/AssistantScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'

function AppContent() {
  const insets = useSafeAreaInsets()

  const [showSplash, setShowSplash] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>('home')
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['home'])
  const [showSkillBuilder, setShowSkillBuilder] = useState<boolean>(false)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)

  // Accessibility State
  const [highContrast, setHighContrast] = useState<boolean>(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [language, setLanguage] = useState<Language>('en')

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const theme = highContrast ? HighContrastColors : Colors
  const t = translations[language]

  const navigateToTab = (tab: string) => {
    setShowSkillBuilder(false)
    if (tab !== activeTab) {
      setNavigationHistory((prev) => {
        // Prevent duplicate consecutive entries in history
        if (prev[prev.length - 1] === tab) return prev
        return [...prev, tab]
      })
      setActiveTab(tab)
    }
  }

  // Handle hardware & in-app back navigation
  useEffect(() => {
    const onBackPress = () => {
      if (showAuthModal) {
        setShowAuthModal(false)
        return true
      }
      if (showSkillBuilder) {
        setShowSkillBuilder(false)
        return true
      }
      if (navigationHistory.length > 1) {
        const newHistory = [...navigationHistory]
        newHistory.pop() // remove current
        const previousTab = newHistory[newHistory.length - 1]
        setNavigationHistory(newHistory)
        setActiveTab(previousTab || 'home')
        return true
      }
      return false // exit app if at root home screen
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => backHandler.remove()
  }, [showAuthModal, showSkillBuilder, navigationHistory])

  useEffect(() => {
    bootstrapApp()
  }, [])

  const bootstrapApp = async () => {
    try {
      const me = await api.getMe()
      if (me) setCurrentUser(me)
    } catch {
      // unauthenticated
    }
  }

  const handleSignOut = async () => {
    await api.logout()
    setCurrentUser(null)
    navigateToTab('home')
  }

  if (showSplash) {
    return <SplashScreen highContrast={highContrast} onFinish={() => setShowSplash(false)} />
  }

  const navItems = [
    { id: 'home', label: t.navHome, icon: '🏠' },
    { id: 'opportunities', label: t.navOpportunities, icon: '📈' },
    { id: 'marketplace', label: t.navMarketplace, icon: '🛍️' },
    { id: 'assistant', label: t.navMentorBot, icon: '🤖' },
    { id: 'profile', label: t.navProfile, icon: '👤' },
  ]

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.navyDeep }]}>
      <StatusBar style="light" backgroundColor={theme.navyDeep} translucent={false} />

      {/* Top Safe Area Container for Header */}
      <View style={{ paddingTop: insets.top, backgroundColor: theme.navyDeep }}>
        <Header
          highContrast={highContrast}
          setHighContrast={setHighContrast}
          fontSize={fontSize}
          setFontSize={setFontSize}
          language={language}
          setLanguage={setLanguage}
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenProfile={() => navigateToTab('profile')}
        />
      </View>

      {/* Screen Body */}
      <KeyboardAvoidingView
        style={[styles.body, { backgroundColor: theme.bgCanvas }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {showSkillBuilder ? (
          <View style={{ flex: 1 }}>
            <View style={styles.subHeaderBar}>
              <TouchableOpacity
                onPress={() => setShowSkillBuilder(false)}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Back to previous screen"
              >
                <Text style={styles.backBtnText}>
                  ← Back to {navItems.find((n) => n.id === activeTab)?.label || 'App'}
                </Text>
              </TouchableOpacity>
            </View>
            <SkillBuilderScreen
              highContrast={highContrast}
              fontSize={fontSize}
              language={language}
              currentUser={currentUser}
              onProfileCreated={() => {
                setShowSkillBuilder(false)
                navigateToTab('marketplace')
              }}
              onClose={() => setShowSkillBuilder(false)}
            />
          </View>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                highContrast={highContrast}
                fontSize={fontSize}
                language={language}
                currentUser={currentUser}
                onNavigateTab={navigateToTab}
                onOpenSkillBuilder={() => setShowSkillBuilder(true)}
              />
            )}

            {activeTab === 'opportunities' && (
              <OpportunitiesScreen
                highContrast={highContrast}
                fontSize={fontSize}
                language={language}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'marketplace' && (
              <MarketplaceScreen
                highContrast={highContrast}
                fontSize={fontSize}
                language={language}
                currentUser={currentUser}
                onBookingSuccess={() => navigateToTab('profile')}
              />
            )}

            {activeTab === 'assistant' && (
              <AssistantScreen
                highContrast={highContrast}
                fontSize={fontSize}
                language={language}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileScreen
                highContrast={highContrast}
                setHighContrast={setHighContrast}
                fontSize={fontSize}
                setFontSize={setFontSize}
                language={language}
                setLanguage={setLanguage}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onSignOut={handleSignOut}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>

      {/* 5-Item Bottom Navigation Bar with Bottom Safe Area Inset */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.bgSurface,
            borderTopColor: theme.borderSubtle,
            paddingBottom: Math.max(insets.bottom, 6),
            height: 60 + Math.max(insets.bottom, 6),
          },
        ]}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id && !showSkillBuilder
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigateToTab(item.id)}
              style={styles.navButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{item.icon}</Text>
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? theme.indigoPrimary : theme.textMuted },
                  isActive && styles.navLabelActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user)
            navigateToTab('profile')
          }}
          highContrast={highContrast}
          fontSize={fontSize}
          language={language}
        />
      )}
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  subHeaderBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0A0F24',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    minHeight: 48,
    justifyContent: 'center',
  },
  backBtn: {
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#4099FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.7,
  },
  navIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  navLabelActive: {
    fontWeight: '900',
  },
})
