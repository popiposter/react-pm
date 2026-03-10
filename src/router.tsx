import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type { AuthContextValue } from './features/auth/auth';

export interface RouterAppContext {
  auth: AuthContextValue;
  queryClient: QueryClient;
}

const routerBasepath =
  import.meta.env.VITE_APP_BASE_PATH && import.meta.env.VITE_APP_BASE_PATH !== '/'
    ? import.meta.env.VITE_APP_BASE_PATH.replace(/\/$/, '')
    : undefined;

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    queryClient: undefined!,
  },
  basepath: routerBasepath,
  defaultPreload: 'intent',
  defaultPendingMinMs: 200,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
