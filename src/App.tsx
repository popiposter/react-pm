import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from '@tanstack/react-router';
import { AppToaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './features/auth/auth';
import { ThemeProvider } from './features/theme/theme';
import { persister, queryClient } from './store/queryClient';
import { router } from './router';

function AppRouter() {
  const auth = useAuth();

  return (
    <RouterProvider
      router={router}
      context={{
        auth,
        queryClient,
      }}
    />
  );
}

function AppProviders() {
  return (
    <>
      <AppToaster />
      {persister ? (
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24 * 7,
          }}
        >
          <AppRouter />
        </PersistQueryClientProvider>
      ) : (
        <QueryClientProvider client={queryClient}>
          <AppRouter />
        </QueryClientProvider>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProviders />
      </AuthProvider>
    </ThemeProvider>
  );
}
