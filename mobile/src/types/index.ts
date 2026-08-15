export interface User {
  id: number
  email: string
  full_name: string
  role: 'provider' | 'customer' | 'admin'
  user_type?: 'senior' | 'homemaker' | 'customer'
  age?: number
  phone?: string
  bio?: string
  avatar_url?: string
  location_name?: string
  latitude?: number
  longitude?: number
  languages?: string
  availability?: string
  is_published?: boolean
  is_active?: boolean
  rating?: number
  total_reviews?: number
  completed_services_count?: number
  trust_badge_level?: 'verified_senior' | 'community_star' | 'master_craftsman'
}

export interface ServiceListing {
  id: number
  provider_id: number
  title: string
  category: string
  description: string
  price_per_hour: number
  location_name?: string
  service_area?: string
  home_service?: boolean
  availability?: string
  status: string
  is_published?: boolean
  created_at: string
  provider_name?: string
  provider_avatar?: string
  provider_user_type?: string
  rating?: number
  total_reviews?: number
  completed_services?: number
  verified_badge?: boolean
  years_experience?: number
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
  ai_available?: boolean
  ai_message?: string
  skills: ExtractedSkillItem[]
  generated_profile_bio: string
  ai_mentor_tip: string
  is_ai_assisted?: boolean
}

export interface ProfileBuilderResponse {
  success: boolean
  ai_available: boolean
  headline: string
  about_text: string
  suggested_services: Array<{
    title: string
    category: string
    price_per_hour: number
  }>
  is_ai_assisted: boolean
  notice: string
}

export interface BusinessGuidanceResponse {
  success: boolean
  ai_available: boolean
  topic: string
  idea_summary: string
  target_customers: string
  pricing_strategy: string
  marketing_and_outreach: string
  first_three_steps: string[]
  packaging_and_hygiene: string
  disclaimer: string
}

export interface OpportunityItem {
  id: string
  title: string
  category: string
  customer_location: string
  distance_km: number
  budget_range: string
  match_score: number
  match_reasons: string[]
  posted_ago: string
  description: string
  is_applied?: boolean
}

export interface OpportunityFeedResponse {
  provider_id: number
  opportunities: OpportunityItem[]
  total: number
}

export interface OpportunityInterestResponse {
  success: boolean
  message: string
  opportunity_id: string
  provider_id: number
  is_applied: boolean
  applied_at: string
}

export interface MatchProviderResult {
  provider_id: number
  provider_name: string
  provider_avatar?: string
  provider_user_type?: string
  service_id: number
  service_title: string
  category: string
  price_per_hour: number
  location_name: string
  distance_km: number
  match_score: number
  match_reasons?: string[]
  breakdown?: {
    skill_score: number
    proximity_score: number
    rating_score: number
    exp_score: number
    reliability_score: number
  }
  skills: string[]
  rating: number
  years_experience: number
  completed_services?: number
  verified_badge?: boolean
  ai_reasoning: string
}

export interface SmartMatchResponse {
  query: string
  top_matches: MatchProviderResult[]
  total_found: number
}

export interface AssistantChatResponse {
  ai_available?: boolean
  ai_message?: string
  reply: string
  suggested_actions: string[]
}
