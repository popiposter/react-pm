import { describe, expect, it, vi } from 'vitest';

describe('auth transport factory', () => {
  it('uses demo transport by default', async () => {
    vi.resetModules();

    const { createAuthTransport } = await import('../features/auth/transports');
    const transport = createAuthTransport();

    expect(transport).toHaveProperty('login');
    expect(transport).toHaveProperty('refresh');
  });

  it('OneC transport returns a not configured error when backend is not wired', async () => {
    vi.resetModules();

    vi.stubEnv('VITE_AUTH_TRANSPORT', 'onec');

    const { createAuthTransport } = await import('../features/auth/transports');
    const transport = createAuthTransport();

    await expect(
      transport.login({
        username: 'demo.user',
        password: 'demo',
      })
    ).rejects.toMatchObject({
      code: 'TRANSPORT_NOT_CONFIGURED',
    });

    vi.unstubAllEnvs();
  });
});
