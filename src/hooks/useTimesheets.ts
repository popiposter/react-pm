import { useQuery } from '@tanstack/react-query';
import { getTimesheets, Timesheet } from '../api/mockBackend';

export const useTimesheets = (month: string) => {
  return useQuery<Timesheet[], Error>({
    queryKey: ['timesheets', month],
    queryFn: () => getTimesheets(month),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};