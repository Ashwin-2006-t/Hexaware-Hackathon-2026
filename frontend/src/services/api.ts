import type {
  ServiceListing,
  User,
  Booking,
  Review,
  SkillExtractionResponse,
  SmartMatchResponse,
  AssistantChatResponse,
  ProfileBuilderResponse,
  BusinessGuidanceResponse,
  OpportunityFeedResponse,
  OpportunityInterestResponse
} from '../types'

const API_BASE = 'http://localhost:8000/api/v1'

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('silverhands_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const api = {
  // System Health
  async getHealth(): Promise<{ status: string; app_name: string }> {
    const res = await fetch(`${API_BASE}/health`)
    if (!res.ok) throw new Error('Backend health check failed')
    return res.json()
  },

  // Seed DB
  async seedDatabase(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/seed`, { method: 'POST' })
    if (!res.ok) throw new Error('Database seeding failed')
    return res.json()
  },

  // Auth
  async signup(data: {
    email: string
    password: string
    full_name: string
    role?: string
    user_type?: 'senior' | 'homemaker' | 'customer'
    age?: number
    phone?: string
    location_name?: string
    languages?: string
    bio?: string
  }): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Signup failed')
    }
    const result = await res.json()
    localStorage.setItem('silverhands_token', result.access_token)
    localStorage.setItem('silverhands_user', JSON.stringify(result.user))
    return result
  },

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Invalid email or password')
    }
    const result = await res.json()
    localStorage.setItem('silverhands_token', result.access_token)
    localStorage.setItem('silverhands_user', JSON.stringify(result.user))
    return result
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('silverhands_token')
    if (!token) {
      return null
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        localStorage.removeItem('silverhands_token')
        localStorage.removeItem('silverhands_user')
        return null
      }
      const user = await res.json()
      localStorage.setItem('silverhands_user', JSON.stringify(user))
      return user
    } catch {
      return null
    }
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('silverhands_token')
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})
    }
    localStorage.removeItem('silverhands_token')
    localStorage.removeItem('silverhands_user')
  },

  // Services & Providers
  async getServices(category?: string, query?: string, minPrice?: number, maxPrice?: number): Promise<ServiceListing[]> {
    let url = `${API_BASE}/services?`
    if (category) url += `category=${encodeURIComponent(category)}&`
    if (query) url += `query=${encodeURIComponent(query)}&`
    if (minPrice !== undefined) url += `min_price=${minPrice}&`
    if (maxPrice !== undefined) url += `max_price=${maxPrice}&`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch services')
    return res.json()
  },

  async createService(data: {
    title: string
    category: string
    description: string
    price_per_hour: number
    location_name?: string
    service_area?: string
    home_service?: boolean
    availability?: string
  }, providerId: number = 1): Promise<ServiceListing> {
    const res = await fetch(`${API_BASE}/services?provider_id=${providerId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create service')
    return res.json()
  },

  async updateService(serviceId: number, data: Partial<ServiceListing>): Promise<ServiceListing> {
    const res = await fetch(`${API_BASE}/services/${serviceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update service')
    return res.json()
  },

  async deleteService(serviceId: number): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/services/${serviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete service')
    return res.json()
  },

  async getProviderProfile(providerId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/providers/${providerId}`, {
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch provider profile')
    return res.json()
  },

  async updateProfile(providerId: number, data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/providers/${providerId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to update profile')
    }
    const updated = await res.json()
    localStorage.setItem('silverhands_user', JSON.stringify(updated))
    return updated
  },

  async uploadAvatar(file: File, userId: number = 1): Promise<{ status: string; avatar_url: string; message: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('silverhands_token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}/providers/upload-avatar?user_id=${userId}`, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to upload photo')
    }
    return res.json()
  },

  async getProviderOpportunities(providerId: number = 1): Promise<OpportunityFeedResponse> {
    const res = await fetch(`${API_BASE}/providers/${providerId}/opportunities`, {
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch opportunities feed')
    return res.json()
  },

  async expressInterest(providerId: number, opportunityId: string): Promise<OpportunityInterestResponse> {
    const res = await fetch(`${API_BASE}/providers/${providerId}/opportunities/${opportunityId}/interest`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to express interest')
    }
    return res.json()
  },

  // AI Service Calls (Real Gemini)
  async extractSkills(rawPrompt: string, preferredCategory?: string): Promise<SkillExtractionResponse> {
    const res = await fetch(`${API_BASE}/ai/extract-skills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ raw_prompt: rawPrompt, preferred_category: preferredCategory })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Skill extraction failed')
    }
    return res.json()
  },

  async buildProfileBio(data: {
    name: string
    skills: string[]
    experience_years: number
    location: string
    interests?: string
  }): Promise<ProfileBuilderResponse> {
    const res = await fetch(`${API_BASE}/ai/profile-builder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Profile builder failed')
    }
    return res.json()
  },

  async getBusinessGuidance(query: string, location: string = 'Mumbai, Maharashtra'): Promise<BusinessGuidanceResponse> {
    const res = await fetch(`${API_BASE}/ai/business-guidance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, location })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Business Guidance failed')
    }
    return res.json()
  },

  async runSmartMatch(serviceQuery: string, category?: string, maxDistanceKm: number = 25.0): Promise<SmartMatchResponse> {
    const res = await fetch(`${API_BASE}/ai/smart-match`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        service_query: serviceQuery,
        category,
        max_distance_km: maxDistanceKm,
        customer_latitude: 19.0760,
        customer_longitude: 72.8777
      })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Smart matching engine failed')
    }
    return res.json()
  },

  async chatWithSeniorMentor(message: string, context: string = 'senior_provider', language: string = 'en'): Promise<AssistantChatResponse> {
    const res = await fetch(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, user_context: context, language })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Senior mentor AI assistant failed')
    }
    return res.json()
  },

  // Bookings & Reviews
  async createBooking(serviceId: number, providerId: number, totalPrice: number, scheduledDate: string, notes?: string, customerId: number = 2): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings?customer_id=${customerId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        service_id: serviceId,
        provider_id: providerId,
        total_price: totalPrice,
        scheduled_date: scheduledDate,
        notes
      })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Booking creation failed')
    }
    return res.json()
  },

  async getUserBookings(userId: number = 1): Promise<Booking[]> {
    const res = await fetch(`${API_BASE}/bookings?user_id=${userId}`, {
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch bookings')
    return res.json()
  },

  async updateBookingStatus(bookingId: number, status: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Failed to update booking status')
    return res.json()
  },

  async submitReview(bookingId: number, rating: number, comment?: string, customerId: number = 2): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews?customer_id=${customerId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ booking_id: bookingId, rating, comment })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to submit review')
    }
    return res.json()
  }
}
