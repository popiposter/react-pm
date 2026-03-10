import { QueryClient } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { createIDBPersister } from '../utils/idbPersister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
      retry: 3,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

type Persistor = {
  persistClient: (client: PersistedClient) => Promise<void>;
  restoreClient: () => Promise<PersistedClient | undefined>;
  removeClient: () => Promise<void>;
};

export const persister: Persistor | undefined =
  typeof window !== 'undefined' ? (createIDBPersister() as Persistor) : undefined;
