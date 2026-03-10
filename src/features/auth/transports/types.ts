import type { AuthSession, LoginPayload } from '../types';

export interface AuthTransportError extends Error {
  code:
    | 'INVALID_CREDENTIALS'
    | 'REFRESH_UNAVAILABLE'
    | 'TRANSPORT_NOT_CONFIGURED'
    | 'TRANSPORT_ERROR';
  status?: number;
}

export interface AuthTransport {
  login(payload: LoginPayload): Promise<AuthSession>;
  refresh(session: AuthSession): Promise<AuthSession>;
}
