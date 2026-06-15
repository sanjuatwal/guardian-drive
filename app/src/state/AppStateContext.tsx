import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { fetchAppState, liveSocketUrl } from '../api/client';
import { DeviceSummary, MockAppState } from '../types/app';
import { mockAppState } from './mockAppState';

export type ConnectionStatus = 'connecting' | 'live' | 'offline';

type AppStateContextValue = {
  state: MockAppState;
  connection: ConnectionStatus;
  refresh: () => Promise<void>;
  setState: React.Dispatch<React.SetStateAction<MockAppState>>;
  resetToMock: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000;
const SOCKET_RETRY_MS = 5_000;

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MockAppState>(mockAppState);
  const [connection, setConnection] = useState<ConnectionStatus>('connecting');

  const refresh = useCallback(async () => {
    try {
      const next = await fetchAppState();
      setState(next);
      setConnection('live');
    } catch {
      // Backend unreachable: keep showing the last known (or mock) state.
      setConnection('offline');
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Live push: any backend event triggers an immediate refetch.
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let socket: WebSocket | null = null;
    let disposed = false;

    const connect = () => {
      socket = new WebSocket(liveSocketUrl);
      socket.onmessage = () => {
        refresh();
      };
      socket.onclose = () => {
        if (!disposed) {
          retryRef.current = setTimeout(connect, SOCKET_RETRY_MS);
        }
      };
      socket.onerror = () => {
        socket?.close();
      };
    };
    connect();

    return () => {
      disposed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      socket?.close();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      state,
      connection,
      refresh,
      setState,
      resetToMock: () => setState(mockAppState),
    }),
    [state, connection, refresh],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

export function useDeviceSummary(): DeviceSummary {
  return useAppState().state.device;
}
