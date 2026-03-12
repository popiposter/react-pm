import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { RouterAppContext } from '../router';
import { RoutePending } from '../components/pending/RoutePending';

function RootLayout() {
  return <Outlet />;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.08em] text-slate-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Страница не найдена</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Возможно, маршрут устарел или был скрыт до подключения реального backend и auth-flow.
        </p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootLayout,
  pendingComponent: () => <RoutePending />,
  notFoundComponent: NotFound,
});
