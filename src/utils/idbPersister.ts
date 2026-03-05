import { del, get, set, clear, keys } from 'idb-keyval';
import type { Persister } from '@tanstack/react-query-persist-client';

interface IDBPersisterOptions {
  dbName?: string;
  storeName?: string;
}

export function createIDBPersister({ dbName = 'tanstack-query', storeName = 'cache' }: IDBPersisterOptions = {}): Persister {
  return {
    async persistClient(persistClient) {
      try {
        await set('tanstack-query-cache', persistClient, { dbName, storeName });
      } catch (error) {
        console.error('Failed to persist cache to IDB:', error);
      }
    },
    async restoreClient() {
      try {
        const persistedClient = await get('tanstack-query-cache', { dbName, storeName });
        return persistedClient ?? undefined;
      } catch (error) {
        console.error('Failed to restore cache from IDB:', error);
        return undefined;
      }
    },
    async removeClient() {
      try {
        await del('tanstack-query-cache', { dbName, storeName });
      } catch (error) {
        console.error('Failed to remove cache from IDB:', error);
      }
    },
    async clear() {
      try {
        await clear({ dbName, storeName });
      } catch (error) {
        console.error('Failed to clear IDB cache:', error);
      }
    },
    async keys() {
      try {
        const keyList = await keys({ dbName, storeName });
        return keyList.map(key => String(key));
      } catch (error) {
        console.error('Failed to get keys from IDB:', error);
        return [];
      }
    }
  };
}