import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  DatabaseZap,
  FileSpreadsheet,
  FolderClock,
  RefreshCcw,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { appConfig } from '../config/app-config';
import { useAuth } from '../features/auth/auth';
import { useResetDemoData } from '../hooks/useResetDemoData';
import { useSeedDemoData } from '../hooks/useSeedDemoData';
import { getDefaultTimesheetsSearch } from '../routes/_authenticated/timesheets';

const startOfToday = () => new Date().toISOString().split('T')[0];

export default function DemoPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const seedDemoData = useSeedDemoData();
  const resetDemoData = useResetDemoData();

  const handleSeedDemoData = async () => {
    toast.loading('Подготавливаем демо-данные...', { id: 'seed-demo-center' });

    try {
      const result = await seedDemoData.mutateAsync();
      toast.success('Демо-база готова', {
        id: 'seed-demo-center',
        description: `Добавлено ${result.timesheetsCount} табелей и ${result.tasksCount} задач.`,
      });
    } catch {
      toast.error('Не удалось подготовить демо-данные', {
        id: 'seed-demo-center',
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

    toast.loading('Сбрасываем демо-базу...', { id: 'reset-demo-center' });

    try {
      const result = await resetDemoData.mutateAsync();
      toast.success('Демо-база очищена', {
        id: 'reset-demo-center',
        description: `Удалено табелей: ${result.clearedTimesheetsCount}. Справочник задач оставлен для нового старта.`,
      });
    } catch {
      toast.error('Не удалось сбросить демо-базу', {
        id: 'reset-demo-center',
        description: 'Попробуйте повторить действие еще раз.',
      });
    }
  };

  const handleOpenJournal = async () => {
    if (auth.isAuthenticated) {
      await navigate({ to: '/timesheets', search: getDefaultTimesheetsSearch() });
      return;
    }

    await navigate({
      to: '/login',
      search: {
        redirect: '/timesheets',
        reason: undefined,
      },
    });
  };

  const handleOpenToday = async () => {
    const timesheetPath = `/timesheet/${startOfToday()}`;

    if (auth.isAuthenticated) {
      await navigate({
        to: '/timesheet/$date',
        params: { date: startOfToday() },
      });
      return;
    }

    await navigate({
      to: '/login',
      search: {
        redirect: timesheetPath,
        reason: undefined,
      },
    });
  };

  return (
    <div className="min-h-screen text-[var(--app-fg)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--accent)_10%,transparent),transparent_42%),radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_26%),radial-gradient(circle_at_bottom_left,color-mix(in_oklab,var(--success-text)_12%,transparent),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col justify-center px-4 py-6 sm:px-5 sm:py-8 xl:px-8 2xl:px-10">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px] xl:items-start xl:gap-6">
          <section className="app-surface-strong p-5 sm:p-7 xl:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-sky-200">
                <Sparkles className="h-3.5 w-3.5" />
                Демо-центр
              </span>
              {appConfig.features.demoBranding && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-soft)]">
                  Презентационный контур
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Демо-сценарий
                </p>
                <h1 className="max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl xl:text-[2.2rem] xl:leading-[1.05]">
                  Подготовить демонстрацию и быстро перейти в рабочий flow
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                  Этот экран собирает все презентационные действия в одном месте, чтобы рабочие
                  страницы табелей оставались чистыми и прикладными.
                </p>
              </div>
              <div className="border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Быстрый статус
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Режим
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {appConfig.isDemoMode ? 'demo' : 'prod'}
                    </p>
                  </div>
                  <div className="border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Сессия
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {auth.isAuthenticated ? 'Активна' : 'Не начата'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4 xl:p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Учетные данные
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Для быстрого старта используйте
                  <span className="ml-2 inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-200">
                    {appConfig.defaults.username} / {appConfig.defaults.password}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  Demo auth по-прежнему принимает любую непустую пару логин/пароль, но эти
                  значения дают самый предсказуемый сценарий.
                </p>
              </div>
              <div className="border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4 xl:p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Поведение маршрута
                </p>
                <p className="mt-3 text-sm text-[var(--app-fg)]">
                  {auth.isAuthenticated
                    ? 'Сессия уже активна, можно сразу открывать журнал или день.'
                    : 'Сессии нет, поэтому рабочие экраны откроются через обычный login.'}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  В `prod`-режиме этот маршрут можно отключить через `VITE_APP_MODE=prod`.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Button
                onClick={() => void handleSeedDemoData()}
                disabled={!appConfig.features.demoDataTools || seedDemoData.isPending}
                variant="secondary"
                className="h-11 justify-start border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)] hover:bg-emerald-400/20 disabled:opacity-60"
              >
                <DatabaseZap className="h-4 w-4" />
                Заполнить базу
              </Button>
              <Button
                onClick={() => void handleOpenJournal()}
                className="h-11 justify-start bg-white text-slate-950 hover:bg-slate-100"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Открыть журнал
              </Button>
              <Button
                onClick={() => void handleOpenToday()}
                variant="secondary"
                className="h-11 justify-start"
              >
                <FolderClock className="h-4 w-4" />
                Открыть сегодня
              </Button>
              <Button
                onClick={() => void handleResetDemoData()}
                disabled={!appConfig.features.demoDataTools || resetDemoData.isPending}
                variant="secondary"
                className="h-11 justify-start border-rose-300/20 bg-rose-400/10 text-[var(--danger-text)] hover:bg-rose-400/20 disabled:opacity-60"
              >
                <RefreshCcw className="h-4 w-4" />
                Сбросить базу
              </Button>
            </div>
          </section>

          <section className="app-surface p-5 sm:p-6 xl:sticky xl:top-24 xl:p-6">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Как показывать
              </p>
              <h2 className="text-lg font-semibold">Рекомендуемый сценарий показа</h2>
              <div className="grid gap-3">
                <div className="border border-sky-300/15 bg-sky-400/10 p-4">
                  <p className="text-sm font-medium">1. Подготовить демо-данные</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    Заполните локальную базу, чтобы журнал и редактор сразу выглядели правдоподобно.
                  </p>
                </div>
                <div className="border border-emerald-300/15 bg-emerald-400/10 p-4">
                  <p className="text-sm font-medium">2. Войти и открыть журнал</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    После логина основной user path уже идет через обычные рабочие страницы без
                    лишнего onboarding внутри них.
                  </p>
                </div>
                <div className="border border-amber-300/15 bg-amber-400/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <WifiOff className="h-4 w-4" />
                    3. При необходимости показать offline flow
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    Отключите сеть в DevTools или на устройстве, сохраните табель и затем вернитесь
                    онлайн, чтобы показать очередь синхронизации.
                  </p>
                </div>
              </div>

              <div className="border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  Рабочий вход остается доступен по маршруту{' '}
                  <Link
                    to="/login"
                    search={{ redirect: undefined, reason: undefined }}
                    className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                  >
                    /login
                  </Link>
                  . Демо-центр нужен только для подготовки показа и управления локальной
                  демонстрационной базой.
                </p>
              </div>

              <Button
                onClick={() => void handleOpenJournal()}
                variant="secondary"
                className="h-11 w-full"
              >
                Перейти в рабочий контур
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
