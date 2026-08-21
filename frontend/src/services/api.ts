import type {
  ProviderProfile, MatchResult, ServiceRequest,
  SkillAnalysisResult, ProfileGenerationResult,
  ProviderProfileUpdate, NLPUpdateProposal, OpportunitySuggestion, SeniorOpportunitiesResponse,
  UserProfileRecord, UserRole, RequestStatus, ProfileStatus, ReviewRecord, NotificationRecord
} from '../types';
import { getStoredLocalAuthSession } from './supabase';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const session = getStoredLocalAuthSession();
  if (session && session.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
    headers['X-User-Id'] = session.user.id;
    headers['X-User-Phone'] = session.user.phone;
  }
  return headers;
}

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchUserProfile(userId: string): Promise<UserProfileRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

export async function checkUserPhone(phone: string): Promise<{ exists: boolean; role?: UserRole | null; profile_setup_completed?: boolean; normalized_phone: string }> {
  const res = await fetch(`${API_BASE}/users/check-phone?phone=${encodeURIComponent(phone)}`);
  if (!res.ok) return { exists: false, normalized_phone: phone };
  return res.json();
}

export async function registerUserAccount(data: {
  phone: string;
  role: UserRole;
  password: string;
  fullName?: string;
  location?: string;
}): Promise<{ access_token: string; user: UserProfileRecord }> {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function loginUserAccount(data: {
  phone: string;
  password: string;
}): Promise<{ access_token: string; user: UserProfileRecord }> {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function forgotPasswordApi(data: {
  phone: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/users/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update password');
  }
  return res.json();
}

export async function deleteMyAccountApi(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/account/me`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to delete account');
  }
  return res.json();
}

export async function saveUserRole(data: {
  userId: string;
  phone: string;
  role: UserRole;
  fullName?: string;
  location?: string;
}): Promise<UserProfileRecord> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to save user role');
  return res.json();
}

export async function fetchProviders(): Promise<ProviderProfile[]> {
  const res = await fetch(`${API_BASE}/providers`);
  if (!res.ok) throw new Error('Failed to fetch providers');
  return res.json();
}

export async function fetchProviderById(id: string): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/providers/${id}`);
  if (!res.ok) throw new Error('Failed to fetch provider detail');
  return res.json();
}

export async function fetchMyProviderProfile(userId: string): Promise<ProviderProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/providers/me?user_id=${userId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

export async function registerProvider(data: {
  name: string;
  email: string;
  location: string;
  latitude?: number;
  longitude?: number;
  title: string;
  bio: string;
  experience_years?: number | null;
  languages?: string;
  target_age_group?: string;
  availability?: string;
  service_delivery_mode?: string;
  skills: string[];
  services: string[];
  userId?: string;
}): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/providers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to register provider profile');
  return res.json();
}

export async function updateProvider(id: string, data: ProviderProfileUpdate): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/providers/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update provider profile');
  return res.json();
}

export async function updatePublishingStatus(id: string, status: ProfileStatus): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/providers/${id}/publishing-status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update publishing status');
  return res.json();
}

export async function deleteProvider(id: string): Promise<{ message: string; id: string }> {
  const res = await fetch(`${API_BASE}/providers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete provider profile');
  return res.json();
}

export async function nlpUpdateProvider(id: string, command: string): Promise<NLPUpdateProposal> {
  const res = await fetch(`${API_BASE}/providers/${id}/nlp-update`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ command })
  });
  if (!res.ok) throw new Error('Failed to process NLP update command');
  return res.json();
}

export async function fetchOpportunitySuggestions(id: string): Promise<OpportunitySuggestion[]> {
  const res = await fetch(`${API_BASE}/providers/${id}/opportunities`);
  if (!res.ok) throw new Error('Failed to fetch opportunity suggestions');
  return res.json();
}

export async function analyzeSkills(description: string): Promise<SkillAnalysisResult> {
  const res = await fetch(`${API_BASE}/ai/analyze-skills`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ description })
  });
  if (!res.ok) throw new Error('Failed to analyze skills');
  return res.json();
}

export async function generateProfile(data: {
  skills: string[];
  experience_years?: number | null;
  services: string[];
}): Promise<ProfileGenerationResult> {
  const res = await fetch(`${API_BASE}/ai/generate-profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to generate profile');
  return res.json();
}

export async function searchMatches(data: {
  query: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}): Promise<MatchResult[]> {
  const res = await fetch(`${API_BASE}/matches`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to search matches');
  return res.json();
}

export async function createServiceRequest(data: {
  customer_name?: string;
  customer_email?: string;
  provider_id?: string;
  title: string;
  description: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  preferred_date?: string;
  requirement_quantity?: number;
  requirement_unit?: string;
}): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create service request');
  return res.json();
}

export async function fetchMyCustomerRequests(): Promise<ServiceRequest[]> {
  const res = await fetch(`${API_BASE}/requests/my`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch customer requests');
  return res.json();
}

export async function fetchIncomingSeniorRequests(): Promise<ServiceRequest[]> {
  const res = await fetch(`${API_BASE}/requests/incoming`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch incoming requests');
  return res.json();
}

export async function cancelServiceRequest(requestId: string): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/cancel`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to cancel service request');
  }
  return res.json();
}

export async function sendSeniorQuoteApi(
  requestId: string,
  quote_amount: number,
  additional_charge: number = 0,
  note?: string
): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/quote`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quote_amount, additional_charge, note })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to send quote');
  }
  return res.json();
}

