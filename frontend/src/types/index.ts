export interface User {
  id: number
  email: string
  full_name: string
  role: 'provider' | 'customer' | 'admin'
  phone?: string
  bio?: string
  avatar_url?: string
  location_name?: string
  latitude?: number
  longitude?: number
  is_active?: boolean
  rating?: number
  total_reviews?: number
  verified_badge?: boolean
}

export interface Skill {
  id?: number
  category: string
  title: string
  description?: string
  proficiency_level: string
  years_experience: number
  hourly_rate: number
  verified?: boolean
}

export interface ServiceListing {
  id: number
  provider_id: number
  title: string
  category: string
  description: string
  price_per_hour: number
  location_name?: string
  latitude?: number
  longitude?: number
  status: string
  created_at: string
  provider_name?: string
  provider_avatar?: string
  rating?: number
}

export interface Booking {
  id: number
  customer_id: number
  provider_id: number
  service_id: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_price: number
  scheduled_date: string
  notes?: string
  created_at: string
  service_title?: string
  provider_name?: string
  customer_name?: string
}

export interface Review {
  id: number
  booking_id: number
  customer_id: number
  provider_id: number
  rating: number
  comment?: string
  created_at: string
  customer_name?: string
}

export interface ExtractedSkillItem {
  title: string
  category: string
  proficiency_level: string
  years_experience: number
  suggested_hourly_rate: number
  suggested_bio: string
  key_highlights: string[]
}

export interface SkillExtractionResponse {
  success: boolean
  skills: ExtractedSkillItem[]
  generated_profile_bio: string
  ai_mentor_tip: string
}

export interface MatchProviderResult {
  provider_id: number
  provider_name: string
  provider_avatar?: string
  service_id: number
  service_title: string
  category: string
  price_per_hour: number
  location_name: string
  distance_km: number
  match_score: number
  skills: string[]
  rating: number
  years_experience: number
  ai_reasoning: string
}

export interface SmartMatchResponse {
  query: string
  top_matches: MatchProviderResult[]
  total_found: number
}

export interface AssistantChatResponse {
  reply: string
  suggested_actions: string[]
}
