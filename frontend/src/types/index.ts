export type UserRole = 'SENIOR' | 'CUSTOMER';
export type ProfileStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';

export interface UserProfileRecord {
  id: string;
  auth_user_id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  profile_setup_completed?: boolean;
  location?: string;
  preferred_language?: string;
  created_at?: string;
}

export interface Skill {
  id?: string;
  name: string;
  category?: string;
  proficiency?: string;
}

export type DeliveryMode = 'IN_PERSON' | 'ONLINE' | 'BOTH';

export interface ServiceItem {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  price_range?: string;
  delivery_mode?: DeliveryMode | string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'provider' | 'customer' | 'SENIOR' | 'CUSTOMER';
  location?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export type PaymentStatus = 'NOT_REQUIRED' | 'PAYMENT_PENDING' | 'PAYMENT_CONFIRMATION' | 'PAID' | 'REFUNDED';
export type PricingUnit = 'per_service' | 'per_hour' | 'per_person' | 'per_session' | 'negotiable';
export type PaymentMethod = 'upi' | 'cash' | 'bank_transfer' | 'other';
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface ProviderProfile {
  id: string;
  user_id: string;
  title?: string;
  bio?: string;
  experience_years?: number | null;
  languages?: string | null;
  target_age_group?: string | null;
  availability: string;
  service_delivery_mode?: DeliveryMode | string;
  status?: ProfileStatus;
  readiness_score?: number;
  rating: number;
  total_reviews: number;
  price?: number;
  pricing_unit?: PricingUnit | string;
  payment_method?: PaymentMethod | string;
  payment_upi_id?: string | null;
  payment_instructions?: string | null;
  location?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  created_at?: string;
  user?: User;
  skills: Skill[];
  services: ServiceItem[];
}

export type RequestStatus = 'PENDING' | 'QUOTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED' | 'open';

export interface ServiceRequest {
  id: string;
  customer_id: string;
  provider_id?: string | null;
  title: string;
  description: string;
  category?: string;
  location?: string;
  delivery_mode?: DeliveryMode | string;
  latitude?: number;
  longitude?: number;
  preferred_date?: string;
  requirement_quantity?: number;
  requirement_unit?: string;
  status: RequestStatus;
  agreed_price?: number;
  agreed_pricing_unit?: PricingUnit | string;
  quote_amount?: number | null;
  quote_pricing_unit?: PricingUnit | string;
  quote_additional_charge?: number;
  quote_note?: string | null;
  quote_status?: QuoteStatus | string;
  quoted_at?: string | null;
  quote_responded_at?: string | null;
  payment_status?: PaymentStatus | string;
  payment_method?: PaymentMethod | string;
  payment_upi_id?: string | null;
  payment_instructions?: string | null;
  payment_confirmation_at?: string | null;
  message?: string;
  created_at?: string;
  customer?: User;
  provider?: ProviderProfile;
}

export interface ReviewRecord {
  id: string;
  request_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
  customer_name?: string;
  created_at?: string;
}

export interface MatchResult {
  id?: string;
  request_id: string;
  provider_id: string;
  score: number;
  distance_km?: number;
  matched_skills: string[];
  reasons: string[];
  explanation?: string;
  provider?: ProviderProfile;
}

export interface SkillAnalysisResult {
  skills: string[];
  category: string;
  experience_years?: number | null;
  target_age_group?: string | null;
  languages?: string[];
  services: string[];
  keywords: string[];
  suggested_title: string;
}

export interface ProfileGenerationResult {
  suggested_title: string;
  bio: string;
  service_descriptions: string[];
  keywords: string[];
}

export interface ProviderProfileUpdate {
  name?: string;
  title?: string;
  bio?: string;
  experience_years?: number | null;
  languages?: string;
  target_age_group?: string;
  availability?: string;
  service_delivery_mode?: DeliveryMode | string;
  location?: string;
  skills?: string[];
  services?: string[];
  status?: ProfileStatus;
  price?: number;
  pricing_unit?: PricingUnit | string;
  payment_method?: PaymentMethod | string;
  payment_upi_id?: string | null;
  payment_instructions?: string | null;
}

export interface NLPUpdateProposal {
  intent: string;
  summary: string;
  target_field?: string;
  value?: string;
  draft_update: ProviderProfileUpdate;
}

export interface OpportunitySuggestion {
  id: string;
  title: string;
  category: string;
  description: string;
  action_type: 'ADD_SERVICE' | 'UPDATE_PROFILE' | 'HIGHLIGHT_SKILL';
  suggested_value: string;
  reason: string;
  badge_label: string;
}

export interface OpportunitySuggestionItem {
  id: string;
  title: string;
  type: 'REAL_DEMAND' | 'SKILL_OPPORTUNITY' | string;
  matched_skills: string[];
  reason: string;
  demand_count?: number | null;
  time_window_days?: number | null;
  location?: string | null;
  category?: string | null;
  confidence: 'high' | 'medium' | string;
  suggested_action: 'ADD_SERVICE' | string;
  suggested_service_name: string;
  suggested_description?: string;
  badge_label: string;
  estimated_earning?: number;
  match_score?: number;
}

export interface SeniorOpportunitiesResponse {
  has_low_request_activity: boolean;
  recent_request_count: number;
  status_message?: string | null;
  suggestions: OpportunitySuggestionItem[];
}

export type NotificationType =
  | 'NEW_SERVICE_REQUEST'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_REJECTED'
  | 'QUOTE_RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'SERVICE_COMPLETED'
  | 'NEW_REVIEW'
  | 'OPPORTUNITY_SUGGESTION';

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  is_read: boolean;
  related_request_id?: string | null;
  whatsapp_message_id?: string | null;
  whatsapp_recipient?: string | null;
  whatsapp_type?: string | null;
  whatsapp_status?: string | null;
  whatsapp_phone?: string | null;
  whatsapp_message?: string | null;
  whatsapp_sent_at?: string | null;
  whatsapp_error_details?: string | null;
  created_at: string;
}
export interface VirtualRoomMessageRecord {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
}

