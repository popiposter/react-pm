import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import TimesheetEditor from '../pages/TimesheetEditor';

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({
    data: [
      {
        id: 'task-1',
        title: 'Разработка',
        projectId: 'project-1',
        projectName: 'Проект Alpha',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useTimesheet', () => ({
  useTimesheet: () => ({
    data: {
      id: 'ts_2023-01-01',
      date: '2023-01-01',
      userId: 'user-1',
      version: 1,
      rows: [],
      status: 'draft',
    },
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useTimesheetCalculator', () => ({
  useTimesheetCalculator: () => ({
    rows: [],
    isDirty: false,
    setIsDirty: vi.fn(),
    updateRow: vi.fn(),
    addRow: vi.fn(),
    removeRow: vi.fn(),
    moveRow: vi.fn(),
    recalculateAll: vi.fn(() => []),
  }),
}));

vi.mock('../hooks/useSaveTimesheet', () => ({
  useSaveTimesheet: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useParams: () => ({ date: '2023-01-01' }),
    useNavigate: () => vi.fn(),
  };
});

describe('TimesheetEditor Component', () => {
  it('renders the editor header', () => {
    render(<TimesheetEditor />);

    expect(screen.getByText('Табель за 1 января 2023 г.')).toBeInTheDocument();
    expect(screen.getByText('Сохранить и закрыть')).toBeInTheDocument();
  });

  it('renders the add row action and empty state', () => {
    render(<TimesheetEditor />);

    expect(screen.getByText('Добавить строку')).toBeInTheDocument();
    expect(screen.getByText('Записей пока нет')).toBeInTheDocument();
  });
});
