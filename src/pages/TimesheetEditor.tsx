import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import type { Task, TimesheetRow } from '../api/mockBackend';
import { useSaveTimesheet } from '../hooks/useSaveTimesheet';
import { useTasks } from '../hooks/useTasks';
import { useTimesheet } from '../hooks/useTimesheet';
import { useTimesheetCalculator } from '../hooks/useTimesheetCalculator';
import { cn } from '../lib/utils';

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
  removeRow: (index: number) => void;
}

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
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={cn(
      'h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-400/20',
      className
    )}
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
}: {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) => (
  <input
    type="time"
    step={300}
    value={value}
    readOnly={readOnly}
    onChange={(event) => onChange?.(event.target.value || '00:00')}
    className={cn(
      'h-11 w-full rounded-xl border px-3 text-sm outline-none transition',
      readOnly
        ? 'border-white/5 bg-slate-900/80 text-slate-400'
        : 'border-white/10 bg-slate-950/60 text-slate-100 focus:border-sky-300/40 focus:ring-2 focus:ring-sky-400/20'
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
    <input
      type="number"
      min={0}
      step={0.5}
      value={minutesToHours(value)}
      onChange={(event) => onChange(hoursToMinutes(event.target.value))}
      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 pr-10 text-sm text-slate-100 outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-400/20"
    />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
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
  <input
    type="text"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder="Описание работ"
    className={cn(
      'h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:ring-2 focus:ring-sky-400/20',
      className
    )}
  />
);

const SortableDesktopRow = ({
  row,
  index,
  taskGroups,
  updateRow,
  removeRow,
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
      className="border-t border-white/10 bg-white/[0.02] align-top transition hover:bg-sky-400/[0.04]"
    >
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Переместить строку"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-3">
        <TaskSelect
          value={row.taskId}
          onChange={(value) => updateRow(index, { taskId: value })}
          taskGroups={taskGroups}
        />
      </td>
      <td className="px-4 py-3">
        <TimeField
          value={row.startTime}
          onChange={(value) => updateRow(index, { startTime: value })}
        />
      </td>
      <td className="px-4 py-3">
        <TimeField value={row.endTime} readOnly />
      </td>
      <td className="px-4 py-3">
        <DurationField
          value={row.duration}
          onChange={(value) => updateRow(index, { duration: value })}
        />
      </td>
      <td className="px-4 py-3">
        <DescriptionField
          value={row.description || ''}
          onChange={(value) => updateRow(index, { description: value })}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => removeRow(index)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-200 transition hover:bg-rose-400/20"
          aria-label="Удалить строку"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

const SortableMobileRow = ({
  row,
  index,
  taskGroups,
  updateRow,
  removeRow,
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
      className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400"
          aria-label="Переместить строку"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => removeRow(index)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-200"
          aria-label="Удалить строку"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <TaskSelect
          value={row.taskId}
          onChange={(value) => updateRow(index, { taskId: value })}
          taskGroups={taskGroups}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.22em] text-slate-500">Начало</label>
            <TimeField
              value={row.startTime}
              onChange={(value) => updateRow(index, { startTime: value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.22em] text-slate-500">Окончание</label>
            <TimeField value={row.endTime} readOnly />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Длительность
          </label>
          <DurationField
            value={row.duration}
            onChange={(value) => updateRow(index, { duration: value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.22em] text-slate-500">Описание</label>
          <DescriptionField
            value={row.description || ''}
            onChange={(value) => updateRow(index, { description: value })}
          />
        </div>
      </div>
    </article>
  );
};

const LoadingState = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-slate-200">
      <LoaderCircle className="h-5 w-5 animate-spin" />
      <span>Загрузка табеля...</span>
    </div>
  </div>
);

export default function TimesheetEditor() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [conflictModalOpened, setConflictModalOpened] = useState(false);
  const [conflictError, setConflictError] = useState<{ message: string } | null>(null);

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

  const showSaveSuccess = () => {
    notifications.update({
      id: 'saving',
      title: 'Сохранено',
      message: navigator.onLine
        ? 'Табель успешно сохранен на сервере'
        : 'Табель сохранен локально (нет сети)',
      color: 'green',
      loading: false,
      autoClose: 3000,
    });
  };

  const showConflictState = () => {
    notifications.update({
      id: 'saving',
      title: 'Конфликт версий',
      message: 'На сервере обнаружена более новая версия табеля',
      color: 'orange',
      loading: false,
      autoClose: 5000,
    });
  };

  const showSaveError = () => {
    notifications.update({
      id: 'saving',
      title: 'Ошибка сохранения',
      message: 'Не удалось сохранить табель',
      color: 'red',
      loading: false,
      autoClose: 5000,
    });
  };

  const handleSave = useCallback(
    async (shouldNavigateBack = false) => {
      if (!date || !timesheet) return;

      notifications.show({
        id: 'saving',
        title: 'Сохранение...',
        message: 'Сохраняем табель...',
        loading: true,
        autoClose: false,
      });

      try {
        await saveMutation.mutateAsync({
          ...timesheet,
          rows: recalculateAll(),
          version: timesheet.version,
        });

        setIsDirty(false);
        showSaveSuccess();

        if (shouldNavigateBack) {
          navigate('/timesheets');
        }
      } catch (error: unknown) {
        const conflict = error as { status?: number; message?: string };
        if (conflict.status === 409) {
          setConflictError({ message: conflict.message || 'Конфликт версий табеля.' });
          setConflictModalOpened(true);
          showConflictState();
          return;
        }

        showSaveError();
      }
    },
    [date, navigate, recalculateAll, saveMutation, setIsDirty, timesheet]
  );

  useEffect(() => {
    const handleSaveAndNavigate = () => {
      void handleSave(true);
    };

    window.addEventListener('timesheet-save-and-navigate', handleSaveAndNavigate);
    return () => window.removeEventListener('timesheet-save-and-navigate', handleSaveAndNavigate);
  }, [handleSave]);

  const handleCopy = async () => {
    if (!timesheet) return;

    const today = new Date().toISOString().split('T')[0];
    const copiedRows = recalculateAll().map((row) => ({
      ...row,
      id: createRowId(),
      date: today,
    }));

    notifications.show({
      id: 'copying',
      title: 'Создаем копию...',
      message: 'Подготавливаем табель на сегодня',
      loading: true,
      autoClose: false,
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

      notifications.update({
        id: 'copying',
        title: 'Копия создана',
        message: `Табель на ${formatEditorDate(today)} готов к редактированию`,
        color: 'blue',
        loading: false,
        autoClose: 3000,
      });

      navigate(`/timesheet/${today}`);
    } catch {
      notifications.update({
        id: 'copying',
        title: 'Ошибка',
        message: 'Не удалось создать копию табеля',
        color: 'red',
        loading: false,
        autoClose: 4000,
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

      notifications.show({
        title: 'Перезаписано',
        message: 'Локальная версия перезаписана на сервере',
        color: 'green',
        autoClose: 3000,
      });
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось перезаписать табель',
        color: 'red',
        autoClose: 3000,
      });
    }
  };

  const handleUpdateFromServer = async () => {
    if (!date) return;

    setConflictModalOpened(false);

    try {
      await refetchTimesheet();
      notifications.show({
        title: 'Обновлено',
        message: 'Данные загружены с сервера',
        color: 'blue',
        autoClose: 3000,
      });
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить актуальные данные с сервера',
        color: 'red',
        autoClose: 3000,
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
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-center text-slate-300">
          Не удалось открыть табель.
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sky-200">
                Табель
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                  navigator.onLine
                    ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                    : 'border-amber-300/20 bg-amber-400/10 text-amber-100'
                )}
              >
                {navigator.onLine ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {navigator.onLine ? 'Онлайн' : 'Офлайн'}
              </span>
              {isDirty && (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
                  Есть несохраненные изменения
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Табель за {formatEditorDate(date)}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Редактируйте строки, меняйте порядок drag-and-drop и сохраняйте табель в
                несколько кликов. Пересчет времени остается автоматическим.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-xl lg:justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              <Copy className="h-4 w-4" />
              Копировать на сегодня
            </button>
            <button
              type="button"
              onClick={() => navigate('/timesheets')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              К списку
            </button>
            <button
              type="button"
              onClick={() => void handleSave(false)}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => void handleSave(true)}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              Сохранить и закрыть
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_25px_80px_-50px_rgba(15,23,42,0.95)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Строки табеля</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Рабочие записи за день</h2>
          </div>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Добавить строку
          </button>
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6">
                  <Plus className="h-8 w-8 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Записей пока нет</h3>
                  <p className="max-w-md text-sm leading-6 text-slate-400">
                    Добавьте первую строку, и калькулятор автоматически подхватит начало,
                    окончание и каскадный пересчет следующих записей.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-4 xl:hidden">
                  {rows.map((row, index) => (
                    <SortableMobileRow
                      key={row.id}
                      row={row}
                      index={index}
                      taskGroups={taskGroups}
                      updateRow={updateRow}
                      removeRow={removeRow}
                    />
                  ))}
                </div>

                <div className="mt-6 hidden overflow-x-auto rounded-[1.5rem] border border-white/10 xl:block">
                  <table className="min-w-[1100px] w-full border-collapse">
                    <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-[0.22em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4">Порядок</th>
                        <th className="px-4 py-4">Задача</th>
                        <th className="px-4 py-4">Начало</th>
                        <th className="px-4 py-4">Окончание</th>
                        <th className="px-4 py-4">Длительность</th>
                        <th className="px-4 py-4">Описание</th>
                        <th className="px-4 py-4 text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <SortableDesktopRow
                          key={row.id}
                          row={row}
                          index={index}
                          taskGroups={taskGroups}
                          updateRow={updateRow}
                          removeRow={removeRow}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SortableContext>
        </DndContext>
      </div>

      {conflictModalOpened && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,1)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-amber-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Конфликт версий</h3>
                <p className="text-sm leading-6 text-slate-300">
                  {conflictError?.message || 'На сервере уже есть более новая версия табеля.'}
                </p>
                <p className="text-sm leading-6 text-slate-400">
                  Выберите, что делать дальше: загрузить актуальные данные или перезаписать
                  сервер локальной версией.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleUpdateFromServer}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                Обновить с сервера
              </button>
              <button
                type="button"
                onClick={handleOverwriteServer}
                className="inline-flex items-center justify-center rounded-2xl bg-rose-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-300"
              >
                Перезаписать сервер
              </button>
              <button
                type="button"
                onClick={() => setConflictModalOpened(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
