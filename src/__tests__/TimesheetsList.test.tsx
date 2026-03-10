import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render } from '../test/test-utils';
import TimesheetsList from '../pages/TimesheetsList';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../hooks/useTimesheets', () => ({
  useTimesheets: () => ({
    data: [
      {
        id: 'ts-1',
        date: '2026-03-10',
        userId: 'user-1',
        version: 1,
        status: 'draft',
        rows: [
          {
            id: 'row-1',
            taskId: 'task-1',
            date: '2026-03-10',
            startTime: '09:00',
            endTime: '11:00',
            duration: 120,
            description: 'Подготовка релиза',
          },
        ],
      },
      {
        id: 'ts-2',
        date: '2026-03-09',
        userId: 'user-1',
        version: 1,
        status: 'approved',
        rows: [
          {
            id: 'row-2',
            taskId: 'task-2',
            date: '2026-03-09',
            startTime: '10:00',
            endTime: '13:00',
            duration: 180,
            description: 'Код-ревью и тестирование',
          },
        ],
      },
    ],
    isLoading: false,
  }),
}));

describe('TimesheetsList', () => {
  it('filters timesheets by search query', async () => {
    const user = userEvent.setup();
    render(<TimesheetsList />);

    await user.type(screen.getByPlaceholderText('Поиск по дате или описанию'), 'релиза');

    expect(screen.getAllByText('10 марта 2026 г.').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('9 марта 2026 г.')).toHaveLength(0);
  });

  it('filters timesheets by status', async () => {
    const user = userEvent.setup();
    render(<TimesheetsList />);

    await user.selectOptions(screen.getByLabelText('Статус'), 'approved');

    expect(screen.getAllByText('9 марта 2026 г.').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('10 марта 2026 г.')).toHaveLength(0);
  });
});
