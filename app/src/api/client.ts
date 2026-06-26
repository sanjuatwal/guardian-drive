import Constants from 'expo-constants';

import { MaintenanceMode, MockAppState } from '../types/app';

export const DEVICE_ID = 'demo-device';
const BACKEND_PORT = 4000;

// The backend runs on the same machine as Metro, so reuse the Metro host
// (works on a physical phone over LAN without hardcoding the Mac's IP).
function resolveHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return 'localhost';
}

export const apiBaseUrl = `http://${resolveHost()}:${BACKEND_PORT}`;
export const liveSocketUrl = `ws://${resolveHost()}:${BACKEND_PORT}/live?deviceId=${DEVICE_ID}`;

// Set by AuthContext once a session token is available (on login/signup, or
// restored from SecureStore at launch). Attached to every request below;
// harmless for routes that don't require auth.
let authToken: string | null = null;
export function setAuthToken(token: string | null): void {
  authToken = token;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error && typeof body.error === 'string' ? body.error : `${init?.method ?? 'GET'} ${path} failed: ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

export type PublicUser = { id: string; name: string; email: string };
type AuthResponse = { user: PublicUser; token: string; expiresAt: number };

export function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  return request(`/api/v1/auth/signup`, { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request(`/api/v1/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logout(): Promise<{ ok: boolean }> {
  return request(`/api/v1/auth/logout`, { method: 'POST' });
}

export function fetchMe(): Promise<{ user: PublicUser }> {
  return request(`/api/v1/auth/me`);
}

export function fetchAppState(): Promise<MockAppState> {
  return request<MockAppState>(`/api/v1/devices/${DEVICE_ID}/state`);
}

export function confirmAlert(alertId: string): Promise<{ ok: boolean }> {
  return request(`/api/v1/alerts/${alertId}/confirm`, { method: 'POST' });
}

export function dismissAlert(alertId: string): Promise<{ ok: boolean }> {
  return request(`/api/v1/alerts/${alertId}/dismiss`, { method: 'POST' });
}

export function markVehicleRecovered(alertId: string): Promise<{ ok: boolean }> {
  return request(`/api/v1/alerts/${alertId}/recovered`, { method: 'POST' });
}

export function triggerSiren(): Promise<{ ok: boolean }> {
  return request(`/api/v1/devices/${DEVICE_ID}/commands/siren`, { method: 'POST' });
}

export function stopSiren(): Promise<{ ok: boolean }> {
  return request(`/api/v1/devices/${DEVICE_ID}/commands/siren`, { method: 'DELETE' });
}

export function setMaintenanceMode(mode: MaintenanceMode): Promise<{ ok: boolean }> {
  return request(`/api/v1/devices/${DEVICE_ID}/settings`, {
    method: 'PATCH',
    body: JSON.stringify({ maintenanceMode: mode }),
  });
}

// Backend generates the PDF and emails it directly to recipientEmail — the
// response never contains the file, only an ok/error ack.
export function sendPolicePack(
  alertId: string,
  recipientName: string,
  recipientEmail: string,
): Promise<{ ok: boolean }> {
  return request(`/api/v1/alerts/${alertId}/police-pack`, {
    method: 'POST',
    body: JSON.stringify({ recipientName, recipientEmail }),
  });
}
