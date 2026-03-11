import { useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { DocumentTableFrame } from './DocumentTableFrame';

export function DocumentDataTable<TData>({
  data,
  columns,
  columnLabels,
  initialSorting,
  getRowLabel,
  onRowDoubleClick,
  bulkActions,
}: {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  columnLabels: Record<string, string>;
  initialSorting: SortingState;
  getRowLabel: (row: TData) => string;
  onRowDoubleClick?: (row: TData) => void;
  bulkActions?: (context: {
    selectedRows: TData[];
    clearSelection: () => void;
  }) => ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);

  const selectionColumn = useMemo<ColumnDef<TData, any>>(
    () => ({
      id: 'select',
      header: ({ table }) => (
        <label className="flex items-center justify-center">
          <input
            type="checkbox"
            aria-label="Выбрать все строки"
            checked={table.getIsAllRowsSelected()}
            ref={(element) => {
              if (element) {
                element.indeterminate =
                  table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
              }
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 rounded border-[var(--panel-border)]"
          />
        </label>
      ),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <label className="flex items-center justify-center">
          <input
            type="checkbox"
            aria-label={`Выбрать ${getRowLabel(row.original)}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 rounded border-[var(--panel-border)]"
          />
        </label>
      ),
    }),
    [getRowLabel]
  );

  const table = useReactTable({
    data,
    columns: [selectionColumn, ...columns],
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const primarySort = sorting[0];
  const sortLabel = primarySort
    ? `${columnLabels[primarySort.id] ?? primarySort.id}: ${primarySort.desc ? 'сначала новые' : 'сначала старые'}`
    : 'Без сортировки';
  const selectedCount = table.getSelectedRowModel().rows.length;
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="hidden xl:block">
      <DocumentTableFrame
        summary={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-soft)]">
              {primarySort?.desc ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
              Сортировка: {sortLabel}
            </span>
            {selectedCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-sm text-[var(--accent)]">
                Выбрано строк: {selectedCount}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {bulkActions?.({
              selectedRows,
              clearSelection: () => setRowSelection({}),
            })}
            {selectedCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                className="h-10"
                onClick={() => setRowSelection({})}
              >
                Снять выделение
              </Button>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColumnsMenuOpen((value) => !value)}
                className="inline-flex h-10 items-center gap-2 border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-soft)] transition hover:bg-[var(--panel-hover)]"
              >
                <Columns3 className="h-4 w-4" />
                Колонки
              </button>
              {isColumnsMenuOpen && (
                <div className="app-surface-strong absolute right-0 top-11 z-20 min-w-52 p-2 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.45)]">
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <label
                        key={column.id}
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition hover:bg-[var(--panel-hover)]"
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
        }
      >
        <div className="max-h-[70vh] overflow-auto border border-[var(--panel-border)]">
          <table className="min-w-full border-collapse">
            <thead className="bg-[var(--panel-muted)] text-left text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="sticky top-0 z-10 bg-[var(--panel-muted)] px-4 py-2.5 font-medium"
                    >
                      {header.isPlaceholder ? null : (
                        header.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-2 transition hover:text-[var(--app-fg)]"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-[var(--accent)]" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="h-3.5 w-3.5 text-[var(--accent)]" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5" />
                            )}
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
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                  className={cn(
                    'border-t border-[var(--panel-border)] transition hover:bg-[var(--panel-hover)]',
                    onRowDoubleClick && 'cursor-pointer',
                    row.getIsSelected() && 'bg-sky-400/[0.06]'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocumentTableFrame>
    </div>
  );
}
