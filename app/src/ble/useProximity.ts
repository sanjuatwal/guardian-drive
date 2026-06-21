import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';

import {
  asciiToBase64,
  GUARDIAN_AUTH_CHAR_UUID,
  GUARDIAN_SERVICE_UUID,
  OWNER_AUTH_TOKEN,
} from './guardianBle';

export type ProximityStatus =
  | 'idle'
  | 'permission-denied'
  | 'bluetooth-off'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'simulated-away'
  | 'error';

export type ProximityState = {
  status: ProximityStatus;
  carUnitConnected: boolean;
  rssi: number | null;
  error: string | null;
};

// One BleManager for the whole app (creating more than one is unsupported).
let sharedManager: BleManager | null = null;
function getManager(): BleManager {
  if (!sharedManager) sharedManager = new BleManager();
  return sharedManager;
}

const RSSI_POLL_MS = 4000;

async function ensureAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // Android 12+ (API 31) uses the new Bluetooth runtime permissions; older
  // versions gate BLE scanning behind fine location.
  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
  const needed =
    apiLevel >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const granted = await PermissionsAndroid.requestMultiple(needed);
  return needed.every((p) => granted[p] === PermissionsAndroid.RESULTS.GRANTED);
}

// Detects whether the owner's phone is near the Guardian Drive car unit by
// scanning for the unit's advertised BLE service, connecting, and writing the
// owner auth token. A live connection == phone nearby (Section 12). The car
// unit advertises and the phone scans because iOS background scanning is
// reliable while iOS background advertising is not.
export function useProximity(options?: { disabled?: boolean }): ProximityState {
  const disabled = options?.disabled ?? false;
  const [state, setState] = useState<ProximityState>({
    status: 'idle',
    carUnitConnected: false,
    rssi: null,
    error: null,
  });

  // Latest-wins guards so async callbacks from a torn-down effect are ignored.
  const disposedRef = useRef(false);
  const rssiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedDeviceIdRef = useRef<string | null>(null);
  // Set to true before a deliberate cancelDeviceConnection so the onDisconnected
  // callback knows not to kick off startScan() (which would immediately reconnect).
  const intentionalDisconnectRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    const manager = getManager();

    const patch = (next: Partial<ProximityState>) => {
      if (!disposedRef.current) setState((prev) => ({ ...prev, ...next }));
    };

    // Testing switch: drop any live link and stop scanning so the car unit
    // sees the owner phone as AWAY without physically moving the phone.
    if (disabled) {
      manager.stopDeviceScan();
      if (rssiTimerRef.current) clearInterval(rssiTimerRef.current);
      if (connectedDeviceIdRef.current) {
        intentionalDisconnectRef.current = true;
        manager.cancelDeviceConnection(connectedDeviceIdRef.current).catch(() => {});
        connectedDeviceIdRef.current = null;
      }
      setState({ status: 'simulated-away', carUnitConnected: false, rssi: null, error: null });
      return () => {
        disposedRef.current = true;
      };
    }

    const startScan = () => {
      patch({ status: 'scanning', carUnitConnected: false, rssi: null });
      manager.startDeviceScan([GUARDIAN_SERVICE_UUID], null, (error, device) => {
        if (disposedRef.current) return;
        if (error) {
          patch({ status: 'error', error: error.message });
          return;
        }
        if (device) {
          manager.stopDeviceScan();
          connect(device);
        }
      });
    };

    const connect = async (device: Device) => {
      try {
        patch({ status: 'connecting' });
        const connected = await device.connect();
        await connected.discoverAllServicesAndCharacteristics();

        // Prove this is the owner's phone by writing the shared token.
        await connected.writeCharacteristicWithResponseForService(
          GUARDIAN_SERVICE_UUID,
          GUARDIAN_AUTH_CHAR_UUID,
          asciiToBase64(OWNER_AUTH_TOKEN),
        );

        if (disposedRef.current) return;
        connectedDeviceIdRef.current = connected.id;
        patch({ status: 'connected', carUnitConnected: true, error: null });

        rssiTimerRef.current = setInterval(async () => {
          try {
            const refreshed = await connected.readRSSI();
            patch({ rssi: refreshed.rssi ?? null });
          } catch {
            // RSSI read can fail transiently; ignore and try again next tick.
          }
        }, RSSI_POLL_MS);

        connected.onDisconnected(() => {
          if (rssiTimerRef.current) clearInterval(rssiTimerRef.current);
          connectedDeviceIdRef.current = null;
          // If we intentionally canceled the connection (sim toggle), don't reconnect.
          if (intentionalDisconnectRef.current) {
            intentionalDisconnectRef.current = false;
            return;
          }
          if (disposedRef.current) return;
          startScan();
        });
      } catch (e) {
        if (disposedRef.current) return;
        patch({ status: 'error', error: e instanceof Error ? e.message : 'connect failed' });
        startScan();
      }
    };

    (async () => {
      const ok = await ensureAndroidPermissions();
      if (disposedRef.current) return;
      if (!ok) {
        patch({ status: 'permission-denied', error: 'Bluetooth permission denied' });
        return;
      }

      // Wait for the Bluetooth adapter to be on before scanning.
      const sub = manager.onStateChange((btState) => {
        if (disposedRef.current) return;
        if (btState === State.PoweredOn) {
          sub.remove();
          startScan();
        } else if (btState === State.PoweredOff) {
          patch({ status: 'bluetooth-off', carUnitConnected: false });
        }
      }, true);
    })();

    return () => {
      disposedRef.current = true;
      if (rssiTimerRef.current) clearInterval(rssiTimerRef.current);
      manager.stopDeviceScan();
    };
  }, [disabled]);

  return state;
}