export async function acceptSeniorQuoteApi(requestId: string): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/quote/accept`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to accept quote');
  }
  return res.json();
}

export async function rejectSeniorQuoteApi(requestId: string): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/quote/reject`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to reject quote');
  }
  return res.json();
}

export async function customerConfirmPaymentApi(requestId: string): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/payment/confirm`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to confirm payment');
  }
  return res.json();
}

export async function seniorConfirmPaymentReceivedApi(requestId: string): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/payment/received`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to confirm payment received');
  }
  return res.json();
}

export async function updateRequestStatus(requestId: string, status: RequestStatus): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update request status');
  return res.json();
}

export async function createReview(data: {
  request_id: string;
  rating: number;
  comment?: string;
}): Promise<ReviewRecord> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return res.json();
}

export async function fetchProviderReviews(providerId: string): Promise<ReviewRecord[]> {
  const res = await fetch(`${API_BASE}/reviews/provider/${providerId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function askAIAssistant(message: string): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Failed to reach AI Assistant');
  return res.json();
}

export async function triggerSeed(): Promise<any> {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  return res.json();
}

export async function saveProviderApi(providerId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/saved-providers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ provider_id: providerId })
  });
  if (!res.ok) throw new Error('Failed to save provider');
  return res.json();
}

export async function removeSavedProviderApi(providerId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/saved-providers/${providerId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to remove saved provider');
  return res.json();
}

export async function fetchMySavedProvidersApi(): Promise<ProviderProfile[]> {
  const res = await fetch(`${API_BASE}/saved-providers/my`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch saved providers');
  return res.json();
}

export async function markProfileSetupCompleteApi(): Promise<any> {
  const res = await fetch(`${API_BASE}/users/profile-setup-complete`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to mark profile setup as completed');
  return res.json();
}

export interface SeniorDashboardStats {
  pending_requests_count: number;
  upcoming_services_count: number;
  completed_services_count: number;
  rating: number | null;
  total_reviews: number;
  profile_status: string;
  profile_setup_completed: boolean;
  upcoming_services: Array<{
    id: string;
    title: string;
    description?: string;
    customer_name: string;
    customer_location?: string;
    preferred_date?: string;
    status: string;
    agreed_price?: number;
    agreed_pricing_unit?: string;
    payment_status?: string;
  }>;
  recent_reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    created_at?: string;
    customer_name: string;
  }>;
}

export async function fetchSeniorDashboardStatsApi(): Promise<SeniorDashboardStats> {
  const res = await fetch(`${API_BASE}/providers/me/dashboard-stats`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch senior dashboard statistics');
  return res.json();
}

export async function incrementalUpdateProfileApi(data: {
  add_skills?: string[];
  remove_skills?: string[];
  add_services?: string[];
  remove_services?: string[];
  update_fields?: Record<string, any>;
}): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/providers/me/incremental-update`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to apply incremental profile update');
  return res.json();
}

export async function addProviderSkillApi(skillName: string): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/providers/me/skills`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: skillName, category: 'General' })
  });
  if (!res.ok) throw new Error('Failed to add skill');
  return res.json();
}

export async function removeProviderSkillApi(skillName: string): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/providers/me/skills/${encodeURIComponent(skillName)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to remove skill');
  return res.json();
}

export async function fetchMyOpportunitiesApi(): Promise<SeniorOpportunitiesResponse> {
  const res = await fetch(`${API_BASE}/providers/me/opportunities`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch opportunity suggestions');
  return res.json();
}

export async function fetchMyNotificationsApi(): Promise<NotificationRecord[]> {
  const res = await fetch(`${API_BASE}/notifications/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  return res.json();
}

