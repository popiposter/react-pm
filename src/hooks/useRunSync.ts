import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appRepository } from '../data/repositories';
import type { SyncStatus } from '../data/repositories';

export const useRunSync = () => {
  const queryClient = useQueryClient();

  return useMutation<SyncStatus, Error, void>({
    mutationFn: () => appRepository.sync.runSync(),
    onSuccess: (status) => {
      queryClient.setQueryData(['sync-status'], status);
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
    },
  });
};
