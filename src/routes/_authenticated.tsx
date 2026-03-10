import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import Layout from '../components/Layout';
import { NavigationBlocker } from '../components/NavigationBlocker';
import { RoutePending } from '../components/pending/RoutePending';
import { syncStatusQueryOptions } from '../data/queryOptions';
import { getAuthRedirectReason } from '../features/auth/auth';

function ProtectedLayout() {
  return (
    <NavigationBlocker>
      <Layout>
        <Outlet />
      </Layout>
    </NavigationBlocker>
  );
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
          reason: getAuthRedirectReason(context.auth.logoutReason),
        },
      });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(syncStatusQueryOptions()),
  pendingComponent: () => <RoutePending label="Подготавливаем рабочее место..." />,
  component: ProtectedLayout,
});
