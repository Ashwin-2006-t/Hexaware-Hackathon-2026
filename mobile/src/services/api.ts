import type {
  User,
  ServiceListing,
  Booking,
  Review,
  SkillExtractionResponse,
  ProfileBuilderResponse,
  BusinessGuidanceResponse,
  OpportunityFeedResponse,
  OpportunityInterestResponse,
  SmartMatchResponse,
  AssistantChatResponse
} from '../types'
import { StorageService } from './storage'

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function getApiBaseUrl(): Promise<string> {
  const customUrl = await StorageService.getItem('silverhands_custom_api_url')
  return (customUrl && customUrl.trim()) ? customUrl.trim() : DEFAULT_API_BASE_URL
}

export async function setApiBaseUrl(url: string): Promise<void> {
  if (url && url.trim()) {
    await StorageService.setItem('silverhands_custom_api_url', url.trim())
  } else {
    await StorageService.removeItem('silverhands_custom_api_url')
  }
}

async function getAuthToken(): Promise<string | null> {
  return await StorageService.getItem('silverhands_auth_token')
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = await getApiBaseUrl()
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`
    try {
      const errJson = await res.json()
      if (errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // fallback to generic
    }
    throw new Error(errorMsg)
  }

  return res.json() as Promise<T>
}

export const api = {
  getApiBaseUrl,
  setApiBaseUrl,

  // System Health
  async getHealth(): Promise<{ status: string; app_name: string; version: string }> {
    return request('/health')
  },

  // Seed Demo Data
  async seedDatabase(): Promise<{ status: string; message: string; seeded_counts: any }> {
    return request('/seed', { method: 'POST' })
  },

  // Authentication
  async signup(data: {
    email: string
    password: string
    full_name: string
    role?: string
    user_type?: string
    age?: number
    phone?: string
    location_name?: string
    languages?: string
    bio?: string
  }): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (res.token) {
      await StorageService.setItem('silverhands_auth_token', res.token)
    }
    return res
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    if (res.token) {
      await StorageService.setItem('silverhands_auth_token', res.token)
    }
    return res
  },

  async logout(): Promise<void> {
    await StorageService.removeItem('silverhands_auth_token')
  },

  async getMe(): Promise<User | null> {
    try {
      return await request<User>('/auth/me')
    } catch {
      return null
    }
  },

  // AI Services (Real Gemini)
  async extractSkills(prompt: string, category?: string): Promise<SkillExtractionResponse> {
    return request('/ai/extract-skills', {
      method: 'POST',
      body: JSON.stringify({
        raw_prompt: prompt,
        preferred_category: category
      })
    })
  },

  async generateProfileBio(
    extractedSkills: string[],
    experienceYears: number,
    location: string,
    name: string = 'Senior Provider'
  ): Promise<ProfileBuilderResponse> {
    return request('/ai/profile-builder', {
      method: 'POST',
      body: JSON.stringify({
        name,
        skills: extractedSkills,
        experience_years: experienceYears,
        location
      })
    })
  },

  async getBusinessGuidance(topic: string, location?: string): Promise<BusinessGuidanceResponse> {
    return request('/ai/business-guidance', {
      method: 'POST',
      body: JSON.stringify({
        query: topic,
        location: location || 'Mumbai, Maharashtra'
      })
    })
  },

  async chatWithSeniorMentor(
    message: string,
    roleContext: string = 'senior_provider',
    language: string = 'en'
  ): Promise<AssistantChatResponse> {
    return request('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({
        message,
        user_context: roleContext,
        language
      })
    })
  },

  async runSmartMatch(
    query: string,
    category?: string,
    maxDistanceKm?: number
  ): Promise<SmartMatchResponse> {
    return request('/ai/smart-match', {
      method: 'POST',
      body: JSON.stringify({
        service_query: query,
        category,
        max_distance_km: maxDistanceKm
      })
    })
  },

  // Services & Marketplace
  async getServices(
    category?: string,
    search?: string,
    location?: string,
    maxPrice?: number
  ): Promise<ServiceListing[]> {
    const params = new URLSearchParams()
    if (category && category !== 'All') params.append('category', category)
    if (search) params.append('search', search)
    if (location) params.append('location', location)
    if (maxPrice) params.append('max_price', maxPrice.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/services${query}`)
  },

  async createService(serviceData: {
    title: string
    category: string
    price_per_hour: number
    description: string
    location_name?: string
  }, providerId: number = 1): Promise<ServiceListing> {
    return request(`/services?provider_id=${providerId}`, {
      method: 'POST',
      body: JSON.stringify(serviceData)
    })
  },

  async deleteService(serviceId: number): Promise<{ success: boolean }> {
    return request(`/services/${serviceId}`, {
      method: 'DELETE'
    })
  },

  // Opportunities & Express Interest
  async getProviderOpportunities(providerId: number): Promise<OpportunityFeedResponse> {
    return request(`/providers/${providerId}/opportunities`)
  },

  async expressInterest(providerId: number, opportunityId: string | number): Promise<OpportunityInterestResponse> {
    return request(`/providers/${providerId}/opportunities/${opportunityId}/interest`, {
      method: 'POST'
    })
  },

  // Bookings & Reviews Lifecycle
  async getUserBookings(userId: number): Promise<Booking[]> {
    return request(`/bookings?user_id=${userId}`)
  },

  async createBooking(
    serviceId: number,
    providerId: number,
    totalPrice: number,
    scheduledDate: string,
    notes?: string,
    customerId: number = 1
  ): Promise<Booking> {
    return request('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        service_id: serviceId,
        provider_id: providerId,
        customer_id: customerId,
        total_price: totalPrice,
        scheduled_date: scheduledDate,
        notes
      })
    })
  },

  async updateBookingStatus(bookingId: number, status: string): Promise<Booking> {
    return request(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },

  async submitReview(
    bookingId: number,
    rating: number,
    comment?: string,
    customerId: number = 1
  ): Promise<Review> {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        booking_id: bookingId,
        rating,
        comment,
        customer_id: customerId
      })
    })
  },

  async updateProfile(userId: number, profileData: Partial<User>): Promise<User> {
    return request(`/providers/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }
}
