import { del, get, set } from 'idb-keyval';
import type { Persister } from '@tanstack/react-query-persist-client';

export function createIDBPersister(): Persister {
  return {
    async persistClient(persistClient) {
      try {
        await set('tanstack-query-cache', persistClient);
      } catch (error) {
        console.error('Failed to persist cache to IDB:', error);
      }
    },
    async restoreClient() {
      try {
        const persistedClient = await get('tanstack-query-cache');
        return persistedClient ?? undefined;
      } catch (error) {
        console.error('Failed to restore cache from IDB:', error);
        return undefined;
      }
    },
    async removeClient() {
      try {
        await del('tanstack-query-cache');
      } catch (error) {
        console.error('Failed to remove cache from IDB:', error);
      }
    },
  };
}
