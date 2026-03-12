import { useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  FileSpreadsheet,
  NotebookPen,
  PlaySquare,
  Plus,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { appConfig } from '../config/app-config';
import { useResetDemoData } from '../hooks/useResetDemoData';
import { useSeedDemoData } from '../hooks/useSeedDemoData';
import { useTimesheets } from '../hooks/useTimesheets';
import type { Timesheet } from '../api/mockBackend';
import { getDefaultTimesheetsSearch } from '../routes/_authenticated/timesheets';

const startOfToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMonthLabel = (period: string) => {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
};

const getTotalHours = (rows: Timesheet['rows']): number => {
  const totalMinutes = rows.reduce((sum, row) => sum + row.duration, 0);
  return Math.round((totalMinutes / 60) * 10) / 10;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const defaultSearch = getDefaultTimesheetsSearch();
  const { data: timesheets = [] } = useTimesheets(defaultSearch.period);
  const seedDemoData = useSeedDemoData();
  const resetDemoData = useResetDemoData();

  const totals = {
    timesheets: timesheets.length,
    hours:
      Math.round(timesheets.reduce((sum, timesheet) => sum + getTotalHours(timesheet.rows), 0) * 10) /
      10,
    draft: timesheets.filter((timesheet) => timesheet.status === 'draft').length,
    approved: timesheets.filter((timesheet) => timesheet.status === 'approved').length,
  };

  const summaryActions = [
    {
      key: 'timesheets',
      label: 'Табелей',
      value: String(totals.timesheets),
      icon: FileSpreadsheet,
      onClick: () =>
        navigate({
          to: '/timesheets',
          search: defaultSearch,
        }),
    },
    {
      key: 'hours',
      label: 'Часов',
      value: `${totals.hours} ч`,
      icon: Clock3,
      onClick: () =>
        navigate({
          to: '/timesheets',
          search: defaultSearch,
        }),
    },
    {
      key: 'draft',
      label: 'Черновиков',
      value: String(totals.draft),
      icon: NotebookPen,
      onClick: () =>
        navigate({
          to: '/timesheets',
          search: {
            ...defaultSearch,
            status: 'draft',
          },
        }),
    },
    {
      key: 'approved',
      label: 'Утверждено',
      value: String(totals.approved),
      icon: CheckCircle2,
      onClick: () =>
        navigate({
          to: '/timesheets',
          search: {
            ...defaultSearch,
            status: 'approved',
          },
        }),
    },
  ] as const;

  const handleSeedDemoData = async () => {
    toast.loading('Подготавливаем демо-данные...', { id: 'dashboard-seed-demo' });

    try {
      const result = await seedDemoData.mutateAsync();
      toast.success('Демо-данные готовы', {
        id: 'dashboard-seed-demo',
        description: `Добавлено ${result.timesheetsCount} табелей и ${result.tasksCount} задач.`,
      });
    } catch {
      toast.error('Не удалось подготовить демо-данные', {
        id: 'dashboard-seed-demo',
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

    toast.loading('Сбрасываем демо-данные...', { id: 'dashboard-reset-demo' });

    try {
      const result = await resetDemoData.mutateAsync();
      toast.success('Демо-база очищена', {
        id: 'dashboard-reset-demo',
        description: `Удалено табелей: ${result.clearedTimesheetsCount}.`,
      });
    } catch {
      toast.error('Не удалось сбросить демо-данные', {
        id: 'dashboard-reset-demo',
      });
    }
  };

  return (
    <section className="-mt-1 max-w-[1120px] space-y-4 xl:-mt-2 xl:space-y-4">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,720px)_minmax(320px,360px)]">
      <article className="app-surface-strong p-4 sm:p-5 xl:p-5">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Текущий период
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight xl:text-[2.15rem]">
                    Табели
                  </h1>
                  <span className="inline-flex items-center rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] px-2.5 py-1 text-xs text-[var(--text-soft)]">
                    {formatMonthLabel(defaultSearch.period)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
              <Button
                onClick={() =>
                  navigate({
                    to: '/timesheet/$date',
                    params: { date: startOfToday() },
                  })
                }
                className="h-11"
              >
                <Plus className="h-4 w-4" />
                Табель на сегодня
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate({
                    to: '/timesheets',
                    search: defaultSearch,
                  })
                }
                className="h-11"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Открыть журнал
              </Button>
            </div>
          </div>

          <div className="grid max-w-[680px] gap-3 grid-cols-2 sm:grid-cols-4">
            {summaryActions.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className="group flex aspect-square min-h-[7.75rem] flex-col justify-between border border-[var(--panel-border)] bg-[var(--panel-muted)] p-3 text-left transition hover:bg-[var(--panel-hover)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {item.label}
                    </p>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-2xl font-semibold text-[var(--app-fg)]">{item.value}</p>
                    <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:text-[var(--accent)]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </article>

      {appConfig.features.demoRoute ? (
        <article className="app-surface p-4 sm:p-5 xl:p-5">
          <div className="flex h-full flex-col gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">Демо</h2>
                <span className="inline-flex items-center rounded-[var(--badge-radius)] border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[var(--accent)] dark:text-sky-200">
                  сценарий
                </span>
              </div>
              <p className="text-sm leading-6 text-[var(--text-soft)]">
                Быстрая подготовка демо-данных и переход в подробный центр с инструкциями.
              </p>
            </div>

            <div className="grid gap-2">
              <Button
                onClick={() => void handleSeedDemoData()}
                disabled={!appConfig.features.demoDataTools || seedDemoData.isPending}
                variant="secondary"
                className="h-10 justify-start"
              >
                <DatabaseZap className="h-4 w-4" />
                Подготовить данные
              </Button>
              <Button
                onClick={() => void handleResetDemoData()}
                disabled={!appConfig.features.demoDataTools || resetDemoData.isPending}
                variant="secondary"
                className="h-10 justify-start"
              >
                <RefreshCcw className="h-4 w-4" />
                Сбросить данные
              </Button>
              <Button
                onClick={() => navigate({ to: '/demo' })}
                variant="secondary"
                className="h-10 justify-start"
              >
                <PlaySquare className="h-4 w-4" />
                Открыть демо-центр
              </Button>
            </div>
          </div>
        </article>
      ) : null}
      </div>
    </section>
  );
}
