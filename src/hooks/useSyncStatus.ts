import { useQuery } from '@tanstack/react-query';
import { appRepository } from '../data/repositories';
import type { SyncStatus } from '../data/repositories';

export const useSyncStatus = () => {
  return useQuery<SyncStatus, Error>({
    queryKey: ['sync-status'],
    queryFn: () => appRepository.sync.getStatus(),
    staleTime: 1000 * 15,
  });
};
