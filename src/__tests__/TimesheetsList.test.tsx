import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render } from '../test/test-utils';
import TimesheetsList from '../pages/TimesheetsList';

const navigateMock = vi.fn();
const useSearchMock = vi.fn(() => ({
  month: '2026-03',
  status: 'all',
  q: '',
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: () => useSearchMock(),
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

vi.mock('../components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select aria-label="Статус" value={value} onChange={(event) => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <>{placeholder}</>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

describe('TimesheetsList', () => {
  it('writes search query into route search params', async () => {
    const user = userEvent.setup();
    render(<TimesheetsList />);

    await user.type(screen.getByPlaceholderText('Поиск по дате или описанию'), 'релиза');

    expect(navigateMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: '/timesheets',
        replace: true,
        search: {
          month: '2026-03',
          status: 'all',
          q: 'а',
        },
      })
    );
  });

  it('writes selected status into route search params', async () => {
    const user = userEvent.setup();
    render(<TimesheetsList />);

    await user.selectOptions(screen.getByLabelText('Статус'), 'approved');

    expect(navigateMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: '/timesheets',
        replace: true,
        search: {
          month: '2026-03',
          status: 'approved',
          q: '',
        },
      })
    );
  });
});
