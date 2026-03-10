import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AUTH_STORAGE_KEY, authService } from '../features/auth/auth-service';
import type { AuthSession } from '../features/auth/auth';

const createSession = (overrides?: Partial<AuthSession>): AuthSession => ({
  user: {
    id: 'demo-user',
    username: 'demo.user',
    displayName: 'Demo User',
  },
  tokens: {
    accessToken: 'token',
    refreshToken: 'refresh',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
  issuedAt: new Date().toISOString(),
  authStrategy: 'demo-password',
  ...overrides,
});

describe('authService', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restores a valid persisted session', () => {
    const session = createSession();
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

    expect(authService.restoreSession()).toEqual(session);
  });

  it('drops expired sessions during restore', () => {
    const session = createSession({
      tokens: {
        accessToken: 'token',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      },
    });
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

    expect(authService.restoreSession()).toBeNull();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('refreshes session tokens and extends expiration', async () => {
    const session = createSession({
      user: {
        id: 'demo-demo.user',
        username: 'demo.user',
        displayName: 'Demo User',
      },
    });

    const refreshed = await authService.refreshSession(session);

    expect(refreshed.user).toEqual(session.user);
    expect(refreshed.tokens.accessToken).not.toBe(session.tokens.accessToken);
    expect(new Date(refreshed.tokens.expiresAt).getTime()).toBeGreaterThan(
      new Date(session.tokens.expiresAt).getTime()
    );
  });

  it('flags sessions that are close to expiration', () => {
    const session = createSession({
      tokens: {
        accessToken: 'token',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
    });

    expect(authService.shouldRefreshSession(session)).toBe(true);
  });
});
