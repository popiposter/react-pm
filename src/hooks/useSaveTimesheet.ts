import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveTimesheet, Timesheet } from '../api/mockBackend';

interface SaveTimesheetError {
  status?: number;
  message?: string;
}

export const useSaveTimesheet = () => {
  const queryClient = useQueryClient();

  return useMutation<Timesheet, SaveTimesheetError, Timesheet>({
    mutationFn: saveTimesheet,
    onSuccess: (savedTimesheet) => {
      // Update the timesheet in cache
      queryClient.setQueryData(['timesheet', savedTimesheet.date], savedTimesheet);

      // Invalidate timesheets list to refresh
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
    onError: (error: SaveTimesheetError) => {
      // Pass error through for conflict handling
      throw error;
    }
  });
};
