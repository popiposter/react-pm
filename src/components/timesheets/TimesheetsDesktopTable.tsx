import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowRight, ArrowUpDown, Columns3 } from 'lucide-react';
import type { Timesheet } from '../../api/mockBackend';
import { cn } from '../../lib/utils';

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
    className: 'border-slate-400/20 bg-slate-400/10 text-[var(--neutral-text)]',
  },
  submitted: {
    label: 'Отправлен',
    className: 'border-sky-300/20 bg-sky-400/15 text-[var(--accent)]',
  },
  approved: {
    label: 'Утвержден',
    className: 'border-emerald-300/20 bg-emerald-400/15 text-[var(--success-text)]',
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
  onOpenTimesheet,
}: {
  timesheets: Timesheet[];
  onOpenTimesheet: (date: string) => void;
}) {
  const columnHelper = createColumnHelper<Timesheet>();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        id: 'date',
        header: () => 'Дата',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-[var(--app-fg)]">{formatTimesheetDate(row.original.date)}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{row.original.date}</p>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: () => 'Статус',
        cell: ({ getValue }) => {
          const status = getValue();

          return (
            <span
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium',
                statusConfig[status].className
              )}
            >
              {statusConfig[status].label}
            </span>
          );
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
          <span className="block max-w-[30rem] truncate text-[var(--text-muted)]">
            {row.original.rows[0]?.description || 'Без описания работ'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-right">
            <button
              type="button"
              onClick={() => onOpenTimesheet(row.original.date)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--panel-hover)]"
            >
              Открыть
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, onOpenTimesheet]
  );

  const table = useReactTable({
    data: timesheets,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="hidden xl:block">
      <div className="mb-3 flex justify-end" data-columns-menu-root="">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColumnsMenuOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-soft)] transition hover:bg-[var(--panel-hover)]"
          >
            <Columns3 className="h-4 w-4" />
            Колонки
          </button>
          {isColumnsMenuOpen && (
            <div className="app-surface-strong absolute right-0 top-11 z-20 min-w-52 rounded-xl p-2 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.45)]">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-[var(--panel-hover)]"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                    <span>{columnLabels[column.id] ?? column.id}</span>
                  </label>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1rem] border border-[var(--panel-border)]">
        <table className="min-w-full border-collapse">
          <thead className="bg-[var(--panel-muted)] text-left text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : (
                      header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-2 transition hover:text-[var(--app-fg)]"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-sm">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--panel-border)] transition hover:bg-[var(--panel-hover)]"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
