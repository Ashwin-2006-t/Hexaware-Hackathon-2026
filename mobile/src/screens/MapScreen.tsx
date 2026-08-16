import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'
import { translations, type Language } from '../i18n/translations'
import { api } from '../services/api'
import type { MapItem, MapResponse, User } from '../types'

interface MapScreenProps {
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'xlarge'
  language: Language
  currentUser: User | null
  onNavigateTab: (tabId: string) => void
}

const PRESET_CITIES = [
  { name: 'Mumbai, MH', lat: 19.0760, lng: 72.8777 },
  { name: 'Chennai, TN', lat: 13.0827, lng: 80.2707 },
  { name: 'Bengaluru, KA', lat: 12.9716, lng: 77.5946 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Coimbatore, TN', lat: 11.0168, lng: 76.9558 }
]

const CATEGORIES = ['All', 'Cooking', 'Tutoring', 'Crafts', 'Gardening', 'Consulting']

export const MapScreen: React.FC<MapScreenProps> = ({
  highContrast,
  fontSize,
  language,
  currentUser,
  onNavigateTab
}) => {
  const t = translations[language] || translations.en
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: currentUser?.latitude || 19.0760,
    lng: currentUser?.longitude || 72.8777
  })
  const [cityName, setCityName] = useState<string>(currentUser?.location_name || 'Mumbai, MH')
  const [radius, setRadius] = useState<number>(10)
  const [category, setCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [mapData, setMapData] = useState<MapResponse | null>(null)
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null)
  const [interestSentId, setInterestSentId] = useState<string | null>(null)

  const fetchNearbyData = async () => {
    setLoading(true)
    try {
      const data = await api.getNearbyMapData({
        lat: coords.lat,
        lng: coords.lng,
        radius: radius,
        category: category === 'All' ? undefined : category,
        search: searchQuery.trim() || undefined,
        include_businesses: true
      })
      setMapData(data)
    } catch (e: any) {
      console.warn('Map data load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNearbyData()
  }, [coords.lat, coords.lng, radius, category])

  const handleExpressInterest = async (oppId: string) => {
    try {
      const res = await api.expressInterest(currentUser?.id || 1, oppId)
      setInterestSentId(oppId)
      Alert.alert('Interest Sent', res.message || 'The customer has been notified!')
    } catch (err: any) {
      Alert.alert('Notice', err.message)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bgCanvas }]}>
      {/* Header Banner */}
      <View style={[styles.headerCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textDark, fontSize: fs.xl }]}>
              📍 Live Discovery Radar
            </Text>
            <Text style={[styles.headerSub, { color: theme.textMuted, fontSize: fs.xs }]}>
              Explore providers, active gigs, and local businesses within {radius} km
            </Text>
          </View>
        </View>

        {/* City Switcher Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {PRESET_CITIES.map((city) => (
            <TouchableOpacity
              key={city.name}
              onPress={() => {
                setCoords({ lat: city.lat, lng: city.lng })
                setCityName(city.name)
              }}
              style={[
                styles.cityChip,
                cityName === city.name && { backgroundColor: theme.indigoPrimary, borderColor: theme.indigoPrimary }
              ]}
            >
              <Text
                style={[
                  styles.cityChipText,
                  { color: cityName === city.name ? '#FFFFFF' : theme.textSecondary, fontSize: fs.xs }
                ]}
              >
                {city.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: theme.bgSubtle, borderColor: theme.borderSubtle }]}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchNearbyData}
            placeholder="Search providers, food, tailoring..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.textDark, fontSize: fs.sm }]}
          />
          <TouchableOpacity onPress={fetchNearbyData} style={[styles.searchBtn, { backgroundColor: theme.indigoPrimary }]}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: fs.xs }}>Go</Text>
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.catPill,
                category === cat && { backgroundColor: theme.indigoPrimary }
              ]}
            >
              <Text
                style={[
                  styles.catPillText,
                  { color: category === cat ? '#FFFFFF' : theme.textMuted, fontSize: fs.xs }
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Radius Selectors */}
        <View style={styles.radiusRow}>
          <Text style={[styles.radiusLabel, { color: theme.textMuted, fontSize: fs.xs }]}>Radius:</Text>
          {[2, 5, 10, 15, 25].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRadius(r)}
              style={[
                styles.radiusBtn,
                radius === r && { backgroundColor: '#0A0F24', borderColor: '#4099FF' }
              ]}
            >
              <Text style={{ color: radius === r ? '#4099FF' : theme.textSecondary, fontSize: fs.xs, fontWeight: 'bold' }}>
                {r}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Counts Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.badgeItem}>
          <View style={[styles.dot, { backgroundColor: '#4B32E6' }]} />
          <Text style={[styles.badgeText, { color: theme.textDark, fontSize: fs.xs }]}>
            Providers ({mapData?.counts?.providers || 0})
          </Text>
        </View>
        <View style={styles.badgeItem}>
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.badgeText, { color: theme.textDark, fontSize: fs.xs }]}>
            Gigs ({mapData?.counts?.opportunities || 0})
          </Text>
        </View>
        <View style={styles.badgeItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.badgeText, { color: theme.textDark, fontSize: fs.xs }]}>
            Local Places ({mapData?.counts?.real_businesses || 0})
          </Text>
        </View>
      </View>

      {/* Items List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.indigoPrimary} />
          <Text style={{ color: theme.textMuted, marginTop: 8, fontSize: fs.xs }}>
            Scanning live neighborhood...
          </Text>
        </View>
      ) : mapData?.items && mapData.items.length > 0 ? (
        <View style={styles.itemsList}>
          {mapData.items.map((item) => {
            const isProvider = item.marker_type === 'silverhands_provider'
            const isOpportunity = item.marker_type === 'silverhands_opportunity'
            const isBusiness = item.marker_type === 'real_business'

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: theme.bgSurface, borderColor: theme.borderSubtle }
                ]}
              >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.typeBadge,
                      isProvider && { backgroundColor: '#EEF2FF' },
                      isOpportunity && { backgroundColor: '#FEF3C7' },
                      isBusiness && { backgroundColor: '#ECFDF5' }
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        isProvider && { color: '#4B32E6' },
                        isOpportunity && { color: '#B45309' },
                        isBusiness && { color: '#047857' }
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>

                  <Text style={[styles.distanceText, { color: theme.textMuted, fontSize: fs.xs }]}>
                    📍 {item.distance_km} km away
                  </Text>
                </View>

                {/* Title */}
                <Text style={[styles.itemTitle, { color: theme.textDark, fontSize: fs.base }]}>
                  {item.name || item.title}
                </Text>

                {/* Description or Bio */}
                {(item.bio || item.description || item.address) && (
                  <Text
                    numberOfLines={2}
                    style={[styles.itemDesc, { color: theme.textSecondary, fontSize: fs.xs }]}
                  >
                    {item.bio || item.description || item.address}
                  </Text>
                )}

                {/* Footer Action Row */}
                <View style={styles.cardFooter}>
                  {isProvider && (
                    <>
                      <Text style={[styles.priceTag, { fontSize: fs.sm }]}>
                        ₹{item.hourly_rate || 350}/hr ⭐ {item.rating || 4.9}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onNavigateTab('marketplace')}
                        style={[styles.actionBtn, { backgroundColor: theme.indigoPrimary }]}
                      >
                        <Text style={styles.actionBtnText}>View & Book</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {isOpportunity && (
                    <>
                      <Text style={[styles.priceTag, { color: '#B45309', fontSize: fs.xs }]}>
                        Budget: {item.budget_range}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleExpressInterest(String(item.id))}
                        disabled={interestSentId === String(item.id)}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: interestSentId === String(item.id) ? '#10B981' : '#F59E0B' }
                        ]}
                      >
                        <Text style={styles.actionBtnText}>
                          {interestSentId === String(item.id) ? '✓ Applied' : 'Express Interest'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {isBusiness && (
                    <>
                      <Text style={[styles.priceTag, { color: '#047857', fontSize: fs.xs }]}>
                        Category: {item.sub_type || item.category}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 10, fontStyle: 'italic' }}>
                        OSM Local Place
                      </Text>
                    </>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 32 }}>🧭</Text>
          <Text style={[styles.emptyTitle, { color: theme.textDark, fontSize: fs.base }]}>
            No Places Found Nearby
          </Text>
          <Text style={[styles.emptySub, { color: theme.textMuted, fontSize: fs.xs }]}>
            Try expanding the search radius or choosing another city.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  headerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12
  },
  headerRow: {
    marginBottom: 10
  },
  headerTitle: {
    fontWeight: '900'
  },
  headerSub: {
    marginTop: 2
  },
  chipRow: {
    flexDirection: 'row',
    marginVertical: 8
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 6
  },
  cityChipText: {
    fontWeight: '700'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginTop: 6
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8
  },
  searchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: 10
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6
  },
  catPillText: {
    fontWeight: '700'
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6
  },
  radiusLabel: {
    fontWeight: '700',
    marginRight: 4
  },
  radiusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 12
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  badgeText: {
    fontWeight: '600'
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  itemsList: {
    gap: 12,
    paddingBottom: 32
  },
  itemCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  distanceText: {
    fontWeight: '600'
  },
  itemTitle: {
    fontWeight: '800'
  },
  itemDesc: {
    lineHeight: 18
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  priceTag: {
    fontWeight: '800',
    color: '#4B32E6'
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8
  },
  emptyTitle: {
    fontWeight: '800'
  },
  emptySub: {
    textAlign: 'center'
  }
})
