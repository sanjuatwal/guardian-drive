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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${response.status}`);
  }
  return (await response.json()) as T;
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
