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

export type LogoutReason = 'manual' | 'expired' | 'refresh-failed';
