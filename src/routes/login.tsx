import { createFileRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { getDefaultTimesheetsSearch } from './_authenticated/timesheets';

const validateSearch = (search: Record<string, unknown>) => ({
  redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
});

export const Route = createFileRoute('/login')({
  validateSearch,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/timesheets', search: getDefaultTimesheetsSearch() });
    }
  },
  component: lazyRouteComponent(() => import('../pages/LoginRoutePage')),
});
