import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'livecircle_jwt_token';
const SERVER_URL_KEY = 'livecircle_server_url';

// Default host for local development based on platform
const DEFAULT_HOST = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

let cachedBaseUrl = DEFAULT_HOST;
let cachedToken: string | null = null;

export async function getBaseUrl(): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(SERVER_URL_KEY) : null;
      if (saved && saved.trim().length > 0) {
        cachedBaseUrl = saved.trim().replace(/\/$/, '');
        return cachedBaseUrl;
      }
      return cachedBaseUrl;
    }
    const saved = await SecureStore.getItemAsync(SERVER_URL_KEY);
    if (saved && saved.trim().length > 0) {
      cachedBaseUrl = saved.trim().replace(/\/$/, '');
      return cachedBaseUrl;
    }
  } catch {
    // Fallback if secure store unavailable
  }
  return cachedBaseUrl;
}

export async function setBaseUrl(url: string): Promise<void> {
  const cleanUrl = url.trim().replace(/\/$/, '');
  cachedBaseUrl = cleanUrl;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SERVER_URL_KEY, cleanUrl);
      }
      return;
    }
    await SecureStore.setItemAsync(SERVER_URL_KEY, cleanUrl);
  } catch (err) {
    console.error('Failed to save server URL in storage', err);
  }
}

export async function getStoredToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    if (Platform.OS === 'web') {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      cachedToken = token;
      return token;
    }
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    cachedToken = token;
    return token;
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null): Promise<void> {
  cachedToken = token;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
      }
      return;
    }
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to mutate token in storage', err);
  }
}

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.authenticated !== false) {
    const token = await getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      (typeof data === 'object' && data?.error) ||
      (typeof data === 'object' && data?.message) ||
      `HTTP error ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false,
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false,
    }),

  getMe: () => apiRequest('/auth/me'),

  // Me
  updatePushToken: (expoPushToken: string) =>
    apiRequest('/me/push-token', {
      method: 'PUT',
      body: JSON.stringify({ expoPushToken }),
    }),

  // Groups
  createGroup: (name: string) =>
    apiRequest('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  joinGroup: (code: string) =>
    apiRequest('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ code: code.toUpperCase() }),
    }),

  getGroups: () => apiRequest('/groups'),

  getGroupDetail: (groupId: string) => apiRequest(`/groups/${groupId}`),

  createGeofence: (groupId: string, data: { name: string; lat: number; lng: number; radiusM: number }) =>
    apiRequest(`/groups/${groupId}/geofences`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteGeofence: (groupId: string, geofenceId: string) =>
    apiRequest(`/groups/${groupId}/geofences/${geofenceId}`, {
      method: 'DELETE',
    }),
};
