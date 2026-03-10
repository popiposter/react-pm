import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
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
  updateRow: (index: number, row: Partial<TimesheetRow>) => void;
  requestRemoveRow: (index: number) => void;
  validationErrors: string[];
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
    <SelectTrigger className={cn('h-10 w-full rounded-lg bg-[var(--panel-muted)]', className)}>
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
}: {
  value: string;
  onChange: (value: string) => void;
  taskGroups: GroupedTasks[];
}) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="h-10 w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 text-sm text-[var(--app-fg)] outline-none [color-scheme:light_dark]"
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
}) => (
  <Input
    type="time"
    step={300}
    value={value}
    readOnly={readOnly}
    onChange={(event) => onChange?.(event.target.value || '00:00')}
    className={cn(
      'h-10 w-full rounded-lg [color-scheme:light_dark]',
      readOnly
        ? 'border-[var(--panel-border)] bg-[var(--panel-bg-strong)] text-[var(--text-muted)]'
        : 'bg-[var(--panel-muted)]',
      className
    )}
  />
);

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
      className="h-10 w-full rounded-lg bg-[var(--panel-muted)] pr-10 [color-scheme:light_dark]"
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
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => (
  <Input
    type="text"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder="Описание работ"
    className={cn(
      'h-10 w-full rounded-lg bg-[var(--panel-muted)]',
      className
    )}
  />
);

