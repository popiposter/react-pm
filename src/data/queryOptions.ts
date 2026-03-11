import { queryOptions } from '@tanstack/react-query';
import { appRepository } from './repositories';

export const tasksQueryOptions = () =>
  queryOptions({
    queryKey: ['tasks'],
    queryFn: () => appRepository.tasks.getTasks(),
    staleTime: 1000 * 60 * 10,
  });

export const timesheetsQueryOptions = (period: string) =>
  queryOptions({
    queryKey: ['timesheets', period],
    queryFn: () => appRepository.timesheets.getTimesheets(period),
    staleTime: 1000 * 60 * 5,
  });

export const timesheetQueryOptions = (date: string) =>
  queryOptions({
    queryKey: ['timesheet', date],
    queryFn: () => appRepository.timesheets.getTimesheetByDate(date),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(date),
  });

export const syncStatusQueryOptions = () =>
  queryOptions({
    queryKey: ['sync-status'],
    queryFn: () => appRepository.sync.getStatus(),
    staleTime: 1000 * 15,
  });
