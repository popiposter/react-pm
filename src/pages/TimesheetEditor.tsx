import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { DndContext, closestCorners, type DragOverEvent } from '@dnd-kit/core';
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Ellipsis,
  GripVertical,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Wifi,
  WifiOff,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Task, TimesheetRow } from '../api/mockBackend';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DocumentActionBar } from '../components/workspace/DocumentActionBar';
import { EntityPageHeader } from '../components/workspace/EntityPageHeader';
import { PageBreadcrumbs } from '../components/workspace/PageBreadcrumbs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useSaveTimesheet } from '../hooks/useSaveTimesheet';
import { useTasks } from '../hooks/useTasks';
import { useTimesheet } from '../hooks/useTimesheet';
import { useTimesheetCalculator } from '../hooks/useTimesheetCalculator';
import { cn } from '../lib/utils';
import { getDefaultTimesheetsSearch } from '../routes/_authenticated/timesheets';

interface GroupedTaskOption {
  value: string;
  label: string;
}

interface GroupedTasks {
  group: string;
  items: GroupedTaskOption[];
}

interface RowEditorProps {
  row: TimesheetRow;
  index: number;
  taskGroups: GroupedTasks[];
  taskLookup: Map<string, Task>;
  activeRowId: string | null;
  overRowId: string | null;
  highlightedRowId: string | null;
  updateRow: (index: number, row: Partial<TimesheetRow>) => void;
  requestRemoveRow: (index: number) => void;
  duplicateRow: (row: TimesheetRow) => void;
  validationErrors: string[];
  shouldAutoReveal?: boolean;
}

type SaveAndNavigateEvent = CustomEvent<{
  proceed?: () => void;
  reset?: () => void;
}>;

const formatEditorDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const hoursToMinutes = (value: number | string): number => {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round(num * 60);
};

const minutesToHours = (minutes: number): string => {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
};

