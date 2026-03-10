import { useQuery } from '@tanstack/react-query';
import { timesheetsQueryOptions } from '../data/queryOptions';

export const useTimesheets = (month: string) => {
  return useQuery(timesheetsQueryOptions(month));
};
