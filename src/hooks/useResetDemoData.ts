import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appRepository } from '../data/repositories';

export const useResetDemoData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => appRepository.demo.resetDemoData(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
        queryClient.invalidateQueries({ queryKey: ['timesheet'] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status'] }),
      ]);
    },
  });
};
