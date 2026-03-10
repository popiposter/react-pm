import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  ArrowRight,
  CalendarRange,
  CircleCheckBig,
  Clock3,
  DatabaseZap,
  FileSearch,
  FileSpreadsheet,
  Filter,
  FolderClock,
  NotebookPen,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { TimesheetsDesktopTable } from '../components/timesheets/TimesheetsDesktopTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useTimesheets } from '../hooks/useTimesheets';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useResetDemoData } from '../hooks/useResetDemoData';
import { useSeedDemoData } from '../hooks/useSeedDemoData';
import type { Timesheet } from '../api/mockBackend';
import { cn } from '../lib/utils';
import {
  getCurrentMonth,
  type TimesheetStatusFilter,
} from '../routes/_authenticated/timesheets';

const formatTimesheetDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split('-');
  return new Date(Number(year), Number(monthNumber) - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
};

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

const statusFilterOptions: Array<{
  value: TimesheetStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'Все статусы' },
  { value: 'draft', label: 'Черновики' },
  { value: 'submitted', label: 'Отправленные' },
  { value: 'approved', label: 'Утвержденные' },
];

const startOfToday = () => new Date().toISOString().split('T')[0];
const DEMO_ONBOARDING_KEY = 'timesheets:dismiss-demo-onboarding';

const matchesSearch = (timesheet: Timesheet, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const descriptions = timesheet.rows
    .map((row) => row.description || '')
    .join(' ')
    .toLowerCase();

  return (
    formatTimesheetDate(timesheet.date).toLowerCase().includes(normalizedQuery) ||
    timesheet.date.includes(normalizedQuery) ||
    descriptions.includes(normalizedQuery)
  );
};

const summaryCards = (timesheets: Timesheet[]) => {
  const approved = timesheets.filter((timesheet) => timesheet.status === 'approved').length;
  const draft = timesheets.filter((timesheet) => timesheet.status === 'draft').length;
  const totalHours = Math.round(
    timesheets.reduce((sum, timesheet) => sum + getTotalHours(timesheet.rows), 0) * 10
  ) / 10;

  return [
    {
      label: 'Табелей за период',
      value: String(timesheets.length),
      icon: FileSpreadsheet,
      accent: 'from-sky-400/30 to-cyan-400/5',
    },
    {
      label: 'Часов заведено',
      value: `${totalHours} ч`,
      icon: Clock3,
      accent: 'from-emerald-400/30 to-emerald-400/5',
    },
    {
      label: 'Черновиков',
      value: String(draft),
      icon: NotebookPen,
      accent: 'from-amber-400/30 to-amber-400/5',
    },
    {
      label: 'Утверждено',
      value: String(approved),
      icon: CircleCheckBig,
      accent: 'from-fuchsia-400/30 to-fuchsia-400/5',
    },
  ];
};

