import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appRepository } from '../data/repositories';
import type { SyncRunResult } from '../data/repositories';

export const useRunSync = () => {
  const queryClient = useQueryClient();

  return useMutation<SyncRunResult, Error, void>({
    mutationFn: () => appRepository.sync.runSync(),
    onSuccess: (status) => {
      queryClient.setQueryData(['sync-status'], {
        pendingCount: status.pendingCount,
        lastQueuedAt: status.lastQueuedAt,
      });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
    },
  });
};
