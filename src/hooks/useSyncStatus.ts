import { useQuery } from '@tanstack/react-query';
import { syncStatusQueryOptions } from '../data/queryOptions';

export const useSyncStatus = () => {
  return useQuery(syncStatusQueryOptions());
};
