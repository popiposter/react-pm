import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarRange,
  CircleCheckBig,
  Clock3,
  FileSpreadsheet,
  NotebookPen,
  Plus,
} from 'lucide-react';
import { useTimesheets } from '../hooks/useTimesheets';
import type { Timesheet } from '../api/mockBackend';
import { cn } from '../lib/utils';

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
    className: 'border-slate-400/20 bg-slate-400/10 text-slate-200',
  },
  submitted: {
    label: 'Отправлен',
    className: 'border-sky-300/20 bg-sky-400/15 text-sky-200',
  },
  approved: {
    label: 'Утвержден',
    className: 'border-emerald-300/20 bg-emerald-400/15 text-emerald-200',
  },
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const startOfToday = () => new Date().toISOString().split('T')[0];

const summaryCards = (timesheets: Timesheet[]) => {
  const approved = timesheets.filter((timesheet) => timesheet.status === 'approved').length;
  const draft = timesheets.filter((timesheet) => timesheet.status === 'draft').length;
  const totalHours = Math.round(
    timesheets.reduce((sum, timesheet) => sum + getTotalHours(timesheet.rows), 0) * 10
  ) / 10;

  return [
    {
      label: 'Табелей за месяц',
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
  const currentMonth = getCurrentMonth();
  const { data: timesheets = [], isLoading } = useTimesheets(currentMonth);

  const sortedTimesheets = [...timesheets].sort((left, right) => right.date.localeCompare(left.date));

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_30px_120px_-48px_rgba(15,23,42,0.95)]">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.5fr_0.9fr] lg:px-8 lg:py-10">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-sky-200">
              <CalendarRange className="h-3.5 w-3.5" />
              Главный экран табелей
            </span>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Красивый и быстрый журнал табелей без лишней навигации.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Здесь остается только то, что действительно важно для ежедневной работы:
                открыть день, завести часы и быстро вернуться к нужному табелю.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(`/timesheet/${startOfToday()}`)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Создать табель на сегодня
              </button>
              <button
                type="button"
                onClick={() => navigate('/timesheets')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Текущий месяц
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {summaryCards(sortedTimesheets).map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-[1.75rem] border border-white/10 bg-gradient-to-br p-5',
                    item.accent
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-300">{item.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-slate-100">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_25px_80px_-50px_rgba(15,23,42,0.95)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Журнал</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Табели за текущий месяц</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Период: {currentMonth}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 py-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : sortedTimesheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6">
              <FileSpreadsheet className="h-10 w-10 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Пока нет табелей за этот месяц</h3>
              <p className="max-w-md text-sm leading-6 text-slate-400">
                Создайте первый табель, и он сразу появится в журнале. Дальше экран станет
                основной точкой входа в ежедневную работу.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/timesheet/${startOfToday()}`)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
              Создать первый табель
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 xl:hidden">
              {sortedTimesheets.map((timesheet) => (
                <button
                  type="button"
                  key={timesheet.id}
                  onClick={() => navigate(`/timesheet/${timesheet.date}`)}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-sky-300/30 hover:bg-sky-400/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {formatTimesheetDate(timesheet.date)}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
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
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                    <span className="line-clamp-1">
                      {timesheet.rows[0]?.description || 'Без описания работ'}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 hidden overflow-hidden rounded-[1.5rem] border border-white/10 xl:block">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/[0.04] text-left text-sm text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Дата</th>
                    <th className="px-6 py-4 font-medium">Статус</th>
                    <th className="px-6 py-4 font-medium">Строк</th>
                    <th className="px-6 py-4 font-medium">Часы</th>
                    <th className="px-6 py-4 font-medium">Последняя заметка</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm text-slate-200">
                  {sortedTimesheets.map((timesheet) => (
                    <tr
                      key={timesheet.id}
                      className="bg-white/[0.02] transition hover:bg-sky-400/[0.07]"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {formatTimesheetDate(timesheet.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            statusConfig[timesheet.status].className
                          )}
                        >
                          {statusConfig[timesheet.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">{timesheet.rows.length}</td>
                      <td className="px-6 py-4">{getTotalHours(timesheet.rows)} ч</td>
                      <td className="px-6 py-4 text-slate-400">
                        {timesheet.rows[0]?.description || 'Без описания работ'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/timesheet/${timesheet.date}`)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition hover:border-sky-300/30 hover:bg-sky-400/10"
                        >
                          Открыть
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
