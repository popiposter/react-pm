import type { AuthSession, LoginPayload } from '../types';
import type { AuthTransport, AuthTransportError } from './types';

export class OneCAuthTransport implements AuthTransport {
  constructor(private readonly options: { baseUrl: string | null }) {}

  async login(payload: LoginPayload): Promise<AuthSession> {
    void payload;
    throw this.createNotConfiguredError();
  }

  async refresh(session: AuthSession): Promise<AuthSession> {
    void session;
    throw this.createNotConfiguredError();
  }

  private createNotConfiguredError(): AuthTransportError {
    const hasBaseUrl = Boolean(this.options.baseUrl?.trim());
    const error = new Error(
      hasBaseUrl
        ? 'OneC auth transport пока не реализован'
        : 'Не задан VITE_ONEC_BASE_URL для OneC auth transport'
    ) as AuthTransportError;

    error.code = 'TRANSPORT_NOT_CONFIGURED';
    error.status = 503;
    return error;
  }
}
