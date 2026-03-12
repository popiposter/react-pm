import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
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
import { useMediaQuery } from '../hooks/useMediaQuery';
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
  insertMarker?: 'before' | 'after' | null;
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

const formatLocalDate = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

const DRAG_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 40,
  mass: 0.8,
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
    className="h-10 w-full rounded-[var(--control-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 text-sm text-[var(--app-fg)] outline-none [color-scheme:light_dark]"
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
        'min-h-10 w-full resize-none overflow-hidden rounded-[var(--control-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--app-fg)] shadow-none outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20',
        className
      )}
    />
  );
};

const RowSummaryContent = ({
  row,
  taskLookup,
}: {
  row: TimesheetRow;
  taskLookup: Map<string, Task>;
}) => {
  const projectName = getTaskProjectName(taskLookup, row.taskId);
  const taskLabel = taskLookup.get(row.taskId)?.title || 'Задача не выбрана';

  return (
    <>
      <div className="min-w-0">
        <p className="truncate text-[11px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
          {projectName}
        </p>
        <p className="mt-1 truncate text-sm font-semibold">{taskLabel}</p>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <span>{formatTimeLabel(row.startTime)}</span>
        <span>&rarr;</span>
        <span>{formatTimeLabel(row.endTime)}</span>
        <span className="rounded-[var(--badge-radius)] bg-[var(--panel-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-soft)]">
          {minutesToHours(row.duration)} ч
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--text-soft)]">
        {row.description || 'Без описания работ'}
      </p>
    </>
  );
};

const DesktopDragOverlayContent = ({
  row,
  taskLookup,
}: {
  row: TimesheetRow;
  taskLookup: Map<string, Task>;
}) => (
  <motion.div
    initial={{ scale: 1, rotate: 0 }}
    animate={{ scale: 1.02, rotate: 0.5 }}
    transition={DRAG_SPRING}
    className="w-[min(1120px,88vw)] rounded-[var(--surface-radius)] border border-[var(--accent)]/30 bg-[var(--panel-bg-strong)] px-4 py-3 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.45)]"
  >
    <div className="grid grid-cols-[64px_minmax(0,1.7fr)_140px_140px_120px_minmax(260px,1fr)_48px] items-center gap-4">
      <div className="flex justify-center text-[var(--text-muted)]">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
          {getTaskProjectName(taskLookup, row.taskId)}
        </p>
        <p className="mt-1 truncate text-base font-semibold">
          {taskLookup.get(row.taskId)?.title || 'Задача не выбрана'}
        </p>
      </div>
      <div className="text-sm font-medium tabular-nums">{formatTimeLabel(row.startTime)}</div>
      <div className="text-sm font-medium tabular-nums">{formatTimeLabel(row.endTime)}</div>
      <div className="text-sm font-medium tabular-nums">{minutesToHours(row.duration)} ч</div>
      <div className="line-clamp-2 text-sm text-[var(--text-soft)]">
        {row.description || 'Без описания работ'}
      </div>
      <div className="flex justify-center text-[var(--danger-text)]">
        <Trash2 className="h-4 w-4" />
      </div>
    </div>
  </motion.div>
);

