import React, { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createIDBPersister } from './utils/idbPersister';
import { Routes, Route, useBlocker, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AppToaster } from './components/ui/sonner';
import TimesheetEditor from './pages/TimesheetEditor';
import TimesheetsList from './pages/TimesheetsList';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
      retry: 3,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Create IDB persister for offline storage
let persister: any;
if (typeof window !== 'undefined') {
  persister = createIDBPersister();
}

// Modal for blocking navigation with unsaved changes
const BlockerModal = ({
  opened,
  onConfirm,
  onCancel,
}: {
  opened: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!opened) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,1)]">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-white">У вас есть несохраненные изменения</h3>
          <p className="text-sm leading-6 text-slate-300">
            Если вы уйдете со страницы, изменения будут потеряны. Можно сначала сохранить табель и затем продолжить переход.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Сохранить и уйти
          </button>
        </div>
      </div>
    </div>
  );
};

// Component that handles navigation blocking for dirty forms
const NavigationBlocker = ({ children }: { children: React.ReactNode }) => {
  const [isDirty, setIsDirty] = useState(false);
  const currentTimesheetRef = useRef<string | null>(null);
  const blockerRef = useRef<any>(null);

  // Track dirty state - this will be set by TimesheetEditor via window event
  useEffect(() => {
    const handleDirtyChange = (e: any) => {
      setIsDirty(e.detail.isDirty);
      if (e.detail.isDirty && e.detail.date) {
        currentTimesheetRef.current = e.detail.date;
      } else if (!e.detail.isDirty) {
        currentTimesheetRef.current = null;
      }
    };

    window.addEventListener('timesheet-dirty-change', handleDirtyChange as any);
    return () => window.removeEventListener('timesheet-dirty-change', handleDirtyChange as any);
  }, []);

  // Block navigation when dirty
  const blocker = useBlocker(isDirty && currentTimesheetRef.current !== null);

  const handleConfirm = () => {
    // Force save by dispatching a custom event
    window.dispatchEvent(new CustomEvent('timesheet-save-and-navigate'));
    blockerRef.current?.proceed();
  };

  const handleCancel = () => {
    blockerRef.current?.reset();
  };

  // Store blocker in ref for access in handlers
  useEffect(() => {
    blockerRef.current = blocker;
  }, [blocker]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      // Show modal or handle blocked state
    }
  }, [blocker.state]);

  return (
    <>
      {children}
      <BlockerModal
        opened={blocker.state === 'blocked'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};

function App() {
  return (
    <>
      <AppToaster />
      {persister ? (
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
          }}
        >
          <NavigationBlocker>
            <Layout>
                <Routes>
                  <Route path="/" element={<TimesheetsList />} />
                  <Route path="/timesheets" element={<TimesheetsList />} />
                  <Route path="/timesheet/:date" element={<TimesheetEditor />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </NavigationBlocker>
        </PersistQueryClientProvider>
      ) : (
        <QueryClientProvider client={queryClient}>
          <NavigationBlocker>
            <Layout>
              <Routes>
                <Route path="/" element={<TimesheetsList />} />
                <Route path="/timesheets" element={<TimesheetsList />} />
                <Route path="/timesheet/:date" element={<TimesheetEditor />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </NavigationBlocker>
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;
