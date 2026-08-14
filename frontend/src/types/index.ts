export interface Skill {
  id?: string;
  name: string;
  category?: string;
  proficiency?: string;
}

export interface ServiceItem {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  price_range?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'provider' | 'customer';
  location?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  title?: string;
  bio?: string;
  experience_years: number;
  availability: string;
  rating: number;
  total_reviews: number;
  created_at?: string;
  user?: User;
  skills: Skill[];
  services: ServiceItem[];
}

export interface ServiceRequest {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  preferred_date?: string;
  status: string;
  created_at?: string;
  customer?: User;
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
  experience_years: number;
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