const MobileDragOverlayContent = ({
  row,
  taskLookup,
}: {
  row: TimesheetRow;
  taskLookup: Map<string, Task>;
}) => (
  <article
    className="w-[min(92vw,26rem)] rounded-[var(--surface-radius)] border border-[var(--accent)]/50 bg-[var(--panel-bg-strong)] px-4 py-3 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.55),0_0_0_1px_color-mix(in_oklab,var(--accent)_30%,transparent)]"
  >
    <div className="flex items-start gap-3">
      <div className="mt-7 text-[var(--text-muted)]">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <RowSummaryContent row={row} taskLookup={taskLookup} />
      </div>
      <div className="mt-0.5 text-[var(--text-muted)]">
        <Ellipsis className="h-4 w-4" />
      </div>
    </div>
  </article>
);

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
  insertMarker = null,
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
        opacity: isDragging ? 0.4 : 1,
      }}
      className={cn(
        'relative border-t border-[var(--panel-border)] align-middle transition hover:bg-[var(--panel-hover)]',
        validationErrors.length > 0 && 'bg-amber-400/[0.06]',
        isDragging && 'z-10 bg-[var(--panel-muted)] shadow-[inset_0_0_0_1px_rgba(74,169,255,0.2)]',
        isDropTarget && 'bg-sky-400/[0.05]',
        isHighlighted && 'animate-[pulse_0.7s_ease-out_1] bg-emerald-400/[0.08]',
        insertMarker === 'before' && 'shadow-[inset_0_2px_0_0_var(--accent)]',
        insertMarker === 'after' && 'shadow-[inset_0_-2px_0_0_var(--accent)]'
      )}
    >
      <td className="w-12 px-1.5 py-2 text-center align-middle">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-[var(--badge-radius)] border border-transparent bg-transparent text-[var(--text-muted)] transition active:cursor-grabbing hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
          aria-label="Переместить строку"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-2 py-1.5 align-middle">
        <div className="space-y-1">
          <p className="truncate px-1 text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
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
      <td className="w-[7.5rem] px-2 py-1.5 align-middle">
        <TimeField
          value={row.startTime}
          onChange={(value) => updateRow(index, { startTime: value })}
          className="h-9 max-w-[7rem] bg-[var(--panel-bg)]"
        />
      </td>
      <td className="w-[7.5rem] px-2 py-1.5 align-middle">
        <TimeField
          value={row.endTime}
          onChange={(value) => updateRow(index, { endTime: value })}
          className="h-9 max-w-[7rem] bg-[var(--panel-bg)]"
        />
      </td>
      <td className="w-[6.75rem] px-2 py-1.5 align-middle">
        <DurationField
          value={row.duration}
          onChange={(value) => updateRow(index, { duration: value })}
          className="max-w-[5.75rem] [&_input]:h-9 [&_input]:bg-[var(--panel-bg)]"
        />
      </td>
      <td className="px-2 py-1.5 align-middle">
        <DescriptionField
          value={row.description || ''}
          onChange={(value) => updateRow(index, { description: value })}
          rows={1}
          className="min-h-9 bg-[var(--panel-bg)]"
        />
      </td>
      <td className="w-[4rem] px-2 py-1.5 text-right align-middle">
        <Button
          onClick={() => requestRemoveRow(index)}
          variant="ghost"
          size="icon"
          className="h-7 w-7 border border-transparent text-[var(--danger-text)] hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-[var(--danger-text)]"
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
  insertMarker = null,
  shouldAutoReveal = false,
}: RowEditorProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const [isExpanded, setIsExpanded] = useState(validationErrors.length > 0);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
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
        setNodeRef(node as HTMLElement | null);
        articleRef.current = node as HTMLElement | null;
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        marginTop: insertMarker === 'before' ? 48 : 0,
        marginBottom: insertMarker === 'after' ? 48 : 0,
      }}
      className={cn(
        'relative overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-bg)] transition-all duration-200',
        validationErrors.length > 0 && 'bg-amber-400/[0.08]',
        isDragging && 'z-20 border-dashed border-[var(--accent)]/40 bg-transparent shadow-[inset_0_0_0_1px_rgba(74,169,255,0.2)]',
        isDropTarget && 'bg-sky-400/[0.05]',
        isHighlighted && 'animate-[pulse_0.7s_ease-out_1] bg-emerald-400/[0.08]'
      )}
    >
      {insertMarker && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-3 z-[2] h-0.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)]',
            insertMarker === 'before' ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2'
          )}
        />
      )}

      {isActionsOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-transparent"
            aria-label="Закрыть меню действий"
            onClick={() => setIsActionsOpen(false)}
          />
          <div className="app-surface-strong absolute right-2 top-10 z-20 min-w-44 origin-top-right animate-in fade-in-0 zoom-in-95 duration-150 p-2 shadow-[0_18px_48px_-24px_var(--shadow-color)]">
            <div className="space-y-1">
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
          className="absolute left-1.5 top-1/2 z-[1] h-8 w-8 -translate-y-1/2 cursor-grab border border-transparent text-[var(--text-muted)] touch-none active:cursor-grabbing hover:bg-[var(--panel-hover)]"
          style={{ touchAction: 'none' }}
          aria-label="Переместить строку"
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setIsActionsOpen(true)}
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 z-[1] h-8 w-8 text-[var(--text-muted)] hover:bg-[var(--panel-hover)]"
          aria-label="Действия со строкой"
        >
          <Ellipsis className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 z-[1] h-8 w-8 -translate-y-1/2 rounded-[var(--badge-radius)] border border-transparent text-[var(--text-muted)] hover:bg-[var(--panel-hover)]"
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
              <div className="min-w-0 flex-1">
                <RowSummaryContent row={row} taskLookup={taskLookup} />
              </div>
              {validationErrors.length > 0 && (
                <span className="rounded-[var(--badge-radius)] border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-[var(--warning-text)]">
                  {validationErrors.length} проблема
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 pb-3 pt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Проект
              </p>
              <p className="text-sm font-medium text-[var(--text-soft)]">{projectName}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
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
                <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Начало
                </label>
                <TimeField
                  value={row.startTime}
                  onChange={(value) => updateRow(index, { startTime: value })}
                  className="bg-[var(--panel-muted)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Окончание
                </label>
                <TimeField
                  value={row.endTime}
                  onChange={(value) => updateRow(index, { endTime: value })}
                  className="bg-[var(--panel-muted)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Длительность
                </label>
                <DurationField
                  value={row.duration}
                  onChange={(value) => updateRow(index, { duration: value })}
                  className="[&_input]:bg-[var(--panel-muted)]"
                />
              </div>
              <div className="space-y-2" />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Описание
              </label>
              <DescriptionField
                value={row.description || ''}
                onChange={(value) => updateRow(index, { description: value })}
                rows={3}
                className="bg-[var(--panel-muted)]"
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
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileChromeHidden, setIsMobileChromeHidden] = useState(false);
  const [freshMobileRowId, setFreshMobileRowId] = useState<string | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1280px)');

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
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [overRowId, setOverRowId] = useState<string | null>(null);
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const activeRow = useMemo(
    () => (activeRowId ? rows.find((row) => row.id === activeRowId) ?? null : null),
    [activeRowId, rows]
  );
  const activeRowIndex = activeRowId ? rowIds.indexOf(activeRowId) : -1;
  const overRowIndex = overRowId ? rowIds.indexOf(overRowId) : -1;
  const dndSensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

    const today = formatLocalDate();
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
      date: date || formatLocalDate(),
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
      date: date || formatLocalDate(),
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

  const handleDragOver = ({ over }: DragOverEvent) => {
    const nextOverId = over ? String(over.id) : null;
    setOverRowId(nextOverId);
  };

  const getInsertMarker = (rowId: string): 'before' | 'after' | null => {
    if (!activeRowId || !overRowId || rowId !== overRowId || activeRowId === overRowId) {
      return null;
    }

    if (activeRowIndex === -1 || overRowIndex === -1) {
      return null;
    }

    return activeRowIndex < overRowIndex ? 'after' : 'before';
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((row) => row.id === String(active.id));
      const newIndex = rows.findIndex((row) => row.id === String(over.id));

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        moveRow(oldIndex, newIndex);
      }
    }

    setActiveRowId(null);
    setOverRowId(null);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveRowId(String(active.id));
    navigator.vibrate?.(5);
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
            <span className="inline-flex items-center gap-2 rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--accent)]">
              Табель
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-[var(--badge-radius)] border px-2.5 py-1 text-[11px] font-medium',
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
                'inline-flex items-center gap-2 rounded-[var(--badge-radius)] border px-2.5 py-1 text-[11px] font-medium',
                isDirty
                  ? 'border-amber-300/20 bg-amber-400/10 text-[var(--warning-text)]'
                  : 'border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)]'
              )}
            >
              {isDirty ? 'Не записано' : 'Сохранено'}
            </span>
            {invalidRowsCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-[var(--badge-radius)] border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[11px] font-medium text-[var(--danger-text)]">
                Ошибок в строках: {invalidRowsCount}
              </span>
            )}
          </div>
        }
        title={formatEditorDate(date).replace(/\s+г\.$/, '')}
        actionsClassName="xl:w-full"
        actions={
          <DocumentActionBar className="xl:w-full xl:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={() =>
                  navigate({ to: '/timesheets', search: getDefaultTimesheetsSearch() })
                }
                variant="secondary"
                className="hidden text-[var(--text-soft)] xl:inline-flex"
              >
                <ArrowLeft className="h-4 w-4" />
                К списку
              </Button>
              <div className="relative">
                <Button
                  onClick={() => setIsHeaderMenuOpen((value) => !value)}
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Действия с табелем"
                >
                  <Ellipsis className="h-4 w-4" />
                </Button>
                {isHeaderMenuOpen && (
                  <div className="app-surface-strong absolute left-0 top-12 z-20 min-w-44 p-2 shadow-[0_18px_48px_-24px_var(--shadow-color)]">
                    <Button
                      onClick={() => {
                        void handleCopy();
                        setIsHeaderMenuOpen(false);
                      }}
                      variant="ghost"
                      className="h-10 w-full justify-start"
                    >
                      <Copy className="h-4 w-4" />
                      Скопировать
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden flex-wrap items-center gap-2.5 xl:flex">
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
            </div>
          </DocumentActionBar>
        }
      />

      <div className="app-surface p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-5 ![backdrop-filter:none]">
        <div className="flex flex-col gap-3 border-b border-[var(--panel-border)] pb-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Строки табеля
            </p>
            <h2 className="mt-1 text-lg font-semibold">Рабочие записи за день</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleAddRow} variant="secondary">
              <Plus className="h-4 w-4" />
              Добавить строку
            </Button>
          </div>
        </div>

        <DndContext
          collisionDetection={closestCorners}
          sensors={dndSensors}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
          onDragStart={onDragStart}
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
                <div className="rounded-[var(--surface-radius)] border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)] p-6">
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
                {!isDesktop && (
                <div className="mt-5 space-y-3 pb-6">
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
                      insertMarker={getInsertMarker(row.id)}
                      shouldAutoReveal={row.id === freshMobileRowId}
                    />
                      );
                    })()
                  ))}
                </div>
                )}

                {isDesktop && (
                <div className="mt-4 overflow-x-auto border border-[var(--panel-border)]">
                  <table className="min-w-[1040px] w-full border-collapse">
                    <thead className="bg-[var(--panel-muted)] text-left text-[11px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                      <tr>
                        <th className="w-10 px-1.5 py-2.5">Порядок</th>
                        <th className="px-2 py-2.5">Проект / задача</th>
                        <th className="w-[7.5rem] px-2 py-2.5">Начало</th>
                        <th className="w-[7.5rem] px-2 py-2.5">Окончание</th>
                        <th className="w-[6.75rem] px-2 py-2.5">Длительность</th>
                        <th className="px-2 py-2.5">Описание</th>
                        <th className="w-[4rem] px-2 py-2.5 text-right">Действие</th>
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
                          insertMarker={getInsertMarker(row.id)}
                        />
                          );
                        })()
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </>
            )}
          </SortableContext>
          <DragOverlay
            zIndex={9999}
            adjustScale={false}
            modifiers={[restrictToVerticalAxis]}
            dropAnimation={{
              duration: 220,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {activeRow ? (
              isDesktop
                ? <DesktopDragOverlayContent row={activeRow} taskLookup={taskLookup} />
                : <MobileDragOverlayContent row={activeRow} taskLookup={taskLookup} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

        <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 rounded-t-[var(--surface-radius)] border-t border-[var(--panel-border)] bg-[var(--panel-bg-strong)]/96 px-3 pb-[var(--mobile-nav-bottom-padding)] pt-2 backdrop-blur transition-transform duration-300 ease-out xl:hidden',
          isMobileChromeHidden && 'translate-y-full'
        )}
      >
        <div className="mx-auto grid max-w-md grid-cols-[auto_1fr_1.15fr] gap-2">
          <Button
            onClick={() =>
              navigate({ to: '/timesheets', search: getDefaultTimesheetsSearch() })
            }
            variant="secondary"
            className="h-10 px-3 text-[var(--text-soft)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleAddRow}
            variant="secondary"
            className="h-10 justify-center"
          >
            <Plus className="h-4 w-4" />
            Строка
          </Button>
          <Button
            onClick={() => void handleSave(false)}
            disabled={saveMutation.isPending}
            className="h-10 justify-center"
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
              <div className="rounded-[var(--control-radius)] border border-amber-300/20 bg-amber-400/10 p-3 text-amber-200">
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
              <div className="rounded-[var(--control-radius)] border border-rose-300/20 bg-rose-400/10 p-3 text-rose-200">
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
