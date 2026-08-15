import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'
import { translations, type Language } from '../i18n/translations'
import type { User } from '../types'

interface HeaderProps {
  highContrast: boolean
  setHighContrast: (hc: boolean) => void
  fontSize: 'normal' | 'large' | 'xlarge'
  setFontSize: (fs: 'normal' | 'large' | 'xlarge') => void
  language: Language
  setLanguage: (lang: Language) => void
  currentUser: User | null
  onOpenAuth: () => void
  onOpenProfile: () => void
}

export const Header: React.FC<HeaderProps> = ({
  highContrast,
  setHighContrast,
  fontSize,
  setFontSize,
  language,
  setLanguage,
  currentUser,
  onOpenAuth,
  onOpenProfile,
}) => {
  const t = translations[language]
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const defaultAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"

  return (
    <View style={[styles.container, { backgroundColor: theme.navyDeep }]}>
      {/* Top Accessibility Bar */}
      <View style={styles.topBar}>
        {/* Language Selector */}
        <View style={styles.langSelector}>
          {(['en', 'ta', 'hi'] as Language[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[
                styles.langButton,
                language === lang && { backgroundColor: theme.indigoPrimary },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${lang === 'en' ? 'English' : lang === 'ta' ? 'Tamil' : 'Hindi'}`}
            >
              <Text
                style={[
                  styles.langText,
                  { color: language === lang ? '#FFFFFF' : '#CBD5E1' },
                ]}
              >
                {lang === 'en' ? 'EN' : lang === 'ta' ? 'தமிழ்' : 'हिन्दी'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.accessibilityTools}>
          {/* Font Scaler (A, A+, A++) */}
          <View style={styles.fontScaler}>
            <TouchableOpacity
              onPress={() => setFontSize('normal')}
              style={[
                styles.fontButton,
                fontSize === 'normal' && { backgroundColor: theme.indigoPrimary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Normal font size"
            >
              <Text
                style={[
                  styles.fontBtnText,
                  { color: fontSize === 'normal' ? '#FFFFFF' : '#CBD5E1' },
                ]}
              >
                A
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFontSize('large')}
              style={[
                styles.fontButton,
                fontSize === 'large' && { backgroundColor: theme.indigoPrimary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Large font size"
            >
              <Text
                style={[
                  styles.fontBtnText,
                  { color: fontSize === 'large' ? '#FFFFFF' : '#CBD5E1' },
                ]}
              >
                A+
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFontSize('xlarge')}
              style={[
                styles.fontButton,
                fontSize === 'xlarge' && { backgroundColor: theme.indigoPrimary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Extra large font size"
            >
              <Text
                style={[
                  styles.fontBtnText,
                  { color: fontSize === 'xlarge' ? '#FFFFFF' : '#CBD5E1' },
                ]}
              >
                A++
              </Text>
            </TouchableOpacity>
          </View>

          {/* High Contrast Toggle */}
          <TouchableOpacity
            onPress={() => setHighContrast(!highContrast)}
            style={[
              styles.contrastToggle,
              highContrast && { backgroundColor: '#FACC15' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={highContrast ? 'Switch to standard theme' : 'Switch to high contrast'}
          >
            <Text
              style={[
                styles.contrastText,
                { color: highContrast ? '#000000' : '#E2E8F0' },
              ]}
            >
              {highContrast ? 'STD' : 'HC'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Header Brand & Profile Info */}
      <View style={styles.mainHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🤝</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.brandTitle, { fontSize: fs.lg }]}>SilverHands</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v4.2</Text>
              </View>
            </View>
            <Text style={[styles.tagline, { fontSize: fs.xs }]} numberOfLines={1} ellipsizeMode="tail">
              {t.tagline}
            </Text>
          </View>
        </View>

        {currentUser ? (
          <TouchableOpacity
            onPress={onOpenProfile}
            style={styles.userProfileBtn}
            accessibilityRole="button"
            accessibilityLabel="My Profile"
          >
            <Image
              source={{ uri: currentUser.avatar_url || defaultAvatar }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onOpenAuth}
            style={[styles.signInBtn, { backgroundColor: theme.indigoPrimary }]}
            accessibilityRole="button"
            accessibilityLabel={t.signIn}
          >
            <Text style={styles.signInBtnText}>{t.signIn}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#060A19',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  langButton: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  accessibilityTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fontScaler: {
    flexDirection: 'row',
    backgroundColor: '#060A19',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  fontButton: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  contrastToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contrastText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4B32E6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  brandTitle: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  versionBadge: {
    backgroundColor: '#0F2744',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4099FF',
  },
  versionText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4099FF',
  },
  tagline: {
    color: '#94A3B8',
    marginTop: 1,
  },
  userProfileBtn: {
    padding: 2,
    flexShrink: 0,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4099FF',
  },
  signInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minHeight: 36,
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
})
