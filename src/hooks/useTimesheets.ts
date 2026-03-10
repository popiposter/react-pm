import { useQuery } from '@tanstack/react-query';
import { Timesheet } from '../api/mockBackend';
import { appRepository } from '../data/repositories';

export const useTimesheets = (month: string) => {
  return useQuery<Timesheet[], Error>({
    queryKey: ['timesheets', month],
    queryFn: () => appRepository.timesheets.getTimesheets(month),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
