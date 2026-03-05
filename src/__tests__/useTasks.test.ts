import { vi } from 'vitest';
import { useTasks } from '../hooks/useTasks';

// Mock the mockBackend
vi.mock('../api/mockBackend', () => ({
  getTasks: vi.fn().mockResolvedValue([
    { id: '1', title: 'Task 1', projectId: 'p1', projectName: 'Project 1' },
    { id: '2', title: 'Task 2', projectId: 'p2', projectName: 'Project 2' }
  ])
}));

describe('useTasks', () => {
  it('should export the hook', () => {
    expect(useTasks).toBeDefined();
  });
});