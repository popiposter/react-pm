import { createFileRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';

const demoRouteEnabled =
  import.meta.env.VITE_ENABLE_DEMO_ROUTE === 'true'
    ? true
    : import.meta.env.VITE_ENABLE_DEMO_ROUTE === 'false'
      ? false
      : import.meta.env.VITE_APP_MODE !== 'prod';

const DemoRouteComponent = demoRouteEnabled
  ? lazyRouteComponent(() => import('../pages/DemoPage'))
  : () => null;

export const Route = createFileRoute('/demo')({
  beforeLoad: () => {
    if (!demoRouteEnabled) {
      throw redirect({
        to: '/login',
        search: {
          redirect: undefined,
          reason: undefined,
        },
      });
    }
  },
  component: DemoRouteComponent,
});
