import type {
  User, ServiceListing, Booking, Review,
  SkillExtractionResponse, SmartMatchResponse, AssistantChatResponse
} from '../types'

const API_BASE = 'http://localhost:8000/api/v1'

export const api = {
  // System & Seed
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`)
    if (!res.ok) throw new Error('Backend health check failed')
    return res.json()
  },

  async seedDatabase() {
    const res = await fetch(`${API_BASE}/seed`, { method: 'POST' })
    if (!res.ok) throw new Error('Database seeding failed')
    return res.json()
  },

  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Login failed')
    }
    return res.json()
  },

  async signup(data: any) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Registration failed')
    }
    return res.json()
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`)
    if (!res.ok) throw new Error('Could not fetch user profile')
    return res.json()
  },

  // Services & Providers
  async getServices(category?: string, query?: string): Promise<ServiceListing[]> {
    let url = `${API_BASE}/services?`
    if (category) url += `category=${encodeURIComponent(category)}&`
    if (query) url += `query=${encodeURIComponent(query)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch services')
    return res.json()
  },

  async createService(data: { title: string; category: string; description: string; price_per_hour: number }, providerId: number = 1): Promise<ServiceListing> {
    const res = await fetch(`${API_BASE}/services?provider_id=${providerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create service')
    return res.json()
  },

  async getProviders(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/providers`)
    if (!res.ok) throw new Error('Failed to fetch providers')
    return res.json()
  },

  async getProviderProfile(providerId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/providers/${providerId}`)
    if (!res.ok) throw new Error('Failed to fetch provider details')
    return res.json()
  },

  // AI Endpoints
  async extractSkills(rawPrompt: string, preferredCategory?: string): Promise<SkillExtractionResponse> {
    const res = await fetch(`${API_BASE}/ai/extract-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_prompt: rawPrompt, preferred_category: preferredCategory })
    })
    if (!res.ok) throw new Error('AI Skill Extraction failed')
    return res.json()
  },

  async runSmartMatch(serviceQuery: string, category?: string, maxDistanceKm: number = 25.0): Promise<SmartMatchResponse> {
    const res = await fetch(`${API_BASE}/ai/smart-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_query: serviceQuery,
        category,
        max_distance_km: maxDistanceKm,
        customer_latitude: 37.7749,
        customer_longitude: -122.4194
      })
    })
    if (!res.ok) throw new Error('Smart matching engine failed')
    return res.json()
  },

  async chatWithSeniorMentor(message: string, context: string = 'senior_provider'): Promise<AssistantChatResponse> {
    const res = await fetch(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, user_context: context })
    })
    if (!res.ok) throw new Error('Senior mentor AI assistant failed')
    return res.json()
  },

  // Bookings & Reviews
  async createBooking(serviceId: number, providerId: number, totalPrice: number, scheduledDate: string, notes?: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings?customer_id=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        provider_id: providerId,
        total_price: totalPrice,
        scheduled_date: scheduledDate,
        notes
      })
    })
    if (!res.ok) throw new Error('Booking creation failed')
    return res.json()
  },

  async getUserBookings(userId: number = 1): Promise<Booking[]> {
    const res = await fetch(`${API_BASE}/bookings?user_id=${userId}`)
    if (!res.ok) throw new Error('Failed to fetch bookings')
    return res.json()
  },

  async updateBookingStatus(bookingId: number, status: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Failed to update booking status')
    return res.json()
  },

  async submitReview(bookingId: number, rating: number, comment?: string): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews?customer_id=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, rating, comment })
    })
    if (!res.ok) throw new Error('Failed to submit review')
    return res.json()
  }
}
