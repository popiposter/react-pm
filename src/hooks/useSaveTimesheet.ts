import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveTimesheet } from '../api/mockBackend';

export const useSaveTimesheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTimesheet,
    onSuccess: (savedTimesheet) => {
      // Update the timesheet in cache
      queryClient.setQueryData(['timesheet', savedTimesheet.date], savedTimesheet);

      // Invalidate timesheets list to refresh
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
    onError: (error: any) => {
      // Pass error through for conflict handling
      throw error;
    }
  });
};