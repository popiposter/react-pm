import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  ArrowRight,
  CalendarRange,
  CheckCheck,
  ChevronDown,
  FileSearch,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { TimesheetsDesktopTable } from '../components/timesheets/TimesheetsDesktopTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DocumentActionBar } from '../components/workspace/DocumentActionBar';
import { DocumentTableToolbar } from '../components/workspace/DocumentTableToolbar';
import { EntityPageHeader } from '../components/workspace/EntityPageHeader';
import { PageBreadcrumbs } from '../components/workspace/PageBreadcrumbs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { appConfig } from '../config/app-config';
import { useBulkUpdateTimesheets } from '../hooks/useBulkUpdateTimesheets';
import { useTimesheets } from '../hooks/useTimesheets';
import { useSyncStatus } from '../hooks/useSyncStatus';
import type { Timesheet } from '../api/mockBackend';
import { cn } from '../lib/utils';
import { type TimesheetStatusFilter } from '../routes/_authenticated/timesheets';
import { toast } from 'sonner';

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

const shiftPeriod = (period: string, delta: number) => {
  const [year, monthNumber] = period.split('-').map(Number);
  const nextDate = new Date(year, monthNumber - 1 + delta, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
};

const getLocalMonthPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const MONTH_LABELS = Array.from({ length: 12 }, (_, monthIndex) =>
  new Date(2026, monthIndex, 1).toLocaleDateString('ru-RU', {
    month: 'short',
  })
    .replace('.', '')
    .replace(/^./, (char) => char.toUpperCase())
);

function PeriodPicker({
  period,
  onChange,
}: {
  period: string;
  onChange: (period: string) => void;
}) {
  const [year] = period.split('-').map(Number);
  const [isOpen, setIsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPickerYear(year);
  }, [year, period]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <div className="grid h-11 grid-cols-[44px_minmax(0,1fr)_44px] items-stretch overflow-hidden rounded-[var(--control-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg-strong)]">
        <button
          type="button"
          onClick={() => onChange(shiftPeriod(period, -1))}
          className="relative z-[1] inline-flex h-full items-center justify-center border-r border-[var(--panel-border)] bg-[var(--panel-bg-strong)] text-[var(--text-muted)] transition hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
          aria-label="Предыдущий период"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="relative z-[1] inline-flex min-w-0 items-center justify-center gap-2 bg-[var(--panel-bg-strong)] px-3 text-sm font-medium text-[var(--app-fg)] transition hover:bg-[var(--panel-hover)]"
          aria-expanded={isOpen}
          aria-label={`Выбрать период, сейчас ${formatMonthLabel(period)}`}
        >
          <span className="truncate">{formatMonthLabel(period)}</span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-[var(--text-muted)] transition', isOpen && 'rotate-180')}
          />
        </button>
        <button
          type="button"
          onClick={() => onChange(shiftPeriod(period, 1))}
          className="relative z-[1] inline-flex h-full items-center justify-center border-l border-[var(--panel-border)] bg-[var(--panel-bg-strong)] text-[var(--text-muted)] transition hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
          aria-label="Следующий период"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {isOpen ? (
        <div className="app-surface-strong absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full min-w-[19rem] p-3 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.65)]">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--panel-border)] pb-3">
            <button
              type="button"
              onClick={() => setPickerYear((value) => value - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--control-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] text-[var(--text-soft)] transition hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
              aria-label="Предыдущий год"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </button>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Рабочий период
              </p>
              <p className="mt-1 text-base font-semibold">{pickerYear}</p>
            </div>
            <button
              type="button"
              onClick={() => setPickerYear((value) => value + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--control-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] text-[var(--text-soft)] transition hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
              aria-label="Следующий год"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {MONTH_LABELS.map((label, monthIndex) => {
              const optionValue = `${pickerYear}-${String(monthIndex + 1).padStart(2, '0')}`;
              const isSelected = optionValue === period;

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => {
                    onChange(optionValue);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'inline-flex h-10 items-center justify-center rounded-[var(--badge-radius)] border px-3 text-sm transition',
                    isSelected
                      ? 'border-sky-300/20 bg-sky-400/10 text-[var(--accent)]'
                      : 'border-[var(--panel-border)] bg-[var(--panel-muted)] text-[var(--text-soft)] hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--panel-border)] pt-3">
            <button
              type="button"
              onClick={() => {
                onChange(getLocalMonthPeriod());
                setIsOpen(false);
              }}
              className="inline-flex items-center gap-2 text-sm text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            >
              <CalendarRange className="h-4 w-4" />
              Текущий месяц
            </button>
            <span className="text-xs text-[var(--text-muted)]">{formatMonthLabel(period)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

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

const statusFilterOptions: Array<{
  value: TimesheetStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'Все статусы' },
  { value: 'draft', label: 'Черновики' },
  { value: 'submitted', label: 'Отправленные' },
  { value: 'approved', label: 'Утвержденные' },
];

const statusFilterMeta: Record<
  TimesheetStatusFilter,
  { label: string; dotClassName: string; triggerClassName?: string }
> = {
  all: {
    label: 'Все статусы',
    dotClassName: 'bg-[var(--text-muted)]/70',
  },
  draft: {
    label: 'Черновики',
    dotClassName: 'bg-slate-400',
    triggerClassName: 'border-slate-300/20 bg-slate-400/10',
  },
  submitted: {
    label: 'Отправленные',
    dotClassName: 'bg-sky-300',
    triggerClassName: 'border-sky-300/20 bg-sky-400/10',
  },
  approved: {
    label: 'Утвержденные',
    dotClassName: 'bg-emerald-300',
    triggerClassName: 'border-emerald-300/20 bg-emerald-400/10',
  },
};

const startOfToday = () => new Date().toISOString().split('T')[0];

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

export default function TimesheetsList() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_authenticated/timesheets' });
  const selectedPeriod = search.period;
  const statusFilter = search.status;
  const searchQuery = search.q;
  const { data: timesheets = [], isLoading } = useTimesheets(selectedPeriod);
  const { data: syncStatus } = useSyncStatus();
  const bulkUpdateMutation = useBulkUpdateTimesheets();

  const filteredTimesheets = useMemo(() => {
    return [...timesheets]
      .filter((timesheet) => statusFilter === 'all' || timesheet.status === statusFilter)
      .filter((timesheet) => matchesSearch(timesheet, searchQuery))
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [searchQuery, statusFilter, timesheets]);

  const hasActiveFilters = statusFilter !== 'all' || searchQuery.trim().length > 0;
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) + (searchQuery.trim().length > 0 ? 1 : 0);
  const isEmptyMonth = !isLoading && filteredTimesheets.length === 0 && !hasActiveFilters;

  const updateSearch = (
    patch: Partial<{
      period: string;
      status: TimesheetStatusFilter;
      q: string;
    }>,
    replace = true
  ) => {
    void navigate({
      to: '/timesheets',
      search: {
        period: patch.period ?? selectedPeriod,
        status: patch.status ?? statusFilter,
        q: patch.q ?? searchQuery,
      },
      replace,
    });
  };

  return (
    <section className="space-y-5 xl:space-y-6">
      <EntityPageHeader
        breadcrumbs={
          <PageBreadcrumbs
            items={[
              { label: 'Документы' },
              { label: 'Табели' },
            ]}
          />
        }
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--accent)]">
            <CalendarRange className="h-3.5 w-3.5" />
            Журнал табелей
          </span>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>Табели за</span>
            <span className="inline-flex items-center rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-1 text-base font-medium text-[var(--text-soft)] xl:text-lg">
              {formatMonthLabel(selectedPeriod)}
            </span>
          </span>
        }
        titleMeta={
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-[var(--text-soft)]">
            <span>Откройте нужный день, быстро проверьте статус и продолжайте работу.</span>
            {syncStatus && syncStatus.pendingCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-[var(--badge-radius)] border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-[var(--warning-text)]">
                Ожидают синхронизации: {syncStatus.pendingCount}
              </span>
            )}
          </div>
        }
        actions={
          <DocumentActionBar className="xl:justify-start">
            <Button
              onClick={() =>
                navigate({
                  to: '/timesheet/$date',
                  params: { date: startOfToday() },
                })
              }
            >
              <Plus className="h-4 w-4" />
              Создать табель на сегодня
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={() => {
                  updateSearch({
                    period: getLocalMonthPeriod(),
                    status: 'all',
                    q: '',
                  });
                  setIsMobileFiltersOpen(false);
                }}
                variant="secondary"
                className="text-[var(--text-soft)]"
              >
                Сбросить фильтры
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </DocumentActionBar>
        }
      />

      <div className="app-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 border-b border-[var(--panel-border)] pb-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.08em] text-[var(--text-muted)]">Журнал</p>
              <h2 className="mt-1 text-xl font-semibold">Список табелей</h2>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 xl:hidden">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-[var(--control-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg-strong)] px-3 py-2 text-sm text-[var(--text-soft)] transition hover:bg-[var(--panel-hover)]"
            >
              <Filter className="h-4 w-4" />
              <span>Фильтры</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--cta)] px-1.5 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-[var(--text-muted)] transition-transform duration-200',
                  isMobileFiltersOpen && 'rotate-180'
                )}
              />
            </button>

            <span className="text-sm text-[var(--text-muted)]">Найдено: {filteredTimesheets.length}</span>
          </div>

          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out xl:block xl:overflow-visible',
              isMobileFiltersOpen
                ? 'max-h-[600px] opacity-100'
                : 'max-h-0 opacity-0 xl:max-h-none xl:opacity-100'
            )}
          >
            <DocumentTableToolbar
              filters={
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_280px_220px_160px] xl:items-end">
                <label className="flex min-w-0 flex-col gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <Search className="h-3.5 w-3.5" />
                    Поиск
                  </span>
                  <div className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => updateSearch({ q: event.target.value })}
                      placeholder="Поиск по дате или описанию"
                      className="h-11 bg-[var(--panel-bg-strong)] pl-10 pr-4"
                    />
                  </div>
                </label>

                <label className="flex min-w-0 flex-col gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <CalendarRange className="h-3.5 w-3.5" />
                    Период
                  </span>
                  <PeriodPicker
                    period={selectedPeriod}
                    onChange={(period) => {
                      updateSearch({ period });
                      setIsMobileFiltersOpen(false);
                    }}
                  />
                </label>

                <label className="flex min-w-0 flex-col gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <Filter className="h-3.5 w-3.5" />
                    Статус
                  </span>
                  <div className="grid grid-cols-[minmax(0,1fr)_36px] gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        updateSearch({ status: value as TimesheetStatusFilter })
                      }
                    >
                      <SelectTrigger
                        aria-label="Статус"
                        className={cn(
                          'h-11 w-full min-w-[220px] bg-[var(--panel-bg-strong)]',
                          statusFilter !== 'all' && statusFilterMeta[statusFilter].triggerClassName
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'h-2.5 w-2.5 shrink-0 rounded-full',
                              statusFilterMeta[statusFilter].dotClassName
                            )}
                          />
                          <SelectValue placeholder="Все статусы" className="truncate">
                            {statusFilterMeta[statusFilter].label}
                          </SelectValue>
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {statusFilterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() => updateSearch({ status: 'all' })}
                      disabled={statusFilter === 'all'}
                      className={cn(
                        'inline-flex h-11 w-9 items-center justify-center border transition',
                        statusFilter === 'all'
                          ? 'border-[var(--panel-border)] bg-[var(--panel-muted)] text-[var(--text-muted)] opacity-45'
                          : 'border-[var(--panel-border)] bg-[var(--panel-bg-strong)] text-[var(--text-soft)] hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]'
                      )}
                      aria-label="Сбросить статусный фильтр"
                      title="Сбросить статусный фильтр"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </label>

                <div className="flex min-w-0 flex-col gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Действия
                  </span>
                  <Button
                    onClick={() => {
                      updateSearch({
                        period: getLocalMonthPeriod(),
                        status: 'all',
                        q: '',
                      });
                      setIsMobileFiltersOpen(false);
                    }}
                    variant="secondary"
                    className="h-11 w-full"
                  >
                    Сбросить
                  </Button>
                </div>
                </div>
              }
              actions={
                <>
                  <span className="hidden xl:inline-flex h-10 items-center rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg-strong)] px-3 text-sm text-[var(--text-soft)]">
                    Найдено: {filteredTimesheets.length}
                  </span>
                  {hasActiveFilters && (
                    <span className="inline-flex h-10 items-center rounded-[var(--badge-radius)] border border-sky-300/20 bg-sky-400/10 px-3 text-sm text-[var(--accent)]">
                      Фильтры активны
                    </span>
                  )}
                </>
              }
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 py-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse border border-[var(--panel-border)] bg-[var(--panel-muted)]"
              />
            ))}
          </div>
        ) : filteredTimesheets.length === 0 && hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-[var(--surface-radius)] border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)] p-6">
              <FileSearch className="h-10 w-10 text-[var(--text-muted)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Ничего не найдено</h3>
              <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
                Попробуйте расширить период, убрать статусный фильтр или очистить поисковую строку.
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
            <div className="rounded-[var(--surface-radius)] border border-dashed border-[var(--panel-border)] bg-[var(--panel-muted)] p-6">
              <FileSpreadsheet className="h-10 w-10 text-[var(--text-muted)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Пока нет табелей за этот период</h3>
              <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
                Начните с табеля на сегодня или загрузите демо-данные, чтобы сразу показать рабочий сценарий.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() =>
                  navigate({
                    to: '/timesheet/$date',
                    params: { date: startOfToday() },
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Создать первый табель
              </Button>
              {appConfig.features.demoRoute && (
                <Button onClick={() => navigate({ to: '/demo' })} variant="secondary">
                  Открыть демо-центр
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
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
                  className="app-surface p-4 text-left transition active:scale-[0.99] active:bg-[var(--panel-hover)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">
                        {formatTimesheetDate(timesheet.date)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Строк: {timesheet.rows.length} · Часов: {getTotalHours(timesheet.rows)}
                      </p>
                    </div>
                    <span className={statusConfig[timesheet.status].className}>
                      {statusConfig[timesheet.status].label}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-soft)]">
                    <span className="line-clamp-1">
                      {timesheet.rows[0]?.description || 'Без описания работ'}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  </div>
                </button>
              ))}
            </div>

            <TimesheetsDesktopTable
              timesheets={filteredTimesheets}
              bulkActions={({ selectedRows, clearSelection }) => (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10"
                    disabled={bulkUpdateMutation.isPending || selectedRows.length === 0}
                    onClick={() => {
                      toast.promise(
                        bulkUpdateMutation
                          .mutateAsync({ timesheets: selectedRows, status: 'submitted' })
                          .then(() => clearSelection()),
                        {
                          loading: 'Отправляем выбранные табели...',
                          success: `Табелей обновлено: ${selectedRows.length}`,
                          error: 'Не удалось обновить выбранные табели',
                        }
                      );
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Отправить
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10"
                    disabled={bulkUpdateMutation.isPending || selectedRows.length === 0}
                    onClick={() => {
                      toast.promise(
                        bulkUpdateMutation
                          .mutateAsync({ timesheets: selectedRows, status: 'approved' })
                          .then(() => clearSelection()),
                        {
                          loading: 'Утверждаем выбранные табели...',
                          success: `Табелей утверждено: ${selectedRows.length}`,
                          error: 'Не удалось утвердить выбранные табели',
                        }
                      );
                    }}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Утвердить
                  </Button>
                </>
              )}
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
