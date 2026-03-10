/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from './auth-service';
import type { AuthSession, LoginPayload, LogoutReason } from './types';

export interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  logoutReason: LogoutReason | null;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  refreshSession: () => Promise<AuthSession | null>;
  logout: (reason?: LogoutReason) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => authService.restoreSession());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null);

  useEffect(() => {
    if (!session) {
      authService.clearSession();
      return;
    }

    authService.persistSession(session);
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (authService.isSessionExpired(session)) {
      setSession(null);
      setLogoutReason('expired');
    }
  }, [session]);

  useEffect(() => {
    if (!session || !authService.shouldRefreshSession(session)) {
      return;
    }

    let cancelled = false;

    const runRefresh = async () => {
      setIsRefreshing(true);

      try {
        const refreshedSession = await authService.refreshSession(session);
        if (!cancelled) {
          setSession(refreshedSession);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setLogoutReason('refresh-failed');
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    };

    void runRefresh();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null && !authService.isSessionExpired(session),
      isRefreshing,
      logoutReason,
      async login(payload) {
        const nextSession = await authService.login(payload);
        setSession(nextSession);
        setLogoutReason(null);
        return nextSession;
      },
      async refreshSession() {
        if (!session) {
          return null;
        }

        setIsRefreshing(true);

        try {
          const refreshedSession = await authService.refreshSession(session);
          setSession(refreshedSession);
          setLogoutReason(null);
          return refreshedSession;
        } catch {
          setSession(null);
          setLogoutReason('refresh-failed');
          return null;
        } finally {
          setIsRefreshing(false);
        }
      },
      logout(reason = 'manual') {
        setSession(null);
        setLogoutReason(reason);
      },
    }),
    [isRefreshing, logoutReason, session]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

export type * from './types';

export const getAuthRedirectReason = (
  logoutReason: LogoutReason | null
): 'auth-required' | 'expired' | 'refresh-failed' => {
  if (logoutReason === 'expired' || logoutReason === 'refresh-failed') {
    return logoutReason;
  }

  return 'auth-required';
};
