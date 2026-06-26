import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { login as apiLogin, logout as apiLogout, signup as apiSignup, PublicUser, setAuthToken } from '../api/client';

const TOKEN_KEY = 'gd_auth_token';
const BIOMETRIC_KEY = 'gd_biometric_enabled';

// 'loading'           — restoring a saved session at launch
// 'signed-out'         — no session, show Login/SignUp
// 'locked'             — session exists but app just (re)launched and biometric
//                        unlock is required before showing the app
// 'enroll-biometrics'  — fresh login/signup this session, offering to turn on
//                        fingerprint/Face ID unlock for next time
// 'unlocked'           — authenticated and unlocked, show the app
export type AuthPhase = 'loading' | 'signed-out' | 'locked' | 'enroll-biometrics' | 'unlocked';

type AuthContextValue = {
  phase: AuthPhase;
  user: PublicUser | null;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  enableBiometrics: () => Promise<boolean>;
  skipBiometrics: () => void;
  // Step-up check for a specific sensitive action. Returns true if the user
  // is confirmed (or biometrics aren't available on this hardware, in which
  // case it fails open rather than blocking a real theft response).
  confirmWithBiometrics: (reason: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<AuthPhase>('loading');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
      setBiometricAvailable(Boolean(isEnrolled));

      const [savedToken, savedBiometric] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(BIOMETRIC_KEY),
      ]);
      const biometricOn = savedBiometric === '1';
      setBiometricEnabled(biometricOn);

      if (!savedToken) {
        setPhase('signed-out');
        return;
      }
      setAuthToken(savedToken);
      setPhase(biometricOn && isEnrolled ? 'locked' : 'unlocked');
    })();
  }, []);

  const persistSession = useCallback(async (nextUser: PublicUser, token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const afterAuth = useCallback(() => {
    setPhase(biometricAvailable && !biometricEnabled ? 'enroll-biometrics' : 'unlocked');
  }, [biometricAvailable, biometricEnabled]);

  // Creates the account only — does not log the user in. The backend issues a
  // token here too, but we intentionally discard it: signup should hand off
  // to the Login screen, and biometric enrollment is only offered after a
  // real login (not blurred together with account creation).
  const signup = useCallback(async (name: string, email: string, password: string) => {
    await apiSignup(name, email, password);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password);
      await persistSession(res.user, res.token);
      afterAuth();
    },
    [persistSession, afterAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Best-effort server-side revoke; clear local session regardless.
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    setAuthToken(null);
    setUser(null);
    setBiometricEnabled(false);
    setPhase('signed-out');
  }, []);

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Guardian Drive',
      disableDeviceFallback: false,
    });
    if (result.success) {
      setPhase('unlocked');
      return true;
    }
    return false;
  }, []);

  const enableBiometrics = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm your fingerprint to enable quick unlock',
    });
    if (!result.success) return false;
    await SecureStore.setItemAsync(BIOMETRIC_KEY, '1');
    setBiometricEnabled(true);
    setPhase('unlocked');
    return true;
  }, []);

  const skipBiometrics = useCallback(() => {
    setPhase('unlocked');
  }, []);

  const confirmWithBiometrics = useCallback(
    async (reason: string): Promise<boolean> => {
      if (!biometricAvailable) return true; // fail open: no hardware/enrollment on this device
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: reason });
      return result.success;
    },
    [biometricAvailable],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      phase,
      user,
      biometricEnabled,
      biometricAvailable,
      signup,
      login,
      logout,
      unlockWithBiometrics,
      enableBiometrics,
      skipBiometrics,
      confirmWithBiometrics,
    }),
    [
      phase,
      user,
      biometricEnabled,
      biometricAvailable,
      signup,
      login,
      logout,
      unlockWithBiometrics,
      enableBiometrics,
      skipBiometrics,
      confirmWithBiometrics,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
