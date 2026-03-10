import { useQuery } from '@tanstack/react-query';
import { timesheetQueryOptions } from '../data/queryOptions';

export const useTimesheet = (date: string) => {
  return useQuery(timesheetQueryOptions(date));
};
