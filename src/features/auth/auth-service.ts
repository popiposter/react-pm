import type { AuthSession, LoginPayload } from './types';
import { createAuthTransport } from './transports';
import type { AuthTransportError } from './transports';

export const AUTH_STORAGE_KEY = 'timesheets:auth-session';
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000;
const authTransport = createAuthTransport();

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
    try {
      return await authTransport.login(payload);
    } catch (error) {
      throw normalizeAuthTransportError(error);
    }
  },

  async refreshSession(session: AuthSession) {
    try {
      return await authTransport.refresh(session);
    } catch (error) {
      throw normalizeAuthTransportError(error);
    }
  },
};

const normalizeAuthTransportError = (error: unknown): AuthTransportError => {
  if (error instanceof Error && 'code' in error) {
    return error as AuthTransportError;
  }

  const normalized = new Error('Ошибка auth transport') as AuthTransportError;
  normalized.code = 'TRANSPORT_ERROR';
  normalized.status = 500;
  return normalized;
};
