import type { AuthSession, LoginPayload } from '../types';
import type { AuthTransport } from './types';

const SESSION_DURATION_HOURS = 8;

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

export const demoAuthTransport: AuthTransport = {
  async login(payload: LoginPayload) {
    const normalizedUsername = payload.username.trim();
    if (!normalizedUsername || !payload.password.trim()) {
      const error = new Error('Введите логин и пароль') as Error & {
        code: 'INVALID_CREDENTIALS';
        status: number;
      };
      error.code = 'INVALID_CREDENTIALS';
      error.status = 400;
      throw error;
    }

    await delay(400);
    return createDemoSession(normalizedUsername);
  },

  async refresh(session: AuthSession) {
    if (!session.tokens.refreshToken.trim()) {
      const error = new Error('Нет refresh token для обновления сессии') as Error & {
        code: 'REFRESH_UNAVAILABLE';
        status: number;
      };
      error.code = 'REFRESH_UNAVAILABLE';
      error.status = 400;
      throw error;
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
