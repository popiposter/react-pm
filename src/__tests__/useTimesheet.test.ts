import { vi } from 'vitest';
import { useTimesheet } from '../hooks/useTimesheet';

// Mock the mockBackend
vi.mock('../api/mockBackend', () => ({
  getTimesheetByDate: vi.fn().mockResolvedValue({
    id: 'ts_2023-01-01',
    date: '2023-01-01',
    userId: 'user1',
    version: 1,
    rows: [],
    status: 'draft'
  })
}));

describe('useTimesheet', () => {
  it('should export the hook', () => {
    expect(useTimesheet).toBeDefined();
  });
});