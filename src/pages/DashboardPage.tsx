import { useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  FileSpreadsheet,
  FolderClock,
  Play,
  PlaySquare,
  Plus,
  Workflow,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { DocumentActionBar } from '../components/workspace/DocumentActionBar';
import { EntityPageHeader } from '../components/workspace/EntityPageHeader';
import { PageBreadcrumbs } from '../components/workspace/PageBreadcrumbs';
import { appConfig } from '../config/app-config';
import { getDefaultTimesheetsSearch } from '../routes/_authenticated/timesheets';

const startOfToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTodayLabel = (value = new Date()) =>
  value.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });

const formatMonthLabel = (value = new Date()) =>
  value.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = new Date();

  return (
    <section className="space-y-5 xl:space-y-6">
      <EntityPageHeader
        breadcrumbs={<PageBreadcrumbs items={[{ label: 'Главная' }]} />}
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--accent)]">
            <CalendarDays className="h-3.5 w-3.5" />
            Рабочий стол
          </span>
        }
        title="Проектные табели"
        titleMeta={
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-[var(--text-soft)]">
            <span>Домашний экран для быстрого старта в рабочий контур.</span>
            <span className="inline-flex items-center gap-2 rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-1 text-xs text-[var(--text-soft)]">
              <CalendarRange className="h-3.5 w-3.5" />
              {formatMonthLabel(today)}
            </span>
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
              Табель на сегодня
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate({
                  to: '/timesheets',
                  search: getDefaultTimesheetsSearch(),
                })
              }
            >
              <FileSpreadsheet className="h-4 w-4" />
              Открыть журнал
            </Button>
          </DocumentActionBar>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="app-surface-strong overflow-hidden p-5 sm:p-6 xl:p-7">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-[var(--badge-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-soft)]">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Табели
                </span>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold tracking-tight xl:text-[2rem]">
                    Журнал, рабочий день и быстрый переход к нужному табелю
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                    Открывайте рабочий период, находите нужный день и переходите в редактор без
                    лишних промежуточных экранов. Домашняя страница оставляет под рукой только
                    основные рабочие входы.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Основной сценарий
                    </p>
                    <p className="mt-2 text-sm text-[var(--app-fg)]">
                      Журнал, фильтры, открытие табеля и быстрый переход к рабочему дню.
                    </p>
                  </div>
                  <div className="border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Что под рукой
                    </p>
                    <div className="mt-2 space-y-2 text-sm text-[var(--app-fg)]">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-[var(--accent)]" />
                        Журнал за текущий период
                      </div>
                      <div className="flex items-center gap-2">
                        <FolderClock className="h-4 w-4 text-[var(--accent)]" />
                        Табель на сегодня
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-[var(--accent)]" />
                        Быстрый вход в рабочий поток
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="border border-[var(--panel-border)] bg-[color-mix(in_oklab,var(--panel-bg-strong)_86%,var(--panel-muted)_14%)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Сегодня
                  </p>
                  <p className="mt-2 text-lg font-semibold capitalize">{formatTodayLabel(today)}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    Быстрый вход в текущий рабочий день без поиска по журналу.
                  </p>
                </div>
                <div className="border border-[var(--panel-border)] bg-[color-mix(in_oklab,var(--panel-bg-strong)_84%,var(--panel-muted)_16%)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Рабочий период
                  </p>
                  <p className="mt-2 text-lg font-semibold">{formatMonthLabel(today)}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    Переходите в журнал и сразу работайте в текущем периоде по умолчанию.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() =>
                  navigate({
                    to: '/timesheets',
                    search: getDefaultTimesheetsSearch(),
                  })
                }
                className="h-11"
              >
                Открыть журнал
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate({
                    to: '/timesheet/$date',
                    params: { date: startOfToday() },
                  })
                }
                className="h-11"
              >
                <FolderClock className="h-4 w-4" />
                Сегодня
              </Button>
            </div>
          </div>
        </article>

        {appConfig.features.demoRoute ? (
          <article className="app-surface overflow-hidden p-5 sm:p-6 xl:p-7">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-[var(--badge-radius)] border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--accent)] dark:text-sky-200">
                  <PlaySquare className="h-3.5 w-3.5" />
                  Демо
                </span>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold tracking-tight xl:text-[1.7rem]">
                    Презентационный контур
                  </h2>
                  <p className="text-sm leading-6 text-[var(--text-soft)]">
                    Отсюда удобно запускать демо-сценарий, готовить локальные данные и
                    переключаться в рабочие экраны без лишнего шума в навигации.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Когда использовать
                    </p>
                    <p className="mt-2 text-sm text-[var(--app-fg)]">
                      Для показа продукта, seed демо-данных и подготовки управляемого сценария.
                    </p>
                  </div>
                  <div className="border border-[var(--panel-border)] bg-[var(--accent-soft)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">
                      Режим показа
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-[var(--app-fg)]">
                      <Play className="h-4 w-4" />
                      Демо-центр остается отдельным контуром и не мешает рабочей навигации.
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={() => navigate({ to: '/demo' })} variant="secondary" className="h-11">
                Открыть демо-центр
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
