/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from '@tanstack/react-router';
import { TimesheetsListSkeleton } from '../../components/pending/TimesheetsListSkeleton';
import { timesheetsQueryOptions } from '../../data/queryOptions';
import TimesheetsList from '../../pages/TimesheetsList';

export type TimesheetStatusFilter = 'all' | 'draft' | 'submitted' | 'approved';

export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const isValidMonth = (value: string) => /^\d{4}-\d{2}$/.test(value);

const isValidStatus = (value: string): value is TimesheetStatusFilter =>
  ['all', 'draft', 'submitted', 'approved'].includes(value);

export const validateTimesheetsSearch = (search: Record<string, unknown>) => ({
  month:
    typeof search.month === 'string' && isValidMonth(search.month)
      ? search.month
      : getCurrentMonth(),
  status:
    typeof search.status === 'string' && isValidStatus(search.status) ? search.status : 'all',
  q: typeof search.q === 'string' ? search.q.trim().slice(0, 120) : '',
});

export const getDefaultTimesheetsSearch = () => ({
  month: getCurrentMonth(),
  status: 'all' as const,
  q: '',
});

export const Route = createFileRoute('/_authenticated/timesheets')({
  validateSearch: validateTimesheetsSearch,
  loaderDeps: ({ search }) => ({
    month: search.month,
  }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(timesheetsQueryOptions(deps.month)),
  pendingComponent: TimesheetsListSkeleton,
  component: TimesheetsList,
});
