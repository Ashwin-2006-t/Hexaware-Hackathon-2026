import type {
  ProviderProfile, MatchResult, ServiceRequest,
  SkillAnalysisResult, ProfileGenerationResult
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
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

export async function registerProvider(data: {
  name: string;
  email: string;
  location: string;
  latitude?: number;
  longitude?: number;
  title: string;
  bio: string;
  experience_years: number;
  availability: string;
  skills: string[];
  services: string[];
}): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/providers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to register provider profile');
  return res.json();
}

export async function analyzeSkills(description: string): Promise<SkillAnalysisResult> {
  const res = await fetch(`${API_BASE}/ai/analyze-skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });
  if (!res.ok) throw new Error('Failed to analyze skills');
  return res.json();
}

export async function generateProfile(data: {
  skills: string[];
  experience_years: number;
  services: string[];
}): Promise<ProfileGenerationResult> {
  const res = await fetch(`${API_BASE}/ai/generate-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
}): Promise<MatchResult[]> {
  const res = await fetch(`${API_BASE}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to search matches');
  return res.json();
}

export async function createServiceRequest(data: {
  customer_name?: string;
  customer_email?: string;
  title: string;
  description: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  preferred_date?: string;
}): Promise<ServiceRequest> {
  const res = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create service request');
  return res.json();
}

export async function askAIAssistant(message: string): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Failed to reach AI Assistant');
  return res.json();
}

export async function triggerSeed(): Promise<any> {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  return res.json();
}
