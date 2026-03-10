import { syncConfig } from './config';
import { localSyncTransport } from './localSyncTransport';
import { OneCSyncTransport } from './onecSyncTransport';
import type { SyncTransport } from './types';

export { localSyncTransport } from './localSyncTransport';
export { syncConfig } from './config';
export { OneCSyncTransport } from './onecSyncTransport';
export type { SyncTransport } from './types';

export const createSyncTransport = (): SyncTransport => {
  if (syncConfig.transport === 'onec') {
    return new OneCSyncTransport({ baseUrl: syncConfig.onecBaseUrl });
  }

  return localSyncTransport;
};
