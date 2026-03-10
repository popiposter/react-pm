import { useQuery } from '@tanstack/react-query';
import { Timesheet } from '../api/mockBackend';
import { appRepository } from '../data/repositories';

export const useTimesheet = (date: string) => {
  return useQuery<Timesheet | null, Error>({
    queryKey: ['timesheet', date],
    queryFn: () => appRepository.timesheets.getTimesheetByDate(date),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!date,
  });
};
