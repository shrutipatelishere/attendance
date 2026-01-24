// API configuration
const API_BASE = 'http://localhost:3001/api';

// Check if API server is available
let useAPI = false;

export const checkAPIAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/stats`, { method: 'GET' });
    useAPI = response.ok;
    return useAPI;
  } catch {
    useAPI = false;
    return false;
  }
};

// Initialize API check
checkAPIAvailability();

// Generic fetch wrapper
const apiFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
};

// ============ LEADS API ============

export const apiGetLeads = async () => {
  return apiFetch<any[]>('/leads');
};

export const apiGetLead = async (id: string) => {
  return apiFetch<any>(`/leads/${id}`);
};

export const apiCreateLead = async (lead: any) => {
  return apiFetch<any>('/leads', {
    method: 'POST',
    body: JSON.stringify(lead),
  });
};

export const apiUpdateLead = async (id: string, lead: any) => {
  return apiFetch<any>(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(lead),
  });
};

export const apiDeleteLead = async (id: string) => {
  return apiFetch<{ success: boolean }>(`/leads/${id}`, {
    method: 'DELETE',
  });
};

export const apiBulkSaveLeads = async (leads: any[]) => {
  return apiFetch<{ success: boolean; count: number }>('/leads/bulk', {
    method: 'POST',
    body: JSON.stringify(leads),
  });
};

// ============ USERS API ============

export const apiGetUsers = async () => {
  return apiFetch<any[]>('/users');
};

export const apiGetUser = async (id: string) => {
  return apiFetch<any>(`/users/${id}`);
};

export const apiCreateUser = async (user: any) => {
  return apiFetch<any>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
};

export const apiUpdateUser = async (id: string, user: any) => {
  return apiFetch<any>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
};

export const apiDeleteUser = async (id: string) => {
  return apiFetch<{ success: boolean }>(`/users/${id}`, {
    method: 'DELETE',
  });
};

export const apiBulkSaveUsers = async (users: any[]) => {
  return apiFetch<{ success: boolean; count: number }>('/users/bulk', {
    method: 'POST',
    body: JSON.stringify(users),
  });
};

// ============ STATS API ============

export const apiGetStats = async () => {
  return apiFetch<{
    totalLeads: number;
    totalUsers: number;
    leadsByStatus: Record<string, number>;
    leadsByType: Record<string, number>;
    usersByRole: Record<string, number>;
  }>('/stats');
};

// Check if we should use API
export const isAPIAvailable = () => useAPI;
