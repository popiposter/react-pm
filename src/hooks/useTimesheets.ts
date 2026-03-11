import { useQuery } from '@tanstack/react-query';
import { timesheetsQueryOptions } from '../data/queryOptions';

export const useTimesheets = (period: string) => {
  return useQuery(timesheetsQueryOptions(period));
};
