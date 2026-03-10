export type SyncTransportMode = 'local' | 'onec';

export interface SyncConfig {
  transport: SyncTransportMode;
  onecBaseUrl: string | null;
}

export const syncConfig: SyncConfig = {
  transport: (import.meta.env.VITE_SYNC_TRANSPORT as SyncTransportMode | undefined) ?? 'local',
  onecBaseUrl: import.meta.env.VITE_ONEC_BASE_URL ?? null,
};
