import { createFileRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { appConfig } from '../config/app-config';

export const Route = createFileRoute('/demo')({
  beforeLoad: () => {
    if (!appConfig.features.demoRoute) {
      throw redirect({
        to: '/login',
        search: {
          redirect: undefined,
          reason: undefined,
        },
      });
    }
  },
  component: lazyRouteComponent(() => import('../pages/DemoPage')),
});
