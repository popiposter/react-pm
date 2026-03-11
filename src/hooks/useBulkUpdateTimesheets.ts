import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Timesheet } from '../api/mockBackend';
import { appRepository } from '../data/repositories';

export const useBulkUpdateTimesheets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      timesheets,
      status,
    }: {
      timesheets: Timesheet[];
      status: Timesheet['status'];
    }) => {
      const savedTimesheets = await Promise.all(
        timesheets.map((timesheet) =>
          appRepository.timesheets.saveTimesheet({
            ...timesheet,
            status,
          })
        )
      );

      return { savedTimesheets, status };
    },
    onSuccess: ({ savedTimesheets }) => {
      for (const savedTimesheet of savedTimesheets) {
        queryClient.setQueryData(['timesheet', savedTimesheet.date], savedTimesheet);
      }

      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
  });
};
