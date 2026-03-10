import { useQuery } from '@tanstack/react-query';
import { getTimesheetByDate, Timesheet } from '../api/mockBackend';

export const useTimesheet = (date: string) => {
  return useQuery<Timesheet | null, Error>({
    queryKey: ['timesheet', date],
    queryFn: () => getTimesheetByDate(date),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!date,
  });
};