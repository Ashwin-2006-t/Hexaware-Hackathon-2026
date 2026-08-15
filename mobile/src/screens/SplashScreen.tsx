import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'

interface SplashScreenProps {
  highContrast: boolean
  onFinish: () => void
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ highContrast, onFinish }) => {
  const theme = highContrast ? HighContrastColors : Colors

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish()
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.navyDeep }]}>
      <View style={styles.logoBadge}>
        <Text style={styles.logoIcon}>🤝</Text>
      </View>
      <Text style={[styles.brandTitle, { color: theme.textLight }]}>SilverHands</Text>
      <Text style={styles.versionTag}>v4.0 Mobile • Hexaware Hackathon 2026</Text>
      <Text style={styles.tagline}>Turning Lifelong Skills Into New Opportunities</Text>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.cyanAccent} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#4B32E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4B32E6',
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  logoIcon: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  versionTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4099FF',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
  loadingContainer: {
    marginTop: 32,
  },
})
