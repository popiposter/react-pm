import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Timesheet } from '../api/mockBackend';
import { appRepository, type SaveTimesheetError } from '../data/repositories';

export const useSaveTimesheet = () => {
  const queryClient = useQueryClient();

  return useMutation<Timesheet, SaveTimesheetError, Timesheet>({
    mutationFn: (timesheet) => appRepository.timesheets.saveTimesheet(timesheet),
    onSuccess: (savedTimesheet) => {
      // Update the timesheet in cache
      queryClient.setQueryData(['timesheet', savedTimesheet.date], savedTimesheet);

      // Invalidate timesheets list to refresh
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: (error: SaveTimesheetError) => {
      // Pass error through for conflict handling
      throw error;
    }
  });
};
