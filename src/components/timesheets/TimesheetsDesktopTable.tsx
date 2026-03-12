import { useMemo } from 'react';
import {
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table';
import type { Timesheet } from '../../api/mockBackend';
import { DocumentDataTable } from '../workspace/DocumentDataTable';

const formatTimesheetDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const getTotalHours = (rows: Timesheet['rows']): number => {
  const totalMinutes = rows.reduce((sum, row) => sum + row.duration, 0);
  return Math.round((totalMinutes / 60) * 10) / 10;
};

const statusConfig: Record<Timesheet['status'], { label: string; className: string }> = {
  draft: {
    label: 'Черновик',
    className:
      'rounded-[var(--badge-radius)] border border-slate-400/20 bg-slate-400/10 text-[var(--neutral-text)] px-2.5 py-0.5 text-xs font-medium',
  },
  submitted: {
    label: 'Отправлен',
    className:
      'rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--accent-soft)] text-[var(--accent)] px-2.5 py-0.5 text-xs font-medium',
  },
  approved: {
    label: 'Утвержден',
    className:
      'rounded-[var(--badge-radius)] border border-emerald-400/20 bg-[var(--success-soft)] text-[var(--success-text)] px-2.5 py-0.5 text-xs font-medium',
  },
};

const columnLabels: Record<string, string> = {
  date: 'Дата',
  status: 'Статус',
  rowsCount: 'Строки',
  hours: 'Часы',
  description: 'Последняя заметка',
};

export function TimesheetsDesktopTable({
  timesheets,
  bulkActions,
  onOpenTimesheet,
}: {
  timesheets: Timesheet[];
  bulkActions?: Parameters<typeof DocumentDataTable<Timesheet>>[0]['bulkActions'];
  onOpenTimesheet: (date: string) => void;
}) {
  const columnHelper = createColumnHelper<Timesheet>();

  const columns = useMemo<ColumnDef<Timesheet, any>[]>(
    () => [
      columnHelper.accessor('date', {
        id: 'date',
        header: () => 'Дата',
        cell: ({ row }) => (
          <div>
            <p className="font-medium leading-5 text-[var(--app-fg)]">
              {formatTimesheetDate(row.original.date)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{row.original.date}</p>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: () => 'Статус',
        cell: ({ getValue }) => {
          const status = getValue() as Timesheet['status'];

          return <span className={statusConfig[status].className}>{statusConfig[status].label}</span>;
        },
      }),
      columnHelper.display({
        id: 'rowsCount',
        header: () => 'Строки',
        cell: ({ row }) => <span>{row.original.rows.length}</span>,
      }),
      columnHelper.display({
        id: 'hours',
        header: () => 'Часы',
        cell: ({ row }) => <span>{getTotalHours(row.original.rows)} ч</span>,
      }),
      columnHelper.display({
        id: 'description',
        header: () => 'Последняя заметка',
        cell: ({ row }) => (
          <span className="block max-w-[34rem] truncate text-[var(--text-muted)]">
            {row.original.rows[0]?.description || 'Без описания работ'}
          </span>
        ),
      }),
    ],
    [columnHelper, onOpenTimesheet]
  );

  return (
    <DocumentDataTable
      data={timesheets}
      columns={columns}
      columnLabels={columnLabels}
      initialSorting={[{ id: 'date', desc: true }]}
      getRowLabel={(timesheet) => `табель за ${formatTimesheetDate(timesheet.date)}`}
      onRowDoubleClick={(timesheet) => onOpenTimesheet(timesheet.date)}
      bulkActions={bulkActions}
    />
  );
}