const createRowId = () =>
  `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const userLocale =
  typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'ru-RU';

const dispatchDirtyStateChange = (isDirty: boolean, date: string) => {
  window.dispatchEvent(
    new CustomEvent('timesheet-dirty-change', {
      detail: { isDirty, date },
    })
  );
};

const getRowValidationErrors = (row: TimesheetRow): string[] => {
  const errors: string[] = [];

  if (!row.taskId) {
    errors.push('Выберите задачу');
  }

  if (row.duration <= 0) {
    errors.push('Укажите длительность больше 0');
  }

  return errors;
};

const getTaskLabel = (taskGroups: GroupedTasks[], taskId: string): string => {
  for (const group of taskGroups) {
    const task = group.items.find((item) => item.value === taskId);
    if (task) {
      return task.label;
    }
  }

  return 'Задача не выбрана';
};

const getTaskProjectName = (taskLookup: Map<string, Task>, taskId: string) =>
  taskLookup.get(taskId)?.projectName || 'Без проекта';

const formatTimeLabel = (time: string) => {
  const [hours = '0', minutes = '0'] = time.split(':');
  const value = new Date();
  value.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat(userLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
};

const normalizeTimeValue = (value: string) => {
  const compact = value.replace(/[^\d:]/g, '').trim();

  if (!compact) {
    return '00:00';
  }

  const rawParts = compact.includes(':')
    ? compact.split(':')
    : compact.length <= 2
      ? [compact, '00']
      : [compact.slice(0, compact.length - 2), compact.slice(-2)];

  const hours = Math.min(23, Math.max(0, Number(rawParts[0] || 0)));
  const minutes = Math.min(59, Math.max(0, Number(rawParts[1] || 0)));

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getTotalHours = (rows: TimesheetRow[]) =>
  Math.round((rows.reduce((sum, row) => sum + row.duration, 0) / 60) * 10) / 10;

const TaskSelect = ({
  value,
  onChange,
  taskGroups,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  taskGroups: GroupedTasks[];
  className?: string;
}) => (
  <Select value={value || '__empty__'} onValueChange={(nextValue) => onChange(nextValue === '__empty__' ? '' : nextValue)}>
    <SelectTrigger className={cn('h-10 w-full bg-[var(--panel-muted)]', className)}>
      <SelectValue placeholder="Выберите задачу" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__empty__">Выберите задачу</SelectItem>
      {taskGroups.map((group) => (
        <SelectGroup key={group.group}>
          <SelectLabel>{group.group}</SelectLabel>
          {group.items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </SelectContent>
  </Select>
);

const NativeTaskSelect = ({
  value,
  onChange,
  taskGroups,
  selectRef,
}: {
  value: string;
  onChange: (value: string) => void;
  taskGroups: GroupedTasks[];
  selectRef?: RefObject<HTMLSelectElement | null>;
}) => (
  <select
    ref={selectRef}
    lang={userLocale}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="h-10 w-full border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 text-sm text-[var(--app-fg)] outline-none [color-scheme:light_dark]"
  >
    <option value="">Выберите задачу</option>
    {taskGroups.map((group) => (
      <optgroup key={group.group} label={group.group}>
        {group.items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </optgroup>
    ))}
  </select>
);

const TimeField = ({
  value,
  onChange,
  readOnly = false,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}) => {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      lang={userLocale}
      value={draftValue}
      readOnly={readOnly}
      placeholder="00:00"
      onChange={(event) => {
        const nextValue = event.target.value.replace(/[^\d:]/g, '').slice(0, 5);
        setDraftValue(nextValue);
      }}
      onBlur={(event) => {
        const normalized = normalizeTimeValue(event.target.value || '00:00');
        setDraftValue(normalized);
        onChange?.(normalized);
      }}
      className={cn(
        'h-10 w-full font-medium tabular-nums',
        readOnly
          ? 'border-[var(--panel-border)] bg-[var(--panel-bg-strong)] text-[var(--text-muted)]'
          : 'bg-[var(--panel-muted)]',
        className
      )}
    />
  );
};

const DurationField = ({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) => (
  <div className={cn('relative', className)}>
    <Input
      type="number"
      min={0}
      step={0.5}
      value={minutesToHours(value)}
      onChange={(event) => onChange(hoursToMinutes(event.target.value))}
      className="h-10 w-full bg-[var(--panel-muted)] pr-10 [color-scheme:light_dark]"
    />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
      ч
    </span>
  </div>
);

const DescriptionField = ({
  value,
  onChange,
  className,
  rows = 2,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = '0px';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={rows}
      onChange={(event) => {
        event.currentTarget.style.height = '0px';
        event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
        onChange(event.target.value);
      }}
      placeholder="Описание работ"
      className={cn(
        'min-h-10 w-full resize-none overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--app-fg)] shadow-none outline-none transition placeholder:text-[var(--text-muted)] focus:border-sky-300/40 focus:ring-2 focus:ring-sky-400/15',
        className
      )}
    />
  );
};

const SortableDesktopRow = ({
  row,
  index,
  taskGroups,
  taskLookup,
  activeRowId,
  overRowId,
  highlightedRowId,
  updateRow,
  requestRemoveRow,
  validationErrors,
}: RowEditorProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const isDropTarget = overRowId === row.id && activeRowId !== row.id;
  const isHighlighted = highlightedRowId === row.id;

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className={cn(
        'relative border-t border-[var(--panel-border)] align-middle transition hover:bg-[var(--panel-hover)]',
        validationErrors.length > 0 && 'bg-amber-400/[0.06]',
        isDragging && 'z-10 bg-[var(--panel-bg)] shadow-[0_18px_48px_-36px_var(--shadow-color)]',
        isDropTarget && 'bg-sky-400/[0.07] shadow-[inset_0_2px_0_0_var(--accent),inset_0_-1px_0_0_color-mix(in_oklab,var(--accent)_55%,transparent)]',
        isHighlighted && 'animate-[pulse_0.7s_ease-out_1] bg-emerald-400/[0.08]'
      )}
    >
      <td className="w-12 px-1.5 py-2 text-center align-middle">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-8 w-8 items-center justify-center border border-transparent bg-transparent text-[var(--text-muted)] transition hover:border-[var(--panel-border)] hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
          aria-label="Переместить строку"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-2 py-2 align-middle">
        <div className="space-y-1.5">
          <p className="truncate px-1 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {getTaskProjectName(taskLookup, row.taskId)}
          </p>
          <TaskSelect
            value={row.taskId}
            onChange={(value) => updateRow(index, { taskId: value })}
            taskGroups={taskGroups}
            className="h-9 bg-[var(--panel-bg)]"
          />
        </div>
      </td>
      <td className="w-[8.25rem] px-2 py-2 align-middle">
        <TimeField
          value={row.startTime}
          onChange={(value) => updateRow(index, { startTime: value })}
          className="h-9 max-w-[7.75rem] bg-[var(--panel-bg)]"
        />
      </td>
      <td className="w-[8.25rem] px-2 py-2 align-middle">
        <TimeField
          value={row.endTime}
          onChange={(value) => updateRow(index, { endTime: value })}
          className="h-9 max-w-[7.75rem] bg-[var(--panel-bg)]"
        />
      </td>
      <td className="w-[7.5rem] px-2 py-2 align-middle">
        <DurationField
          value={row.duration}
          onChange={(value) => updateRow(index, { duration: value })}
          className="max-w-[6.5rem] [&_input]:h-9 [&_input]:bg-[var(--panel-bg)]"
        />
      </td>
      <td className="px-2 py-2 align-middle">
        <DescriptionField
          value={row.description || ''}
          onChange={(value) => updateRow(index, { description: value })}
          rows={1}
          className="min-h-9 bg-[var(--panel-bg)]"
        />
      </td>
      <td className="w-[4.5rem] px-2 py-2 text-right align-middle">
        <Button
          onClick={() => requestRemoveRow(index)}
          variant="ghost"
          size="icon"
          className="border border-transparent text-[var(--danger-text)] hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-[var(--danger-text)]"
          aria-label="Удалить строку"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {validationErrors.length > 0 && (
          <div className="mt-2 text-left text-xs text-amber-200">
            {validationErrors.join(' • ')}
          </div>
        )}
      </td>
    </tr>
  );
};

const SortableMobileRow = ({
  row,
  index,
  taskGroups,
  taskLookup,
  activeRowId,
  overRowId,
  highlightedRowId,
  updateRow,
  requestRemoveRow,
  duplicateRow,
  validationErrors,
  shouldAutoReveal = false,
}: RowEditorProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const [isExpanded, setIsExpanded] = useState(validationErrors.length > 0);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const taskLabel = getTaskLabel(taskGroups, row.taskId);
  const projectName = getTaskProjectName(taskLookup, row.taskId);
  const articleRef = useRef<HTMLElement | null>(null);
  const taskSelectRef = useRef<HTMLSelectElement | null>(null);
  const isDropTarget = overRowId === row.id && activeRowId !== row.id;
  const isHighlighted = highlightedRowId === row.id;

  useEffect(() => {
    if (!shouldAutoReveal) {
      return;
    }

    setIsExpanded(true);

    const revealTimeout = window.setTimeout(() => {
      articleRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      taskSelectRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(revealTimeout);
  }, [shouldAutoReveal]);

  return (
    <article
      ref={(node) => {
        setNodeRef(node);
        articleRef.current = node;
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className={cn(
        'relative overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-bg)] transition-all duration-200',
        validationErrors.length > 0 && 'bg-amber-400/[0.08]',
        isDragging && 'z-20 scale-[1.01] shadow-[0_20px_48px_-32px_var(--shadow-color)]',
        isDropTarget && 'bg-sky-400/[0.09] shadow-[inset_0_2px_0_0_var(--accent),inset_0_-1px_0_0_color-mix(in_oklab,var(--accent)_55%,transparent)]',
        isHighlighted && 'animate-[pulse_0.7s_ease-out_1] bg-emerald-400/[0.08]'
      )}
    >
      {isDropTarget && (
        <>
          <div className="pointer-events-none absolute inset-x-3 top-0 h-1.5 -translate-y-1/2 bg-[var(--accent)] shadow-[0_0_0_5px_color-mix(in_oklab,var(--accent)_18%,transparent)]" />
          <div className="pointer-events-none absolute inset-x-3 bottom-0 h-[1px] bg-[var(--accent)]/55" />
        </>
      )}

      {isActionsOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-transparent"
            aria-label="Закрыть меню действий"
            onClick={() => setIsActionsOpen(false)}
          />
          <div className="app-surface-strong absolute right-3 top-12 z-20 min-w-56 origin-top-right animate-in fade-in-0 zoom-in-95 duration-150 p-2 shadow-[0_18px_48px_-24px_var(--shadow-color)]">
            <div className="border-b border-[var(--panel-border)] px-2 pb-2 pt-1">
              <p className="text-sm font-semibold">{taskLabel}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{projectName}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {formatTimeLabel(row.startTime)} - {formatTimeLabel(row.endTime)}, {minutesToHours(row.duration)} ч
              </p>
            </div>
            <div className="mt-2 space-y-1">
              <Button
                onClick={() => {
                  duplicateRow(row);
                  setIsActionsOpen(false);
                }}
                variant="ghost"
                className="h-10 w-full justify-start"
              >
                <Copy className="h-4 w-4" />
                Скопировать
              </Button>
              <Button
                onClick={() => {
                  setIsExpanded((value) => !value);
                  setIsActionsOpen(false);
                }}
                variant="ghost"
                className="h-10 w-full justify-start"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? 'Свернуть' : 'Показать детали'}
              </Button>
              <Button
                onClick={() => {
                  requestRemoveRow(index);
                  setIsActionsOpen(false);
                }}
                variant="ghost"
                className="h-10 w-full justify-start text-[var(--danger-text)] hover:bg-rose-400/10 hover:text-[var(--danger-text)]"
              >
                <Trash2 className="h-4 w-4" />
                Удалить строку
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="relative">
        <Button
          {...attributes}
          {...listeners}
          variant="ghost"
          size="icon"
          className="absolute left-1.5 top-1/2 z-[1] h-8 w-8 -translate-y-1/2 border border-transparent text-[var(--text-muted)] hover:border-[var(--panel-border)] hover:bg-[var(--panel-hover)] touch-none"
          aria-label="Переместить строку"
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setIsActionsOpen(true)}
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 z-[1] h-8 w-8 text-[var(--text-muted)] hover:border hover:border-[var(--panel-border)]"
          aria-label="Действия со строкой"
        >
          <Ellipsis className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 z-[1] h-8 w-8 -translate-y-1/2 border border-transparent text-[var(--text-muted)] hover:border-[var(--panel-border)] hover:bg-[var(--panel-hover)]"
          aria-label={isExpanded ? 'Свернуть строку' : 'Развернуть строку'}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="min-w-0 w-full bg-transparent py-3 pl-11 pr-11 text-left transition duration-200 active:scale-[0.99]"
          aria-expanded={isExpanded}
        >
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {projectName}
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{taskLabel}</p>
              </div>
              {validationErrors.length > 0 && (
                <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-[var(--warning-text)]">
                  {validationErrors.length} проблема
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span>{formatTimeLabel(row.startTime)}</span>
              <span>&rarr;</span>
              <span>{formatTimeLabel(row.endTime)}</span>
              <span className="rounded-full bg-[var(--panel-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-soft)]">
                {minutesToHours(row.duration)} ч
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--text-soft)]">
              {row.description || 'Без описания работ'}
            </p>
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="space-y-4 border border-[var(--panel-border)] bg-[var(--panel-bg-strong)] p-3">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Проект
              </p>
              <p className="text-sm font-medium text-[var(--text-soft)]">{projectName}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Задача
              </label>
              <NativeTaskSelect
                value={row.taskId}
                onChange={(value) => updateRow(index, { taskId: value })}
                taskGroups={taskGroups}
                selectRef={taskSelectRef}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Начало
                </label>
                <TimeField
                  value={row.startTime}
                  onChange={(value) => updateRow(index, { startTime: value })}
                  className="bg-[var(--app-bg)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Окончание
                </label>
                <TimeField
                  value={row.endTime}
                  onChange={(value) => updateRow(index, { endTime: value })}
                  className="bg-[var(--app-bg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Длительность
                </label>
                <DurationField
                  value={row.duration}
                  onChange={(value) => updateRow(index, { duration: value })}
                  className="[&_input]:bg-[var(--app-bg)]"
                />
              </div>
              <div className="space-y-2" />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Описание
              </label>
              <DescriptionField
                value={row.description || ''}
                onChange={(value) => updateRow(index, { description: value })}
                rows={3}
                className="bg-[var(--app-bg)]"
              />
            </div>

            {validationErrors.length > 0 && (
              <div className="border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-[var(--warning-text)]">
                {validationErrors.join(' • ')}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

const LoadingState = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="app-surface flex items-center gap-3 px-5 py-4">
      <LoaderCircle className="h-5 w-5 animate-spin" />
      <span>Загрузка табеля...</span>
    </div>
  </div>
);

export default function TimesheetEditor() {
  const { date } = useParams({ from: '/_authenticated/timesheet/$date' });
  const navigate = useNavigate();
  const [conflictModalOpened, setConflictModalOpened] = useState(false);
  const [conflictError, setConflictError] = useState<{ message: string } | null>(null);
  const [rowPendingDelete, setRowPendingDelete] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileChromeHidden, setIsMobileChromeHidden] = useState(false);
  const [freshMobileRowId, setFreshMobileRowId] = useState<string | null>(null);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const {
    data: timesheet,
    isLoading: timesheetLoading,
    refetch: refetchTimesheet,
  } = useTimesheet(date || '');
  const { rows, isDirty, setIsDirty, updateRow, addRow, removeRow, moveRow, recalculateAll } =
    useTimesheetCalculator(timesheet?.rows || []);
  const saveMutation = useSaveTimesheet();

  const taskGroups = useMemo(() => {
    return tasks.reduce((acc, task: Task) => {
      const groupName = task.projectName || 'Без проекта';
      const existingGroup = acc.find((group) => group.group === groupName);

      if (existingGroup) {
        existingGroup.items.push({ value: task.id, label: task.title });
      } else {
        acc.push({
          group: groupName,
          items: [{ value: task.id, label: task.title }],
        });
      }

      return acc;
    }, [] as GroupedTasks[]);
  }, [tasks]);
  const taskLookup = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  const rowsWithValidation = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        errors: getRowValidationErrors(row),
      })),
    [rows]
  );

  const invalidRowsCount = rowsWithValidation.filter((row) => row.errors.length > 0).length;
  const totalHours = useMemo(() => getTotalHours(rows), [rows]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [overRowId, setOverRowId] = useState<string | null>(null);
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleMobileChromeChange = (event: Event) => {
      const chromeEvent = event as CustomEvent<{ hidden?: boolean }>;
      setIsMobileChromeHidden(Boolean(chromeEvent.detail?.hidden));
    };

    setIsMobileChromeHidden(document.documentElement.dataset.mobileChrome === 'hidden');
    window.addEventListener('mobile-chrome-change', handleMobileChromeChange as EventListener);

    return () =>
      window.removeEventListener(
        'mobile-chrome-change',
        handleMobileChromeChange as EventListener
      );
  }, []);

  useEffect(() => {
    if (timesheet?.rows) {
      setIsDirty(false);
    }
  }, [timesheet?.id, timesheet?.rows, setIsDirty]);

  useEffect(() => {
    dispatchDirtyStateChange(isDirty, date || '');
  }, [date, isDirty]);

  useEffect(() => {
    return () => {
      if (date) {
        dispatchDirtyStateChange(false, date);
      }
    };
  }, [date]);

  useEffect(() => {
    if (!freshMobileRowId) {
      return;
    }

    if (!rows.some((row) => row.id === freshMobileRowId)) {
      setFreshMobileRowId(null);
      return;
    }

    const clearHighlightTimeout = window.setTimeout(() => {
      setFreshMobileRowId((current) => (current === freshMobileRowId ? null : current));
    }, 1600);

    return () => window.clearTimeout(clearHighlightTimeout);
  }, [freshMobileRowId, rows]);

  const showSaveSuccess = useCallback(() => {
    toast.success('Сохранено', {
      id: 'saving',
      description: isOnline
        ? 'Табель успешно сохранен на сервере'
        : 'Табель сохранен локально (нет сети)',
      duration: 3000,
    });
  }, [isOnline]);

  const showConflictState = () => {
    toast.warning('Конфликт версий', {
      id: 'saving',
      description: 'На сервере обнаружена более новая версия табеля',
      duration: 5000,
    });
  };

  const showSaveError = () => {
    toast.error('Ошибка сохранения', {
      id: 'saving',
      description: 'Не удалось сохранить табель',
      duration: 5000,
    });
  };

  const handleSave = useCallback(
    async (
      shouldNavigateBack = false,
      navigationResolver?: {
        proceed?: () => void;
        reset?: () => void;
      }
    ) => {
      if (!date || !timesheet) return;
      const hasValidationErrors = rows.some((row) => getRowValidationErrors(row).length > 0);

      if (hasValidationErrors) {
        toast.error('Нужно проверить строки табеля', {
          description: 'Заполните задачу и длительность во всех проблемных строках перед сохранением.',
          duration: 5000,
        });
        navigationResolver?.reset?.();
        return;
      }

      toast.loading('Сохранение...', {
        id: 'saving',
        description: 'Сохраняем табель...',
      });

      try {
        await saveMutation.mutateAsync({
          ...timesheet,
          rows: recalculateAll(),
          version: timesheet.version,
        });

        setIsDirty(false);
        dispatchDirtyStateChange(false, date);
        showSaveSuccess();

        if (navigationResolver?.proceed) {
          navigationResolver.proceed();
          return;
        }

        if (shouldNavigateBack) {
          await new Promise((resolve) => window.setTimeout(resolve, 0));
          await navigate({ to: '/timesheets', search: getDefaultTimesheetsSearch() });
        }
      } catch (error: unknown) {
        const conflict = error as { status?: number; message?: string };
        if (conflict.status === 409) {
          setConflictError({ message: conflict.message || 'Конфликт версий табеля.' });
          setConflictModalOpened(true);
          showConflictState();
          navigationResolver?.reset?.();
          return;
        }

        showSaveError();
        navigationResolver?.reset?.();
      }
    },
    [date, navigate, recalculateAll, rows, saveMutation, setIsDirty, showSaveSuccess, timesheet]
  );

  useEffect(() => {
    const handleSaveAndNavigate = (event: Event) => {
      const customEvent = event as SaveAndNavigateEvent;
      void handleSave(false, customEvent.detail);
    };

    window.addEventListener('timesheet-save-and-navigate', handleSaveAndNavigate);
    return () =>
      window.removeEventListener('timesheet-save-and-navigate', handleSaveAndNavigate);
  }, [handleSave]);

  const handleCopy = async () => {
    if (!timesheet) return;

    const today = new Date().toISOString().split('T')[0];
    const copiedRows = recalculateAll().map((row) => ({
      ...row,
      id: createRowId(),
      date: today,
    }));

    toast.loading('Создаем копию...', {
      id: 'copying',
      description: 'Подготавливаем табель на сегодня',
    });

    try {
      await saveMutation.mutateAsync({
        ...timesheet,
        id: `ts_${today}`,
        date: today,
        rows: copiedRows,
        version: 1,
        status: 'draft',
      });

      toast.success('Копия создана', {
        id: 'copying',
        description: `Табель на ${formatEditorDate(today)} готов к редактированию`,
        duration: 3000,
      });

      await navigate({
        to: '/timesheet/$date',
        params: { date: today },
      });
    } catch {
      toast.error('Ошибка', {
        id: 'copying',
        description: 'Не удалось создать копию табеля',
        duration: 4000,
      });
    }
  };

  const handleOverwriteServer = async () => {
    if (!date || !timesheet) return;

    try {
      await saveMutation.mutateAsync({
        ...timesheet,
        rows: recalculateAll(),
        version: timesheet.version + 1,
      });

      setIsDirty(false);
      dispatchDirtyStateChange(false, date);
      setConflictModalOpened(false);

      toast.success('Перезаписано', {
        description: 'Локальная версия перезаписана на сервере',
        duration: 3000,
      });
    } catch {
      toast.error('Ошибка', {
        description: 'Не удалось перезаписать табель',
        duration: 3000,
      });
    }
  };

  const handleUpdateFromServer = async () => {
    if (!date) return;

    setConflictModalOpened(false);

    try {
      await refetchTimesheet();
      toast.success('Обновлено', {
        description: 'Данные загружены с сервера',
        duration: 3000,
      });
    } catch {
      toast.error('Ошибка', {
        description: 'Не удалось загрузить актуальные данные с сервера',
        duration: 3000,
      });
    }
  };

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    const startTime = lastRow ? lastRow.endTime : '09:00';
    const rowId = createRowId();

    addRow({
      id: rowId,
      taskId: '',
      date: date || new Date().toISOString().split('T')[0],
      startTime,
      endTime: '10:00',
      duration: 60,
      description: '',
    });
    setFreshMobileRowId(rowId);
  };

  const handleDuplicateRow = (sourceRow: TimesheetRow) => {
    const lastRow = rows[rows.length - 1];
    const startTime = lastRow ? lastRow.endTime : sourceRow.startTime || '09:00';
    const rowId = createRowId();

    addRow({
      id: rowId,
      taskId: sourceRow.taskId,
      date: date || new Date().toISOString().split('T')[0],
      startTime,
      endTime: sourceRow.endTime,
      duration: sourceRow.duration,
      description: sourceRow.description || '',
    });
    setFreshMobileRowId(rowId);

    toast.success('Запись добавлена', {
      description: 'Новая строка создана по образцу и пересчитана в конце табеля.',
      duration: 2500,
    });
  };

  const handleRequestRemoveRow = (index: number) => {
    setRowPendingDelete(index);
  };

  const handleConfirmRemoveRow = () => {
    if (rowPendingDelete === null) return;

    removeRow(rowPendingDelete);
    setRowPendingDelete(null);
    toast.success('Строка удалена', {
      description: 'Табель пересчитан с учетом оставшихся записей.',
      duration: 2500,
    });
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const nextOverId = over ? String(over.id) : null;
    setOverRowId(nextOverId);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = rows.findIndex((row) => row.id === String(active.id));
    const newIndex = rows.findIndex((row) => row.id === String(over.id));

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return;
    }

    moveRow(oldIndex, newIndex);
  };

  const onDragEnd = () => {
    setActiveRowId(null);
    setOverRowId(null);
  };

  if (tasksLoading || timesheetLoading) {
    return <LoadingState />;
  }

  if (!date || !timesheet) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="app-surface px-6 py-5 text-center text-[var(--text-soft)]">
          Не удалось открыть табель.
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3 pb-[var(--mobile-editor-bar-offset)] xl:space-y-4 xl:pb-0">
      <EntityPageHeader
        breadcrumbs={
          <PageBreadcrumbs
            items={[
              { label: 'Документы' },
              { label: 'Табели', to: '/timesheets' },
              { label: formatEditorDate(date) },
            ]}
          />
        }
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--accent)]">
              Табель
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                isOnline
                  ? 'border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)]'
                  : 'border-amber-300/20 bg-amber-400/10 text-[var(--warning-text)]'
              )}
            >
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? 'Онлайн' : 'Офлайн'}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                isDirty
                  ? 'border-amber-300/20 bg-amber-400/10 text-[var(--warning-text)]'
                  : 'border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)]'
              )}
            >
              {isDirty ? 'Не записано' : 'Сохранено'}
            </span>
            {invalidRowsCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[11px] font-medium text-[var(--danger-text)]">
                Ошибок в строках: {invalidRowsCount}
              </span>
            )}
          </div>
        }
        title={`Табель за ${formatEditorDate(date)}`}
        actionsClassName="xl:justify-start"
        actions={
          <DocumentActionBar className="xl:w-full xl:justify-start">
            <Button
              onClick={() =>
                navigate({ to: '/timesheets', search: getDefaultTimesheetsSearch() })
              }
              variant="secondary"
              className="text-[var(--text-soft)]"
            >
              <ArrowLeft className="h-4 w-4" />
              К списку
            </Button>
            <Button onClick={handleCopy} variant="secondary">
              <Copy className="h-4 w-4" />
              Копировать на сегодня
            </Button>
            <Button
              onClick={() => void handleSave(false)}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4" />
              Записать
            </Button>
            <Button
              onClick={() => void handleSave(true)}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4" />
              Записать и закрыть
            </Button>
          </DocumentActionBar>
        }
      />

      <div className="xl:hidden">
        <div className="grid grid-cols-3 gap-2">
          <div className="app-surface px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Записей
            </p>
            <p className="mt-1 text-base font-semibold">{rows.length}</p>
          </div>
          <div className="app-surface px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Часов
            </p>
            <p className="mt-1 text-base font-semibold">{totalHours} ч</p>
          </div>
          <div className="app-surface px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Состояние
            </p>
            <p
              className={cn(
                'mt-1 text-xs font-semibold leading-5',
                invalidRowsCount > 0 ? 'text-[var(--warning-text)]' : 'text-[var(--success-text)]'
              )}
            >
              {invalidRowsCount > 0
                ? `Проблемных строк: ${invalidRowsCount}`
                : isDirty
                  ? 'Есть несохраненные правки'
                  : 'Все изменения сохранены'}
            </p>
          </div>
        </div>
      </div>

      <div className="app-surface p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-5">
        <div className="flex flex-col gap-3 border-b border-[var(--panel-border)] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Строки табеля
            </p>
            <h2 className="mt-1 text-lg font-semibold">Рабочие записи за день</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleAddRow} variant="secondary">
              <Plus className="h-4 w-4" />
              Добавить строку
            </Button>
            <span className="text-sm text-[var(--text-muted)]">
              Строк: {rows.length} Часов: {totalHours}
            </span>
          </div>
        </div>

        <DndContext
          collisionDetection={closestCorners}
          modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
          onDragStart={({ active }) => setActiveRowId(String(active.id))}
          onDragOver={handleDragOver}
          onDragCancel={() => {
            setActiveRowId(null);
            setOverRowId(null);
          }}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)] p-6">
                  <Plus className="h-8 w-8 text-[var(--text-muted)]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Записей пока нет</h3>
                  <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
                    Добавьте первую строку, и калькулятор автоматически подхватит начало,
                    окончание и каскадный пересчет следующих записей.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-3 pb-6 xl:hidden">
                  {rows.map((row, index) => (
                    (() => {
                      const validationErrors =
                        rowsWithValidation.find((item) => item.id === row.id)?.errors || [];

                      return (
                    <SortableMobileRow
                      key={row.id}
                      row={row}
                      index={index}
                      taskGroups={taskGroups}
                      taskLookup={taskLookup}
                      activeRowId={activeRowId}
                      overRowId={overRowId}
                      highlightedRowId={freshMobileRowId}
                      updateRow={updateRow}
                      requestRemoveRow={handleRequestRemoveRow}
                      duplicateRow={handleDuplicateRow}
                      validationErrors={validationErrors}
                      shouldAutoReveal={row.id === freshMobileRowId}
                    />
                      );
                    })()
                  ))}
                </div>

                <div className="mt-4 hidden overflow-x-auto border border-[var(--panel-border)] xl:block">
                  <table className="min-w-[1100px] w-full border-collapse">
                    <thead className="bg-[var(--panel-muted)] text-left text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <tr>
                        <th className="w-12 px-1.5 py-2.5">Порядок</th>
                        <th className="px-2 py-2.5">Проект / задача</th>
                        <th className="w-[8.25rem] px-2 py-2.5">Начало</th>
                        <th className="w-[8.25rem] px-2 py-2.5">Окончание</th>
                        <th className="w-[7.5rem] px-2 py-2.5">Длительность</th>
                        <th className="px-2 py-2.5">Описание</th>
                        <th className="w-[4.5rem] px-2 py-2.5 text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        (() => {
                          const validationErrors =
                            rowsWithValidation.find((item) => item.id === row.id)?.errors || [];

                          return (
                        <SortableDesktopRow
                          key={row.id}
                          row={row}
                          index={index}
                          taskGroups={taskGroups}
                          taskLookup={taskLookup}
                          activeRowId={activeRowId}
                          overRowId={overRowId}
                          highlightedRowId={freshMobileRowId}
                          updateRow={updateRow}
                          requestRemoveRow={handleRequestRemoveRow}
                          duplicateRow={handleDuplicateRow}
                          validationErrors={validationErrors}
                        />
                          );
                        })()
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SortableContext>
        </DndContext>
      </div>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 border-t border-[var(--panel-border)] bg-[var(--panel-bg-strong)]/96 px-3 pb-[var(--mobile-nav-bottom-padding)] pt-2 backdrop-blur transition-transform duration-300 ease-out xl:hidden',
          isMobileChromeHidden && 'translate-y-full'
        )}
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Button
            onClick={() =>
              navigate({ to: '/timesheets', search: getDefaultTimesheetsSearch() })
            }
            variant="secondary"
            className="h-9 rounded-2xl text-[var(--text-soft)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <Button
            onClick={handleAddRow}
            variant="secondary"
            className="h-9 rounded-2xl"
          >
            <Plus className="h-4 w-4" />
            Строка
          </Button>
          <Button
            onClick={() => void handleSave(false)}
            disabled={saveMutation.isPending}
            className="h-9 rounded-2xl"
          >
            <Save className="h-4 w-4" />
            Сохранить
          </Button>
        </div>
      </div>

      {conflictModalOpened && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="app-surface-strong w-full max-w-lg p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,1)]">
            <div className="flex items-start gap-4">
              <div className="border border-amber-300/20 bg-amber-400/10 p-3 text-amber-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Конфликт версий</h3>
                <p className="text-sm leading-6 text-[var(--text-soft)]">
                  {conflictError?.message || 'На сервере уже есть более новая версия табеля.'}
                </p>
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  Выберите, что делать дальше: загрузить актуальные данные или перезаписать
                  сервер локальной версией.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                onClick={handleUpdateFromServer}
                variant="secondary"
              >
                Обновить с сервера
              </Button>
              <Button
                onClick={handleOverwriteServer}
                variant="destructive"
              >
                Перезаписать сервер
              </Button>
              <Button
                onClick={() => setConflictModalOpened(false)}
                variant="secondary"
                className="text-[var(--text-soft)]"
              >
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      )}

      {rowPendingDelete !== null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="app-surface-strong w-full max-w-lg p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,1)]">
            <div className="flex items-start gap-4">
              <div className="border border-rose-300/20 bg-rose-400/10 p-3 text-rose-200">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Удалить строку?</h3>
                <p className="text-sm leading-6 text-[var(--text-soft)]">
                  Строка будет удалена, а время в следующих записях пересчитается автоматически.
                </p>
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  Это полезно для защиты от случайного удаления при работе с drag-and-drop и на мобильных устройствах.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                onClick={() => setRowPendingDelete(null)}
                variant="secondary"
              >
                Отмена
              </Button>
              <Button
                onClick={handleConfirmRemoveRow}
                variant="destructive"
              >
                Удалить строку
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
