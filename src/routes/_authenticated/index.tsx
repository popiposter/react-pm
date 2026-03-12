import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/')({
  component: lazyRouteComponent(() => import('../../pages/DashboardPage')),
});
