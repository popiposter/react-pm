import { get, set } from 'idb-keyval';
import type { Task, Timesheet } from '../../api/mockBackend';
import { createSyncTransport } from '../sync';
import type {
  AppRepository,
  DemoResetResult,
  DemoSeedResult,
  SaveTimesheetError,
  SyncQueueItem,
  SyncRunResult,
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

const syncTransport = createSyncTransport();

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

const getSyncStatusSnapshot = (syncQueue: SyncQueueItem[]): SyncStatus => {
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
};

const getSyncRunSnapshot = (
  syncQueue: SyncQueueItem[],
  syncedCount: number,
  failedCount: number
): SyncRunResult => ({
  ...getSyncStatusSnapshot(syncQueue),
  syncedCount,
  failedCount,
});

const createDraftTimesheet = (date: string): Timesheet => ({
  id: `ts_${date}`,
  date,
  userId: DEFAULT_USER_ID,
  version: 1,
  rows: [],
  status: 'draft',
});

const createDemoRows = (
  date: string,
  rows: Array<{
    id: string;
    taskId: string;
    startTime: string;
    endTime: string;
    duration: number;
    description: string;
  }>
) =>
  rows.map((row) => ({
    ...row,
    date,
  }));

const buildDemoTimesheets = (): Record<string, Timesheet> => {
  const now = new Date();
  const dates = Array.from({ length: 8 }, (_, index) => {
    const current = new Date(now);
    current.setDate(now.getDate() - index);
    return current.toISOString().split('T')[0];
  });

  const templates: Array<Pick<Timesheet, 'status' | 'rows'>> = [
    {
      status: 'draft',
      rows: createDemoRows(dates[0], [
        {
          id: 'demo-row-1',
          taskId: 'task1',
          startTime: '09:00',
          endTime: '11:30',
          duration: 150,
          description: 'Подготовка нового экрана списка табелей',
        },
        {
          id: 'demo-row-2',
          taskId: 'task5',
          startTime: '11:30',
          endTime: '13:00',
          duration: 90,
          description: 'Проверка интеграционного контракта c 1С',
        },
      ]),
    },
    {
      status: 'submitted',
      rows: createDemoRows(dates[1], [
        {
          id: 'demo-row-3',
          taskId: 'task2',
          startTime: '10:00',
          endTime: '12:00',
          duration: 120,
          description: 'Подготовка backend adapter и sync transport',
        },
        {
          id: 'demo-row-4',
          taskId: 'task3',
          startTime: '12:00',
          endTime: '14:30',
          duration: 150,
          description: 'Регрессия сценариев offline и sync queue',
        },
      ]),
    },
    {
      status: 'approved',
      rows: createDemoRows(dates[2], [
        {
          id: 'demo-row-5',
          taskId: 'task4',
          startTime: '09:30',
          endTime: '11:00',
          duration: 90,
          description: 'Финализация login flow и визуального сценария входа',
        },
        {
          id: 'demo-row-6',
          taskId: 'task6',
          startTime: '11:00',
          endTime: '12:00',
          duration: 60,
          description: 'Подготовка заметок по интеграции с 1С',
        },
      ]),
    },
    {
      status: 'draft',
      rows: createDemoRows(dates[3], [
        {
          id: 'demo-row-7',
          taskId: 'task1',
          startTime: '09:00',
          endTime: '10:30',
          duration: 90,
          description: 'Рефакторинг журнала табелей под route loaders',
        },
      ]),
    },
    {
      status: 'approved',
      rows: createDemoRows(dates[4], [
        {
          id: 'demo-row-8',
          taskId: 'task5',
          startTime: '13:00',
          endTime: '16:00',
          duration: 180,
          description: 'Интеграционное тестирование sync runner',
        },
      ]),
    },
    {
      status: 'submitted',
      rows: createDemoRows(dates[5], [
        {
          id: 'demo-row-9',
          taskId: 'task3',
          startTime: '10:00',
          endTime: '12:30',
          duration: 150,
          description: 'Проверка ручных и автоматических сценариев синхронизации',
        },
      ]),
    },
    {
      status: 'draft',
      rows: createDemoRows(dates[6], [
        {
          id: 'demo-row-10',
          taskId: 'task2',
          startTime: '09:00',
          endTime: '11:00',
          duration: 120,
          description: 'Подготовка DTO для будущего OneC transport',
        },
      ]),
    },
    {
      status: 'approved',
      rows: createDemoRows(dates[7], [
        {
          id: 'demo-row-11',
          taskId: 'task4',
          startTime: '15:00',
          endTime: '17:30',
          duration: 150,
          description: 'Сборка mobile-first сценария для редактора',
        },
      ]),
    },
  ];

  return templates.reduce<Record<string, Timesheet>>((acc, template, index) => {
    const date = dates[index];
    const id = `ts_${date}`;

    acc[id] = {
      id,
      date,
      userId: DEFAULT_USER_ID,
      version: 1,
      status: template.status,
      rows: template.rows,
    };

    return acc;
  }, {});
};

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
    return getSyncStatusSnapshot(syncQueue);
  },

  async runSync(): Promise<SyncRunResult> {
    const syncQueue = await getSyncQueue();

    if (syncQueue.length === 0) {
      return getSyncRunSnapshot(syncQueue, 0, 0);
    }

    const allTimesheets = await getStoredTimesheets();
    const syncState = await getTimesheetSyncState();
    const remainingQueue: SyncQueueItem[] = [];
    const updatedSyncState = { ...syncState };
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of syncQueue) {
      const timesheet = allTimesheets[item.entityId];

      if (!timesheet) {
        continue;
      }

      try {
        const result = await syncTransport.pushTimesheet(timesheet, item.operation);

        if (result.ok) {
          updatedSyncState[item.entityId] = {
            timesheetId: item.entityId,
            status: 'synced',
            updatedAt: new Date().toISOString(),
          };
          syncedCount += 1;
        } else {
          remainingQueue.push(item);
          failedCount += 1;
        }
      } catch {
        remainingQueue.push(item);
        failedCount += 1;
      }
    }

    await set(SYNC_QUEUE_KEY, remainingQueue);
    await set(TIMESHEET_SYNC_STATE_KEY, updatedSyncState);

    return getSyncRunSnapshot(remainingQueue, syncedCount, failedCount);
  },
};

const localDemoRepository = {
  async seedDemoData(): Promise<DemoSeedResult> {
    const demoTimesheets = buildDemoTimesheets();

    await set(TASKS_KEY, defaultTasks);
    await set(TIMESHEETS_KEY, demoTimesheets);
    await set(SYNC_QUEUE_KEY, []);
    await set(TIMESHEET_SYNC_STATE_KEY, {});

    return {
      tasksCount: defaultTasks.length,
      timesheetsCount: Object.keys(demoTimesheets).length,
    };
  },

  async resetDemoData(): Promise<DemoResetResult> {
    const currentTimesheets = await getStoredTimesheets();

    await set(TASKS_KEY, defaultTasks);
    await set(TIMESHEETS_KEY, {});
    await set(SYNC_QUEUE_KEY, []);
    await set(TIMESHEET_SYNC_STATE_KEY, {});

    return {
      tasksCount: defaultTasks.length,
      clearedTimesheetsCount: Object.keys(currentTimesheets).length,
    };
  },
};

export const localAppRepository: AppRepository = {
  tasks: localTasksRepository,
  timesheets: localTimesheetsRepository,
  sync: localSyncRepository,
  demo: localDemoRepository,
};
