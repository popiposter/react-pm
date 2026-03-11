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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_28%),radial-gradient(circle_at_bottom_right,var(--success-soft),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-6 sm:py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-start lg:gap-6">
          <section className="app-surface-strong rounded-[1.75rem] p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" />
                Демо-центр
              </span>
              {appConfig.features.demoBranding && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--success-text)]">
                  Показ продукта
                </span>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Демо-сценарий
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Подготовить демонстрацию и быстро перейти в рабочий flow
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                Этот экран собирает все презентационные действия в одном месте, чтобы рабочие
                страницы табелей оставались чистыми и прикладными.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.1rem] border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Быстрый доступ
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  Логин по умолчанию:
                  <span className="ml-2 inline-flex rounded-full border border-[var(--panel-border)] bg-[var(--panel-bg-strong)] px-2.5 py-1 text-xs text-[var(--accent)]">
                    {appConfig.defaults.username} / {appConfig.defaults.password}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  Demo auth по-прежнему принимает любую непустую пару логин/пароль, но эти
                  значения дают самый предсказуемый сценарий.
                </p>
              </div>
              <div className="rounded-[1.1rem] border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Состояние
                </p>
                <p className="mt-2 text-sm text-[var(--app-fg)]">
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
                className="h-11 justify-start rounded-2xl border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)] hover:bg-emerald-400/20 disabled:opacity-60"
              >
                <DatabaseZap className="h-4 w-4" />
                Заполнить базу
              </Button>
              <Button
                onClick={() => void handleOpenJournal()}
                className="h-11 justify-start rounded-2xl bg-white text-slate-950 hover:bg-slate-100"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Открыть журнал
              </Button>
              <Button
                onClick={() => void handleOpenToday()}
                variant="secondary"
                className="h-11 justify-start rounded-2xl"
              >
                <FolderClock className="h-4 w-4" />
                Открыть сегодня
              </Button>
              <Button
                onClick={() => void handleResetDemoData()}
                disabled={!appConfig.features.demoDataTools || resetDemoData.isPending}
                variant="secondary"
                className="h-11 justify-start rounded-2xl border-rose-300/20 bg-rose-400/10 text-[var(--danger-text)] hover:bg-rose-400/20 disabled:opacity-60"
              >
                <RefreshCcw className="h-4 w-4" />
                Сбросить базу
              </Button>
            </div>
          </section>

          <section className="app-surface rounded-[1.75rem] p-5 sm:p-7">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Рекомендуемый сценарий показа</h2>
              <div className="grid gap-3">
                <div className="rounded-[1.1rem] border border-sky-300/15 bg-sky-400/10 p-4">
                  <p className="text-sm font-medium">1. Подготовить демо-данные</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    Заполните локальную базу, чтобы журнал и редактор сразу выглядели правдоподобно.
                  </p>
                </div>
                <div className="rounded-[1.1rem] border border-emerald-300/15 bg-emerald-400/10 p-4">
                  <p className="text-sm font-medium">2. Войти и открыть журнал</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    После логина основной user path уже идет через обычные рабочие страницы без
                    лишнего onboarding внутри них.
                  </p>
                </div>
                <div className="rounded-[1.1rem] border border-amber-300/15 bg-amber-400/10 p-4">
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

              <div className="rounded-[1.1rem] border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
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
                className="h-11 w-full rounded-2xl"
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
