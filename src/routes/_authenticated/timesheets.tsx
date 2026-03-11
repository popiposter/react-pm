/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from '@tanstack/react-router';
import { lazyRouteComponent } from '@tanstack/react-router';
import { TimesheetsListSkeleton } from '../../components/pending/TimesheetsListSkeleton';
import { timesheetsQueryOptions } from '../../data/queryOptions';
import {
  createEnumSearchNormalizer,
  getCurrentMonthPeriod,
  normalizeMonthPeriod,
  normalizeTextQuery,
} from '../../features/documents/listSearch';

export type TimesheetStatusFilter = 'all' | 'draft' | 'submitted' | 'approved';
const normalizeTimesheetStatus = createEnumSearchNormalizer<TimesheetStatusFilter>(
  ['all', 'draft', 'submitted', 'approved'],
  'all'
);

export const validateTimesheetsSearch = (search: Record<string, unknown>) => ({
  period: normalizeMonthPeriod(search.period ?? search.month),
  status: normalizeTimesheetStatus(search.status),
  q: normalizeTextQuery(search.q),
});

export const getDefaultTimesheetsSearch = () => ({
  period: getCurrentMonthPeriod(),
  status: 'all' as const,
  q: '',
});

export const Route = createFileRoute('/_authenticated/timesheets')({
  validateSearch: validateTimesheetsSearch,
  loaderDeps: ({ search }) => ({
    period: search.period,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(timesheetsQueryOptions(deps.period)),
  pendingComponent: TimesheetsListSkeleton,
  component: lazyRouteComponent(() => import('../../pages/TimesheetsList')),
});
