export type AuthTransportMode = 'demo' | 'onec';

export interface AuthTransportConfig {
  transport: AuthTransportMode;
  onecBaseUrl: string | null;
}

export const authTransportConfig: AuthTransportConfig = {
  transport: (import.meta.env.VITE_AUTH_TRANSPORT as AuthTransportMode | undefined) ?? 'demo',
  onecBaseUrl: import.meta.env.VITE_ONEC_BASE_URL ?? null,
};
