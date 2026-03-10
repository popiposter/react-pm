import type { AuthSession, LoginPayload } from './types';

export const AUTH_STORAGE_KEY = 'timesheets:auth-session';
const SESSION_DURATION_HOURS = 8;
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const safeParseSession = (value: string | null): AuthSession | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    return null;
  }
};

const createDemoSession = (username: string): AuthSession => {
  const normalizedUsername = username.trim();
  const issuedAt = new Date();

  return {
    user: {
      id: `demo-${normalizedUsername.toLowerCase()}`,
      username: normalizedUsername,
      displayName: buildDisplayName(normalizedUsername),
    },
    tokens: {
      accessToken: `demo-access-${normalizedUsername.toLowerCase()}-${issuedAt.getTime()}`,
      refreshToken: `demo-refresh-${normalizedUsername.toLowerCase()}-${issuedAt.getTime()}`,
      tokenType: 'Bearer',
      expiresAt: addHours(issuedAt, SESSION_DURATION_HOURS).toISOString(),
    },
    issuedAt: issuedAt.toISOString(),
    authStrategy: 'demo-password',
  };
};

export const authService = {
  restoreSession(): AuthSession | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const session = safeParseSession(window.localStorage.getItem(AUTH_STORAGE_KEY));
    if (!session) {
      return null;
    }

    if (this.isSessionExpired(session)) {
      this.clearSession();
      return null;
    }

    return session;
  },

  persistSession(session: AuthSession) {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  },

  clearSession() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  isSessionExpired(session: AuthSession) {
    return new Date(session.tokens.expiresAt).getTime() <= Date.now();
  },

  shouldRefreshSession(session: AuthSession) {
    const expiresAt = new Date(session.tokens.expiresAt).getTime();
    return expiresAt - Date.now() <= REFRESH_THRESHOLD_MS;
  },

  async login(payload: LoginPayload) {
    const normalizedUsername = payload.username.trim();
    if (!normalizedUsername || !payload.password.trim()) {
      throw new Error('Введите логин и пароль');
    }

    await delay(400);
    return createDemoSession(normalizedUsername);
  },

  async refreshSession(session: AuthSession) {
    if (!session.tokens.refreshToken.trim()) {
      throw new Error('Нет refresh token для обновления сессии');
    }

    await delay(250);

    const refreshedSession = createDemoSession(session.user.username);
    return {
      ...refreshedSession,
      authStrategy: session.authStrategy,
      user: session.user,
    };
  },
};
