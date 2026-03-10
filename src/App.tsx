import React, { useState, useEffect, useRef } from 'react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createIDBPersister } from './utils/idbPersister';
import { Routes, Route, useBlocker, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>У вас есть несохраненные изменения</h3>
        <p>Если вы уйдете со страницы, изменения будут потеряны.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
            }}
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
    <MantineProvider defaultColorScheme="light">
      <DatesProvider settings={{ locale: 'ru' }}>
        <Notifications />
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
                  <Route path="/calendar" element={<Navigate to="/timesheets" replace />} />
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
                  <Route path="/calendar" element={<Navigate to="/timesheets" replace />} />
                  <Route path="/timesheets" element={<TimesheetsList />} />
                  <Route path="/timesheet/:date" element={<TimesheetEditor />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </NavigationBlocker>
          </QueryClientProvider>
        )}
      </DatesProvider>
    </MantineProvider>
  );
}

export default App;
