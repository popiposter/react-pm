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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
  issuedAt: string;
  authStrategy: 'demo-password' | 'password-token';
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

const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);

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

        const issuedAt = new Date();

        const nextSession: AuthSession = {
          user: {
            id: `demo-${normalizedUsername.toLowerCase()}`,
            username: normalizedUsername,
            displayName: buildDisplayName(normalizedUsername),
          },
          tokens: {
            accessToken: `demo-access-${normalizedUsername.toLowerCase()}`,
            refreshToken: `demo-refresh-${normalizedUsername.toLowerCase()}`,
            tokenType: 'Bearer',
            expiresAt: addHours(issuedAt, 8).toISOString(),
          },
          issuedAt: issuedAt.toISOString(),
          authStrategy: 'demo-password',
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
