import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage } from '../pages/LoginPage';
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
  component: LoginRoute,
});

function LoginRoute() {
  const search = Route.useSearch();

  return <LoginPage redirectTo={search.redirect} />;
}