export default function TimesheetsList() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_authenticated/timesheets' });
  const selectedMonth = search.month;
  const statusFilter = search.status;
  const searchQuery = search.q;
  const { data: timesheets = [], isLoading } = useTimesheets(selectedMonth);
  const { data: syncStatus } = useSyncStatus();
  const seedDemoData = useSeedDemoData();
  const resetDemoData = useResetDemoData();
  const [showDemoOnboarding, setShowDemoOnboarding] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.localStorage.getItem(DEMO_ONBOARDING_KEY) !== 'dismissed';
  });

  const filteredTimesheets = useMemo(() => {
    return [...timesheets]
      .filter((timesheet) => statusFilter === 'all' || timesheet.status === statusFilter)
      .filter((timesheet) => matchesSearch(timesheet, searchQuery))
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [searchQuery, statusFilter, timesheets]);

  const activeSummary = useMemo(() => summaryCards(filteredTimesheets), [filteredTimesheets]);
  const hasActiveFilters = statusFilter !== 'all' || searchQuery.trim().length > 0;
  const isEmptyMonth = !isLoading && filteredTimesheets.length === 0 && !hasActiveFilters;
  const hasAnyTimesheets = timesheets.length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (showDemoOnboarding) {
      window.localStorage.removeItem(DEMO_ONBOARDING_KEY);
      return;
    }

    window.localStorage.setItem(DEMO_ONBOARDING_KEY, 'dismissed');
  }, [showDemoOnboarding]);

  const handleSeedDemoData = async () => {
    toast.loading('Заполняем демо-базу...', { id: 'seed-demo-list' });

    try {
      const result = await seedDemoData.mutateAsync();
      toast.success('Демо-данные готовы', {
        id: 'seed-demo-list',
        description: `Добавлено ${result.timesheetsCount} табелей и ${result.tasksCount} задач.`,
      });
    } catch {
      toast.error('Не удалось заполнить демо-базу', {
        id: 'seed-demo-list',
        description: 'Попробуйте повторить действие еще раз.',
      });
    }
  };

  const handleResetDemoData = async () => {
    const shouldReset =
      typeof window === 'undefined'
        ? true
        : window.confirm(
            'Сбросить демо-базу? Все локальные табели и очередь синхронизации будут очищены.'
          );

    if (!shouldReset) {
      return;
    }

    toast.loading('Сбрасываем демо-базу...', { id: 'reset-demo-list' });

    try {
      const result = await resetDemoData.mutateAsync();
      toast.success('Демо-база очищена', {
        id: 'reset-demo-list',
        description: `Удалено табелей: ${result.clearedTimesheetsCount}. Справочник задач оставлен для нового старта.`,
      });
      setShowDemoOnboarding(true);
    } catch {
      toast.error('Не удалось сбросить демо-базу', {
        id: 'reset-demo-list',
        description: 'Попробуйте повторить действие еще раз.',
      });
    }
  };

  const updateSearch = (
    patch: Partial<{
      month: string;
      status: TimesheetStatusFilter;
      q: string;
    }>,
    replace = true
  ) => {
    void navigate({
      to: '/timesheets',
      search: {
        month: patch.month ?? selectedMonth,
        status: patch.status ?? statusFilter,
        q: patch.q ?? searchQuery,
      },
      replace,
    });
  };

  return (
    <section className="space-y-5 xl:space-y-6">
      {showDemoOnboarding && (
        <div className="app-surface overflow-hidden rounded-[1.5rem] border-sky-300/20 bg-[linear-gradient(135deg,var(--accent-soft),transparent_72%)]">
          <div className="flex flex-col gap-5 px-4 py-5 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-[var(--panel-bg-strong)] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Demo onboarding
                </span>
                <div>
                  <h2 className="text-2xl font-semibold">
                    Три быстрых сценария, чтобы показать приложение за пару минут.
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                    Это публичное демо. Можно наполнить локальную базу, пройтись по журналу,
                    открыть редактор и проверить offline-first поведение без реального backend.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowDemoOnboarding(false)}
                variant="secondary"
                size="icon"
                className="h-11 w-11 self-start rounded-2xl"
                aria-label="Скрыть onboarding"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <article className="app-surface-strong rounded-[1.25rem] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-400/15 p-3 text-[var(--success-text)]">
                    <DatabaseZap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Шаг 1</p>
                    <h3 className="text-lg font-semibold">Подготовить базу</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
                  Заполните локальное хранилище готовыми задачами и табелями, чтобы сразу
                  показать рабочий журнал и статусы.
                </p>
                <Button
                  onClick={() => void handleSeedDemoData()}
                  disabled={seedDemoData.isPending}
                  variant="secondary"
                  className="mt-5 border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)] hover:bg-emerald-400/20"
                >
                  <DatabaseZap className="h-4 w-4" />
                  Заполнить демо-данными
                </Button>
              </article>

              <article className="app-surface-strong rounded-[1.25rem] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-400/15 p-3 text-[var(--accent)]">
                    <FolderClock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Шаг 2</p>
                    <h3 className="text-lg font-semibold">Открыть рабочий день</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
                  Перейдите в табель за сегодня или откройте существующую запись и посмотрите
                  редактор, пересчет времени и локальное сохранение.
                </p>
                <Button
                  onClick={() =>
                    void navigate({
                      to: '/timesheet/$date',
                      params: { date: startOfToday() },
                    })
                  }
                  variant="secondary"
                  className="mt-5 border-sky-300/20 bg-sky-400/10 text-[var(--accent)] hover:bg-sky-400/20"
                >
                  <Plus className="h-4 w-4" />
                  Открыть табель на сегодня
                </Button>
              </article>

              <article className="app-surface-strong rounded-[1.25rem] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-400/15 p-3 text-[var(--warning-text)]">
                    <WifiOff className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Шаг 3</p>
                    <h3 className="text-lg font-semibold">Проверить offline flow</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
                  Отключите сеть в DevTools или на устройстве, сохраните изменения и затем
                  вернитесь в онлайн, чтобы показать pending sync и ручной запуск синка.
                </p>
                <Button
                  onClick={() =>
                    toast('Как показать offline-first', {
                      description:
                        'Отключите сеть в DevTools или на устройстве, сохраните табель и затем вернитесь в онлайн, чтобы показать pending sync и ручной запуск синхронизации.',
                    })
                  }
                  variant="secondary"
                  className="mt-5 border-amber-300/20 bg-amber-400/10 text-[var(--warning-text)] hover:bg-amber-400/20"
                >
                  <WifiOff className="h-4 w-4" />
                  Показать подсказку
                </Button>
              </article>
            </div>
          </div>
        </div>
      )}

      <div className="app-surface overflow-hidden rounded-[1.25rem]">
        <div className="grid gap-5 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(0,1.7fr)_320px] xl:px-6">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
              <CalendarRange className="h-3.5 w-3.5" />
              Главный экран табелей
            </span>
            <div className="space-y-2.5">
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight xl:text-[1.9rem]">
                Журнал табелей для ежедневной работы без лишней навигации.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                Здесь остается только то, что действительно важно для ежедневной работы:
                открыть день, завести часы и быстро вернуться к нужному табелю.
              </p>
              {syncStatus && syncStatus.pendingCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-2.5 text-sm text-[var(--warning-text)]">
                  Есть локальные изменения, ожидающие синхронизации: {syncStatus.pendingCount}
                </div>
              )}
              <div className="inline-flex items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/10 px-4 py-2.5 text-sm text-[var(--accent)]">
                Публичное демо: можно безопасно исследовать интерфейс и offline flow на
                локальных данных.
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button
                onClick={() =>
                  navigate({
                    to: '/timesheet/$date',
                    params: { date: startOfToday() },
                  })
                }
                className="bg-white text-slate-950 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Создать табель на сегодня
              </Button>
              <Button
                onClick={() => {
                  updateSearch({
                    month: getCurrentMonth(),
                    status: 'all',
                    q: '',
                  });
                }}
                variant="secondary"
                className="text-[var(--text-soft)]"
              >
                Сбросить фильтры
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => void handleSeedDemoData()}
                disabled={seedDemoData.isPending}
                variant="secondary"
                className="border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)] hover:bg-emerald-400/20"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Заполнить демо-данными
              </Button>
              <Button
                onClick={() => void handleResetDemoData()}
                disabled={resetDemoData.isPending || (!hasAnyTimesheets && !syncStatus?.pendingCount)}
                variant="secondary"
                className="border-rose-300/20 bg-rose-400/10 text-[var(--danger-text)] hover:bg-rose-400/20 disabled:opacity-60"
              >
                <RefreshCcw className="h-4 w-4" />
                Сбросить демо-базу
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {activeSummary.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-[1rem] border border-[var(--panel-border)] bg-gradient-to-br p-4',
                    item.accent
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[var(--text-soft)]">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg-strong)] p-3">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="app-surface rounded-[1.25rem] p-4 sm:p-5">
        <div className="flex flex-col gap-4 border-b border-[var(--panel-border)] pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">Журнал</p>
              <h2 className="mt-1 text-xl font-semibold">Табели за рабочий период</h2>
            </div>
            <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--text-soft)]">
              Период: {formatMonthLabel(selectedMonth)}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-[minmax(0,1fr)_180px_180px]">
            <label className="relative block">
              <span className="sr-only">Поиск по табелям</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(event) => updateSearch({ q: event.target.value })}
                placeholder="Поиск по дате или описанию"
                className="h-11 rounded-xl bg-[var(--panel-muted)] pl-10 pr-4"
              />
            </label>

            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                <CalendarRange className="h-3.5 w-3.5" />
                Месяц
              </span>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(event) => updateSearch({ month: event.target.value })}
                className="h-11 rounded-xl bg-[var(--panel-muted)] [color-scheme:light_dark]"
              />
            </label>

            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                <Filter className="h-3.5 w-3.5" />
                Статус
              </span>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  updateSearch({ status: value as TimesheetStatusFilter })
                }
              >
                <SelectTrigger aria-label="Статус" className="h-11 rounded-xl bg-[var(--panel-muted)]">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 py-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-[1rem] border border-[var(--panel-border)] bg-[var(--panel-muted)]"
              />
            ))}
          </div>
        ) : filteredTimesheets.length === 0 && hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-3xl border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)] p-6">
              <FileSearch className="h-10 w-10 text-[var(--text-muted)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Ничего не найдено</h3>
              <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
                Попробуйте изменить месяц, сбросить статус или убрать поисковый запрос.
              </p>
            </div>
            <Button
              onClick={() => {
                updateSearch({
                  status: 'all',
                  q: '',
                });
              }}
              variant="secondary"
            >
              Сбросить фильтры
            </Button>
          </div>
        ) : isEmptyMonth ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-3xl border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)] p-6">
              <FileSpreadsheet className="h-10 w-10 text-[var(--text-muted)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Пока нет табелей за этот месяц</h3>
              <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
                Можно создать первый табель вручную или в один клик заполнить локальную базу
                реалистичными демо-данными для показа приложения.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => void handleSeedDemoData()}
                disabled={seedDemoData.isPending}
                variant="secondary"
                className="border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)] hover:bg-emerald-400/20"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Заполнить демо-данными
              </Button>
              <Button
                onClick={() =>
                  navigate({
                    to: '/timesheet/$date',
                    params: { date: startOfToday() },
                  })
                }
                className="bg-white text-slate-950 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Создать первый табель
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
              <span>
                Найдено табелей: <span className="font-medium text-[var(--app-fg)]">{filteredTimesheets.length}</span>
              </span>
              {hasActiveFilters && <span>Показан отфильтрованный список</span>}
            </div>

            <div className="mt-4 grid gap-3 xl:hidden">
              {filteredTimesheets.map((timesheet) => (
                <button
                  type="button"
                  key={timesheet.id}
                  onClick={() =>
                    navigate({
                      to: '/timesheet/$date',
                      params: { date: timesheet.date },
                    })
                  }
                  className="app-surface rounded-[1.25rem] p-4 text-left transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">
                        {formatTimesheetDate(timesheet.date)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        {timesheet.rows.length} строк, {getTotalHours(timesheet.rows)} ч
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium',
                        statusConfig[timesheet.status].className
                      )}
                    >
                      {statusConfig[timesheet.status].label}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-soft)]">
                    <span className="line-clamp-1">
                      {timesheet.rows[0]?.description || 'Без описания работ'}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            <TimesheetsDesktopTable
              timesheets={filteredTimesheets}
              onOpenTimesheet={(date) =>
                navigate({
                  to: '/timesheet/$date',
                  params: { date },
                })
              }
            />
          </>
        )}
      </div>
    </section>
  );
}
