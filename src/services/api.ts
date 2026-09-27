export const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('govtrack_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('govtrack_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('govtrack_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; pagination?: any; unreadCount?: number }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  };

  // If body is NOT FormData, set JSON Content-Type
  if (!(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({ success: false, message: 'Server response parsing failed' }));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      return {
        success: false,
        message: errorMsg,
        data: undefined
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network connection failed'
    };
  }
}