export interface VirtualRoomRecord {
  id: string;
  booking_id: string;
  room_code: string;
  host_user_id: string;
  participant_user_id: string;
  host_name: string;
  participant_name: string;
  status: 'ACTIVE' | 'ENDED' | string;
  start_time: string;
  end_time?: string | null;
  service_title: string;
  messages: VirtualRoomMessageRecord[];
}

export interface CallLogRecord {
  id: string;
  request_id: string;
  caller_id: string;
  receiver_id: string;
  caller_name: string;
  receiver_name: string;
  masked_phone: string;
  call_link: string;
  status: string;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface AIInterviewMessageRecord {
  id: string;
  session_id: string;
  role: 'AI' | 'SENIOR' | string;
  message: string;
  input_type: 'TEXT' | 'VOICE' | string;
  question_number: number;
  created_at: string;
}

export interface AIInterviewResultRecord {
  id: string;
  session_id: string;
  detected_skills: string; // JSON string or array string
  experience_summary: string;
  capabilities: string;    // JSON string or array string
  confidence_score: number;
  suggested_services: string; // JSON string or array string
  evidence?: string | null;
  recommendation_reason?: string | null;
  created_at: string;
}

export interface AIInterviewSessionRecord {
  id: string;
  senior_id: string;
  session_type?: 'REGISTRATION' | 'UPDATE' | string;
  language?: 'en' | 'ta' | 'hi' | string;
  selected_domain: string;
  selected_skill: string;
  existing_profile_snapshot?: string | null;
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  started_at: string;
  completed_at?: string | null;
  overall_score?: number | null;
  summary?: string | null;
  messages: AIInterviewMessageRecord[];
  result?: AIInterviewResultRecord | null;
  next_question?: string | null;
  is_completed_ready?: boolean;
}
