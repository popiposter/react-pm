import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, set } from 'idb-keyval';
import { localAppRepository } from '../data/repositories/localAppRepository';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

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
});
