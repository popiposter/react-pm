import React from 'react';
import { render, screen } from '../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import TimesheetEditor from '../pages/TimesheetEditor';

// Mock react-router-dom with importOriginal to preserve exports
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ date: '2023-01-01' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock all the custom hooks
vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useTimesheet', () => ({
  useTimesheet: () => ({
    data: {
      id: 'ts_2023-01-01',
      date: '2023-01-01',
      userId: 'user1',
      version: 1,
      rows: [],
      status: 'draft'
    },
    isLoading: false,
  }),
}));

vi.mock('../hooks/useTimesheetCalculator', () => ({
  useTimesheetCalculator: () => ({
    rows: [],
    updateRow: vi.fn(),
    addRow: vi.fn(),
    removeRow: vi.fn(),
    moveRow: vi.fn(),
    recalculateAll: vi.fn(),
  }),
}));

vi.mock('../hooks/useSaveTimesheet', () => ({
  useSaveTimesheet: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock mantine hooks
vi.mock('@mantine/hooks', () => ({
  useDisclosure: () => [false, { open: vi.fn(), close: vi.fn() }],
}));

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  useNotifications: () => ({
    show: vi.fn(),
    update: vi.fn(),
  }),
}));

describe('TimesheetEditor Component', () => {
  it('should render timesheet title', () => {
    render(<TimesheetEditor />);
    expect(screen.getByText(/Табель за 2023-01-01/i)).toBeInTheDocument();
  });

  it('should render add row button', () => {
    render(<TimesheetEditor />);
    expect(screen.getByText('Добавить строку')).toBeInTheDocument();
  });

  it('should render save button', () => {
    render(<TimesheetEditor />);
    expect(screen.getByText('Сохранить')).toBeInTheDocument();
  });

  it('should show online indicator', () => {
    render(<TimesheetEditor />);
    // The online status is part of the title, not a standalone badge
    expect(screen.getByText(/Онлайн/i)).toBeInTheDocument();
  });
});
