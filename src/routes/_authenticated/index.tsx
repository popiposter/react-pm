import { createFileRoute, redirect } from '@tanstack/react-router';
import { getDefaultTimesheetsSearch } from './timesheets';

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => {
    throw redirect({ to: '/timesheets', search: getDefaultTimesheetsSearch() });
  },
});