const SortableDesktopRow = ({
  row,
  index,
  taskGroups,
  updateRow,
  requestRemoveRow,
  validationErrors,
}: RowEditorProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className={cn(
        'border-t border-[var(--panel-border)] align-top transition hover:bg-[var(--panel-hover)]',
        validationErrors.length > 0 && 'bg-amber-400/[0.06]'
      )}
    >
      <td className="px-2 py-2 text-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--panel-bg)] text-[var(--text-muted)] transition hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
          aria-label="Переместить строку"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-2 py-2">
        <TaskSelect
          value={row.taskId}
          onChange={(value) => updateRow(index, { taskId: value })}
          taskGroups={taskGroups}
          className="h-9 rounded-md bg-[var(--panel-bg)]"
        />
      </td>
      <td className="px-2 py-2">
        <TimeField
          value={row.startTime}
          onChange={(value) => updateRow(index, { startTime: value })}
          className="h-9 rounded-md bg-[var(--panel-bg)]"
        />
      </td>
      <td className="px-2 py-2">
        <TimeField value={row.endTime} readOnly className="h-9 rounded-md bg-[var(--panel-bg)]" />
      </td>
      <td className="px-2 py-2">
        <DurationField
          value={row.duration}
          onChange={(value) => updateRow(index, { duration: value })}
          className="[&_input]:h-9 [&_input]:rounded-md [&_input]:bg-[var(--panel-bg)]"
        />
      </td>
      <td className="px-2 py-2">
        <DescriptionField
          value={row.description || ''}
          onChange={(value) => updateRow(index, { description: value })}
          className="h-9 rounded-md bg-[var(--panel-bg)]"
        />
      </td>
      <td className="px-2 py-2 text-right">
        <Button
          onClick={() => requestRemoveRow(index)}
          variant="ghost"
          size="icon"
          className="border border-rose-400/20 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20 hover:text-rose-100"
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
  updateRow,
  requestRemoveRow,
  validationErrors,
}: RowEditorProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className={cn(
        'rounded-[1rem] border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4',
        validationErrors.length > 0 && 'border-amber-300/20 bg-amber-400/[0.08]'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Button
          {...attributes}
          {...listeners}
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-lg text-[var(--text-muted)]"
          aria-label="Переместить строку"
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => requestRemoveRow(index)}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg border border-rose-400/20 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20 hover:text-rose-100"
          aria-label="Удалить строку"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        <NativeTaskSelect
          value={row.taskId}
          onChange={(value) => updateRow(index, { taskId: value })}
          taskGroups={taskGroups}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Начало
            </label>
            <TimeField
              value={row.startTime}
              onChange={(value) => updateRow(index, { startTime: value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Окончание
            </label>
            <TimeField value={row.endTime} readOnly />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Длительность
          </label>
          <DurationField
            value={row.duration}
            onChange={(value) => updateRow(index, { duration: value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Описание
          </label>
          <DescriptionField
            value={row.description || ''}
            onChange={(value) => updateRow(index, { description: value })}
          />
        </div>

        {validationErrors.length > 0 && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
            {validationErrors.join(' • ')}
          </div>
        )}
      </div>
    </article>
  );
};

const LoadingState = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="app-surface flex items-center gap-3 rounded-lg px-5 py-4">
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

  const rowsWithValidation = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        errors: getRowValidationErrors(row),
      })),
    [rows]
  );

  const invalidRowsCount = rowsWithValidation.filter((row) => row.errors.length > 0).length;

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
    window.dispatchEvent(
      new CustomEvent('timesheet-dirty-change', {
        detail: { isDirty, date: date || '' },
      })
    );
  }, [date, isDirty]);

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
        showSaveSuccess();

        if (navigationResolver?.proceed) {
          navigationResolver.proceed();
          return;
        }

        if (shouldNavigateBack) {
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

    addRow({
      taskId: '',
      date: date || new Date().toISOString().split('T')[0],
      startTime,
      endTime: '10:00',
      duration: 60,
      description: '',
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

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIndex = rows.findIndex((row) => row.id === active.id);
    const overIndex = rows.findIndex((row) => row.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      moveRow(activeIndex, overIndex);
    }
  };

  if (tasksLoading || timesheetLoading) {
    return <LoadingState />;
  }

  if (!date || !timesheet) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="app-surface rounded-xl px-6 py-5 text-center text-[var(--text-soft)]">
          Не удалось открыть табель.
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4 pb-24 xl:pb-0">
      <div className="app-surface overflow-hidden rounded-[1rem]">
        <div className="flex flex-col gap-4 px-5 py-5 xl:flex-row xl:items-start xl:justify-between xl:px-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
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
              {isDirty && (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-[var(--warning-text)]">
                  Черновик не сохранен
                </span>
              )}
              {invalidRowsCount > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[11px] font-medium text-[var(--danger-text)]">
                  Проблемных строк: {invalidRowsCount}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight xl:text-[1.75rem]">
                Табель за {formatEditorDate(date)}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                Рабочий экран для ввода часов, перестановки строк и быстрого сохранения без
                лишних переходов.
              </p>
            </div>
          </div>

          <div className="hidden flex-wrap gap-2.5 xl:flex xl:max-w-2xl xl:justify-end">
            <Button
              onClick={handleCopy}
              variant="secondary"
            >
              <Copy className="h-4 w-4" />
              Копировать на сегодня
            </Button>
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
            <Button
              onClick={() => void handleSave(false)}
              disabled={saveMutation.isPending}
              className="border border-white/10 bg-white text-slate-950 hover:bg-slate-100"
            >
              <Save className="h-4 w-4" />
              Сохранить
            </Button>
            <Button
              onClick={() => void handleSave(true)}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4" />
              Сохранить и закрыть
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div
          className={cn(
            'app-surface flex items-start gap-3 rounded-[0.9rem] px-4 py-3',
            !isOnline && 'border-amber-300/20 bg-amber-400/[0.08]'
          )}
        >
          <div
            className={cn(
              'rounded-md p-2',
              isOnline
                ? 'bg-emerald-400/12 text-[var(--success-text)]'
                : 'bg-amber-400/15 text-[var(--warning-text)]'
            )}
          >
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isOnline ? 'Сохранение и синхронизация доступны' : 'Офлайн-режим активен'}
            </p>
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              {isOnline
                ? 'Изменения можно сразу отправлять на сервер или хранить локально до ручного sync.'
                : 'Продолжайте работу: изменения сохранятся локально и попадут в очередь синхронизации.'}
            </p>
          </div>
        </div>
        <div className="app-surface flex items-start gap-3 rounded-[0.9rem] px-4 py-3">
          <div className="rounded-md bg-rose-400/10 p-2 text-[var(--danger-text)]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Проверка перед сохранением</p>
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              {invalidRowsCount > 0
                ? 'Исправьте строки без задачи или с нулевой длительностью перед сохранением.'
                : 'Все строки выглядят корректно. Можно сохранять табель или продолжать редактирование.'}
            </p>
          </div>
        </div>
      </div>

      <div className="app-surface rounded-[1rem] p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-5">
        <div className="flex flex-col gap-3 border-b border-[var(--panel-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Строки табеля
            </p>
            <h2 className="mt-1 text-lg font-semibold">Рабочие записи за день</h2>
          </div>
          <Button
            onClick={handleAddRow}
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            Добавить строку
          </Button>
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="rounded-2xl border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)] p-6">
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
                <div className="mt-5 space-y-3 xl:hidden">
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
                      updateRow={updateRow}
                      requestRemoveRow={handleRequestRemoveRow}
                      validationErrors={validationErrors}
                    />
                      );
                    })()
                  ))}
                </div>

                <div className="mt-4 hidden overflow-x-auto rounded-[0.9rem] border border-[var(--panel-border)] xl:block">
                  <table className="min-w-[1100px] w-full border-collapse">
                    <thead className="bg-[var(--panel-muted)] text-left text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-2 py-2.5">Порядок</th>
                        <th className="px-2 py-2.5">Задача</th>
                        <th className="px-2 py-2.5">Начало</th>
                        <th className="px-2 py-2.5">Окончание</th>
                        <th className="px-2 py-2.5">Длительность</th>
                        <th className="px-2 py-2.5">Описание</th>
                        <th className="px-2 py-2.5 text-right">Действие</th>
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
                          updateRow={updateRow}
                          requestRemoveRow={handleRequestRemoveRow}
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
          'fixed inset-x-0 bottom-0 z-30 border-t border-[var(--panel-border)] bg-[var(--panel-bg-strong)]/96 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2.5 backdrop-blur transition-transform duration-300 ease-out xl:hidden',
          isMobileChromeHidden && 'translate-y-full'
        )}
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Button
            onClick={() =>
              navigate({ to: '/timesheets', search: getDefaultTimesheetsSearch() })
            }
            variant="secondary"
            className="h-10 rounded-2xl text-[var(--text-soft)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <Button
            onClick={handleAddRow}
            variant="secondary"
            className="h-10 rounded-2xl"
          >
            <Plus className="h-4 w-4" />
            Строка
          </Button>
          <Button
            onClick={() => void handleSave(false)}
            disabled={saveMutation.isPending}
            className="h-10 rounded-2xl"
          >
            <Save className="h-4 w-4" />
            Сохранить
          </Button>
        </div>
      </div>

      {conflictModalOpened && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="app-surface-strong w-full max-w-lg rounded-[1.5rem] p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,1)]">
            <div className="flex items-start gap-4">
              <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-amber-200">
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
          <div className="app-surface-strong w-full max-w-lg rounded-[1.5rem] p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,1)]">
            <div className="flex items-start gap-4">
              <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-rose-200">
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