export async function markNotificationReadApi(id: string): Promise<NotificationRecord> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

export async function markAllNotificationsReadApi(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
  return res.json();
}

// Virtual Room APIs
export async function createOrJoinVirtualRoomApi(bookingId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/virtual-rooms/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ booking_id: bookingId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to access virtual room' }));
    throw new Error(err.detail || 'Failed to access virtual room');
  }
  return res.json();
}

export async function fetchVirtualRoomApi(roomId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/virtual-rooms/${roomId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch virtual room details');
  return res.json();
}

export async function sendVirtualRoomMessageApi(roomId: string, content: string): Promise<any> {
  const res = await fetch(`${API_BASE}/virtual-rooms/${roomId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Failed to send room chat message');
  return res.json();
}

export async function endVirtualRoomSessionApi(roomId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/virtual-rooms/${roomId}/end`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to end virtual room session');
  return res.json();
}

// Service Call APIs
export async function initiateServiceCallApi(requestId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/calls/initiate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ request_id: requestId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to initiate call' }));
    throw new Error(err.detail || 'Failed to initiate call');
  }
  return res.json();
}

export async function endServiceCallApi(callId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/calls/${callId}/end`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to end call session');
  return res.json();
}

export async function fetchCallHistoryApi(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/calls/history`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  return res.json();
}

// ------------------------------------------------------------------
// AI SKILL INTERVIEW ROOM API METHODS
// ------------------------------------------------------------------

export async function startAIInterviewApi(
  selectedDomain: string, 
  selectedSkill: string,
  sessionType: 'REGISTRATION' | 'UPDATE' = 'REGISTRATION',
  language: 'en' | 'ta' | 'hi' = 'en'
): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/ai/interview/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      selected_domain: selectedDomain,
      selected_skill: selectedSkill,
      session_type: sessionType,
      language: language
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to start AI interview' }));
    throw new Error(err.detail || 'Failed to start AI interview');
  }
  return res.json();
}

export async function answerAIInterviewQuestionApi(
  sessionId: string,
  answer: string,
  inputType: 'TEXT' | 'VOICE' = 'TEXT'
): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/ai/interview/${sessionId}/answer`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      answer,
      input_type: inputType
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit answer' }));
    throw new Error(err.detail || 'Failed to submit answer');
  }
  return res.json();
}

export async function completeAIInterviewApi(sessionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/ai/interview/${sessionId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to complete AI interview' }));
    throw new Error(err.detail || 'Failed to complete AI interview');
  }
  return res.json();
}

export async function fetchAIInterviewSessionApi(sessionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/ai/interview/${sessionId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch interview session');
  return res.json();
}

export async function fetchMyAIInterviewsApi(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/v1/ai/interview/my-interviews`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  return res.json();
}

export async function approveAIInterviewProfileApi(
  sessionId: string,
  payload: {
    approved_skills: string[];
    approved_services: any[];
    experience_years?: number;
    bio_summary?: string;
  }
): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/ai/interview/${sessionId}/approve-profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to approve and save profile' }));
    throw new Error(err.detail || 'Failed to approve and save profile');
  }
  return res.json();
}

export async function updateMyLocationApi(payload: {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  readable_address?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/providers/me/location`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update location' }));
    throw new Error(err.detail || 'Failed to update location');
  }
  return res.json();
}

export async function clearAllNotificationsApi(): Promise<{ success: boolean; cleared_count: number }> {
  const res = await fetch(`${API_BASE}/notifications/me`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to clear notifications' }));
    throw new Error(err.detail || 'Failed to clear notifications');
  }
  return res.json();
}

export async function clearSingleNotificationApi(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to clear notification' }));
    throw new Error(err.detail || 'Failed to clear notification');
  }
  return res.json();
}

