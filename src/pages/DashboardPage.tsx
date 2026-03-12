import { useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  NotebookPen,
  PlaySquare,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { appConfig } from '../config/app-config';
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

  return (
    <section className="space-y-5 xl:space-y-6">
      <article className="app-surface-strong p-5 sm:p-6 xl:p-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Текущий период
                </p>
                <h1 className="text-2xl font-semibold tracking-tight xl:text-[2.35rem]">
                  Табели
                </h1>
                <p className="text-sm text-[var(--text-soft)]">{formatMonthLabel(defaultSearch.period)}</p>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                Открывайте журнал, переходите к рабочему дню и быстро смотрите ключевые итоги за
                текущий месяц в одном месте.
              </p>
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
              {appConfig.features.demoRoute ? (
                <Button
                  variant="secondary"
                  onClick={() => navigate({ to: '/demo' })}
                  className="h-11"
                >
                  <PlaySquare className="h-4 w-4" />
                  Демо
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryActions.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className="group flex items-center justify-between gap-4 border border-[var(--panel-border)] bg-[var(--panel-muted)] px-4 py-4 text-left transition hover:bg-[var(--panel-hover)]"
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--app-fg)]">{item.value}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3 text-[var(--text-muted)] transition group-hover:text-[var(--accent)]">
                    <Icon className="h-4.5 w-4.5" />
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </article>
    </section>
  );
}
