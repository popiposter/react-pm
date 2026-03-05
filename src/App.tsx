import React from 'react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createIDBPersister } from './utils/idbPersister';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CalendarView from './pages/CalendarView';
import TimesheetEditor from './pages/TimesheetEditor';

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
  persister = createIDBPersister({
    dbName: 'TimesheetsDB',
    storeName: 'queries',
  });
}

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
              restoreBatchSize: 50
            }}
          >
            <Layout>
              <Routes>
                <Route path="/" element={<CalendarView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/timesheet/:date" element={<TimesheetEditor />} />
              </Routes>
            </Layout>
          </PersistQueryClientProvider>
        ) : (
          <QueryClientProvider client={queryClient}>
            <Layout>
              <Routes>
                <Route path="/" element={<CalendarView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/timesheet/:date" element={<TimesheetEditor />} />
              </Routes>
            </Layout>
          </QueryClientProvider>
        )}
      </DatesProvider>
    </MantineProvider>
  );
}

export default App;