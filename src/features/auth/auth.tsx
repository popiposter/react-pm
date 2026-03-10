/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const AUTH_STORAGE_KEY = 'timesheets:auth-session';

export interface AuthSession {
  accessToken: string;
  username: string;
  displayName: string;
  issuedAt: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredSession = (): AuthSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    return null;
  }
};

const buildDisplayName = (username: string) => {
  const normalized = username.trim();
  if (!normalized) {
    return 'Пользователь';
  }

  return normalized
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      async login({ username, password }) {
        const normalizedUsername = username.trim();

        if (!normalizedUsername || !password.trim()) {
          throw new Error('Введите логин и пароль');
        }

        await new Promise((resolve) => setTimeout(resolve, 400));

        const nextSession: AuthSession = {
          accessToken: `demo-token-${normalizedUsername.toLowerCase()}`,
          username: normalizedUsername,
          displayName: buildDisplayName(normalizedUsername),
          issuedAt: new Date().toISOString(),
        };

        setSession(nextSession);
        return nextSession;
      },
      logout() {
        setSession(null);
      },
    }),
    [session]
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
