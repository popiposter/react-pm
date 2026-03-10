import { createFileRoute } from '@tanstack/react-router';
import { TimesheetsListSkeleton } from '../../components/pending/TimesheetsListSkeleton';
import { timesheetsQueryOptions } from '../../data/queryOptions';
import TimesheetsList from '../../pages/TimesheetsList';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const Route = createFileRoute('/_authenticated/timesheets')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(timesheetsQueryOptions(getCurrentMonth())),
  pendingComponent: TimesheetsListSkeleton,
  component: TimesheetsList,
});
