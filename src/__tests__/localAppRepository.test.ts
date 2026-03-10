import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, set } from 'idb-keyval';
import { localAppRepository } from '../data/repositories/localAppRepository';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('../data/sync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/sync')>();
  return {
    ...actual,
    createSyncTransport: () => ({
      pushTimesheet: vi.fn().mockResolvedValue({
        ok: true,
        remoteVersion: 1,
      }),
    }),
  };
});

describe('localAppRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('hydrates tasks from legacy localStorage when IndexedDB is empty', async () => {
    const legacyTasks = [
      { id: '1', title: 'Legacy task', projectId: 'project', projectName: 'Legacy project' },
    ];

    window.localStorage.setItem('mock_tasks', JSON.stringify(legacyTasks));
    vi.mocked(get).mockResolvedValueOnce(undefined);

    const tasks = await localAppRepository.tasks.getTasks();

    expect(tasks).toEqual(legacyTasks);
    expect(set).toHaveBeenCalledWith('local-repository:tasks', legacyTasks);
  });

  it('persists timesheet changes in IndexedDB and increments version', async () => {
    const existingTimesheet = {
      id: 'ts_2026-03-10',
      date: '2026-03-10',
      userId: 'user-1',
      version: 2,
      rows: [],
      status: 'draft' as const,
    };

    vi.mocked(get).mockResolvedValueOnce({
      [existingTimesheet.id]: existingTimesheet,
    });

    const result = await localAppRepository.timesheets.saveTimesheet(existingTimesheet);

    expect(result.version).toBe(3);
    expect(set).toHaveBeenCalledWith('local-repository:timesheets', {
      [existingTimesheet.id]: {
        ...existingTimesheet,
        version: 3,
      },
    });
  });

  it('adds saved timesheets to the sync queue status', async () => {
    vi.mocked(get)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({});

    await localAppRepository.timesheets.saveTimesheet({
      id: 'ts_2026-03-11',
      date: '2026-03-11',
      userId: 'user-1',
      version: 1,
      rows: [],
      status: 'draft',
    });

    const syncQueueCall = vi.mocked(set).mock.calls.find(
      ([key]) => key === 'local-repository:sync-queue'
    );

    expect(syncQueueCall).toBeDefined();
    expect((syncQueueCall?.[1] as Array<{ entityId: string }>)[0].entityId).toBe('ts_2026-03-11');
  });

  it('clears the queue after successful sync run', async () => {
    const queueItem = {
      id: 'sync_ts_2026-03-12',
      entityId: 'ts_2026-03-12',
      entityType: 'timesheet' as const,
      operation: 'save_timesheet' as const,
      queuedAt: '2026-03-12T09:00:00.000Z',
    };

    vi.mocked(get)
      .mockResolvedValueOnce([queueItem])
      .mockResolvedValueOnce({
        'ts_2026-03-12': {
          id: 'ts_2026-03-12',
          date: '2026-03-12',
          userId: 'user-1',
          version: 1,
          rows: [],
          status: 'draft',
        },
      })
      .mockResolvedValueOnce({});

    const status = await localAppRepository.sync.runSync();

    expect(status.pendingCount).toBe(0);
    expect(status.syncedCount).toBe(1);
    expect(status.failedCount).toBe(0);
    expect(set).toHaveBeenCalledWith('local-repository:sync-queue', []);
  });

  it('seeds demo data into the local repository', async () => {
    const result = await localAppRepository.demo.seedDemoData();
    const persistedTimesheetsCall = vi
      .mocked(set)
      .mock.calls.find(([key]) => key === 'local-repository:timesheets');
    const persistedTimesheets = persistedTimesheetsCall?.[1] as Record<
      string,
      { rows: unknown[] }
    >;

    expect(result.tasksCount).toBeGreaterThan(0);
    expect(result.timesheetsCount).toBeGreaterThan(0);
    expect(persistedTimesheetsCall).toBeDefined();
    expect(Object.keys(persistedTimesheets)).toHaveLength(result.timesheetsCount);
    expect(Object.values(persistedTimesheets)[0]?.rows).toBeInstanceOf(Array);
  });

  it('resets demo data and clears local timesheets', async () => {
    vi.mocked(get).mockResolvedValueOnce({
      'ts_2026-03-10': {
        id: 'ts_2026-03-10',
        date: '2026-03-10',
        userId: 'user-1',
        version: 1,
        rows: [],
        status: 'draft',
      },
    });

    const result = await localAppRepository.demo.resetDemoData();

    expect(result.tasksCount).toBeGreaterThan(0);
    expect(result.clearedTimesheetsCount).toBe(1);
    expect(set).toHaveBeenCalledWith('local-repository:timesheets', {});
    expect(set).toHaveBeenCalledWith('local-repository:sync-queue', []);
  });
});
