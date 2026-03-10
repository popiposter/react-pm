import { get, set } from 'idb-keyval';
import type { Task, Timesheet } from '../../api/mockBackend';
import type {
  AppRepository,
  SaveTimesheetError,
  SyncQueueItem,
  SyncStatus,
  TimesheetSyncState,
} from './types';

const TASKS_KEY = 'local-repository:tasks';
const TIMESHEETS_KEY = 'local-repository:timesheets';
const SYNC_QUEUE_KEY = 'local-repository:sync-queue';
const TIMESHEET_SYNC_STATE_KEY = 'local-repository:timesheet-sync-state';
const LEGACY_TASKS_KEY = 'mock_tasks';
const LEGACY_TIMESHEETS_KEY = 'mock_timesheets';

const DEFAULT_USER_ID = 'current_user';
const NETWORK_DELAY_MS = {
  tasks: 150,
  timesheets: 200,
  save: 250,
};

const defaultTasks: Task[] = [
  { id: 'task1', title: 'Разработка фронтенда', projectId: 'proj1', projectName: 'Внутренний портал' },
  { id: 'task2', title: 'Разработка бэкенда', projectId: 'proj1', projectName: 'Внутренний портал' },
  { id: 'task3', title: 'Тестирование', projectId: 'proj1', projectName: 'Внутренний портал' },
  { id: 'task4', title: 'Дизайн интерфейса', projectId: 'proj2', projectName: 'Мобильное приложение' },
  { id: 'task5', title: 'Интеграция API', projectId: 'proj2', projectName: 'Мобильное приложение' },
  { id: 'task6', title: 'Подготовка документации', projectId: 'proj3', projectName: 'CRM система' },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseLegacyJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const loadLegacyTasks = (): Task[] => {
  if (typeof window === 'undefined') {
    return defaultTasks;
  }

  return parseLegacyJson<Task[]>(window.localStorage.getItem(LEGACY_TASKS_KEY), defaultTasks);
};

const loadLegacyTimesheets = (): Record<string, Timesheet> => {
  if (typeof window === 'undefined') {
    return {};
  }

  return parseLegacyJson<Record<string, Timesheet>>(
    window.localStorage.getItem(LEGACY_TIMESHEETS_KEY),
    {}
  );
};

const getStoredTasks = async (): Promise<Task[]> => {
  const storedTasks = await get<Task[]>(TASKS_KEY);
  if (storedTasks && storedTasks.length > 0) {
    return storedTasks;
  }

  const legacyTasks = loadLegacyTasks();
  await set(TASKS_KEY, legacyTasks);
  return legacyTasks;
};

const getStoredTimesheets = async (): Promise<Record<string, Timesheet>> => {
  const storedTimesheets = await get<Record<string, Timesheet>>(TIMESHEETS_KEY);
  if (storedTimesheets) {
    return storedTimesheets;
  }

  const legacyTimesheets = loadLegacyTimesheets();
  await set(TIMESHEETS_KEY, legacyTimesheets);
  return legacyTimesheets;
};

const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  return (await get<SyncQueueItem[]>(SYNC_QUEUE_KEY)) ?? [];
};

const getTimesheetSyncState = async (): Promise<Record<string, TimesheetSyncState>> => {
  return (await get<Record<string, TimesheetSyncState>>(TIMESHEET_SYNC_STATE_KEY)) ?? {};
};

const createDraftTimesheet = (date: string): Timesheet => ({
  id: `ts_${date}`,
  date,
  userId: DEFAULT_USER_ID,
  version: 1,
  rows: [],
  status: 'draft',
});

const localTasksRepository = {
  async getTasks() {
    await delay(NETWORK_DELAY_MS.tasks);
    return getStoredTasks();
  },
};

const localTimesheetsRepository = {
  async getTimesheets(month: string) {
    await delay(NETWORK_DELAY_MS.timesheets);
    const allTimesheets = await getStoredTimesheets();

    return Object.values(allTimesheets).filter((timesheet) => timesheet.date.startsWith(month));
  },

  async getTimesheetByDate(date: string) {
    await delay(NETWORK_DELAY_MS.timesheets);
    const allTimesheets = await getStoredTimesheets();

    for (const timesheet of Object.values(allTimesheets)) {
      if (timesheet.date === date) {
        return timesheet;
      }
    }

    return createDraftTimesheet(date);
  },

  async saveTimesheet(timesheet: Timesheet) {
    await delay(NETWORK_DELAY_MS.save);
    const allTimesheets = await getStoredTimesheets();
    const syncQueue = await getSyncQueue();
    const syncState = await getTimesheetSyncState();
    const existingTimesheet = allTimesheets[timesheet.id];

    if (existingTimesheet && timesheet.version < existingTimesheet.version) {
      const error: SaveTimesheetError = {
        status: 409,
        message: 'Conflict: A newer version exists on the server',
      };
      throw error;
    }

    const savedTimesheet: Timesheet = {
      ...timesheet,
      version: existingTimesheet ? existingTimesheet.version + 1 : 1,
    };

    const updatedTimesheets = {
      ...allTimesheets,
      [savedTimesheet.id]: savedTimesheet,
    };

    const queuedAt = new Date().toISOString();
    const nextQueueItem: SyncQueueItem = {
      id: `sync_${savedTimesheet.id}`,
      entityId: savedTimesheet.id,
      entityType: 'timesheet',
      operation: 'save_timesheet',
      queuedAt,
    };

    const updatedQueue = [
      ...syncQueue.filter((item) => item.id !== nextQueueItem.id),
      nextQueueItem,
    ];

    const updatedSyncState: Record<string, TimesheetSyncState> = {
      ...syncState,
      [savedTimesheet.id]: {
        timesheetId: savedTimesheet.id,
        status: 'pending_sync',
        updatedAt: queuedAt,
      },
    };

    await set(TIMESHEETS_KEY, updatedTimesheets);
    await set(SYNC_QUEUE_KEY, updatedQueue);
    await set(TIMESHEET_SYNC_STATE_KEY, updatedSyncState);

    return savedTimesheet;
  },
};

const localSyncRepository = {
  async getStatus(): Promise<SyncStatus> {
    const syncQueue = await getSyncQueue();
    const lastQueuedAt = syncQueue.reduce<string | null>((latest, item) => {
      if (!latest || item.queuedAt > latest) {
        return item.queuedAt;
      }

      return latest;
    }, null);

    return {
      pendingCount: syncQueue.length,
      lastQueuedAt,
    };
  },
};

export const localAppRepository: AppRepository = {
  tasks: localTasksRepository,
  timesheets: localTimesheetsRepository,
  sync: localSyncRepository,
};
