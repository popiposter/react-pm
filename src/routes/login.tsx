import { createFileRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { getDefaultTimesheetsSearch } from './_authenticated/timesheets';

export type LoginRedirectReason = 'auth-required' | 'expired' | 'refresh-failed';

const isLoginRedirectReason = (value: string): value is LoginRedirectReason =>
  ['auth-required', 'expired', 'refresh-failed'].includes(value);

const validateSearch = (search: Record<string, unknown>) => ({
  redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  reason:
    typeof search.reason === 'string' && isLoginRedirectReason(search.reason)
      ? search.reason
      : undefined,
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
