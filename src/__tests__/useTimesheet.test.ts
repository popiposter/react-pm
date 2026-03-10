import { vi } from 'vitest';
import { useTimesheet } from '../hooks/useTimesheet';

vi.mock('../data/repositories', () => ({
  appRepository: {
    tasks: {
      getTasks: vi.fn(),
    },
    timesheets: {
      getTimesheets: vi.fn(),
      getTimesheetByDate: vi.fn().mockResolvedValue({
        id: 'ts_2023-01-01',
        date: '2023-01-01',
        userId: 'user1',
        version: 1,
        rows: [],
        status: 'draft'
      }),
      saveTimesheet: vi.fn(),
    },
  },
}));

describe('useTimesheet', () => {
  it('should export the hook', () => {
    expect(useTimesheet).toBeDefined();
  });
});
