import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { DeviceSummary, MockAppState } from '../types/app';
import { mockAppState } from './mockAppState';

type AppStateContextValue = {
  state: MockAppState;
  setState: React.Dispatch<React.SetStateAction<MockAppState>>;
  resetToMock: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MockAppState>(mockAppState);

  const value = useMemo(
    () => ({
      state,
      setState,
      resetToMock: () => setState(mockAppState),
    }),
    [state],
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
