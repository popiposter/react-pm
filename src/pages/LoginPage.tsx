import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useRouter } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  LockKeyhole,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { appConfig } from '../config/app-config';
import { useAuth } from '../features/auth/auth';
import { getDefaultTimesheetsSearch } from '../routes/_authenticated/timesheets';
import type { LoginRedirectReason } from '../routes/login';

const loginReasonContent: Record<
  LoginRedirectReason,
  {
    title: string;
    description: string;
  }
> = {
  'auth-required': {
    title: 'Нужен вход в систему',
    description: 'Эта часть приложения доступна только после авторизации.',
  },
  expired: {
    title: 'Сессия истекла',
    description: 'Срок действия access token закончился. Войдите снова, чтобы продолжить работу.',
  },
  'refresh-failed': {
    title: 'Не удалось обновить сессию',
    description: 'Автоматическое продление входа не сработало. Повторите вход вручную.',
  },
};

export function LoginPage({
  redirectTo,
  reason,
}: {
  redirectTo?: string;
  reason?: LoginRedirectReason;
}) {
  const router = useRouter();
  const auth = useAuth();
  const [username, setUsername] = useState<string>(appConfig.defaults.username);
  const [password, setPassword] = useState<string>(appConfig.defaults.password);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reasonContent = reason ? loginReasonContent[reason] : null;
  const showDemoRouteLink = appConfig.features.demoRoute;
  const showDemoDefaults = appConfig.isDemoMode;

  const navigateAfterLogin = async () => {
    if (redirectTo?.startsWith('/')) {
      await router.history.push(redirectTo);
      return;
    }

    await router.navigate({ to: '/timesheets', search: getDefaultTimesheetsSearch() });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await auth.login({ username, password });
      toast.success('Вход выполнен', {
        description: 'Сессия активна. Можно переходить к защищенным страницам.',
      });
      await navigateAfterLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить вход';
      toast.error('Ошибка входа', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-[var(--app-fg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_28%),radial-gradient(circle_at_bottom_right,var(--success-soft),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-6 sm:py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] lg:items-start lg:gap-6">
          <section className="app-surface-strong rounded-[1.75rem] p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Рабочее место
              </span>
              {appConfig.features.demoBranding && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--success-text)]">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  Вход в систему
                </span>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Авторизация
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Войти в приложение
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                {showDemoRouteLink
                  ? 'Войдите в рабочее место и сразу переходите к журналу табелей. Если нужно подготовить демонстрацию, отдельный демо-центр доступен вне основного входа.'
                  : 'Войдите в рабочее место и сразу переходите к журналу табелей.'}
              </p>
            </div>

            <div className="mt-5 rounded-[1.1rem] border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Учетные данные
                </p>
                <p className="mt-2 text-sm text-[var(--app-fg)]">
                  {showDemoDefaults ? (
                    <>
                      Для быстрого старта сейчас подставлены
                      <span className="ml-2 inline-flex rounded-full border border-[var(--panel-border)] bg-[var(--panel-bg-strong)] px-2.5 py-1 text-xs text-[var(--accent)]">
                        {appConfig.defaults.username} / {appConfig.defaults.password}
                      </span>
                    </>
                  ) : (
                    'Введите рабочий логин и пароль.'
                  )}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  {showDemoDefaults
                    ? 'До подключения production auth используется локальный demo transport, поэтому подойдет любая непустая пара логин/пароль.'
                    : 'Интерфейс уже приведен к production-потоку: демонстрационные подсказки и маршрут демо скрыты.'}
                </p>
              </div>
            </div>

            {reasonContent && (
              <div className="mt-6 rounded-[1.25rem] border border-amber-300/20 bg-amber-400/10 p-4 text-[var(--warning-text)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-[var(--panel-bg-strong)] p-2 text-[var(--warning-text)]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{reasonContent.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--warning-text)]/80">
                      {reasonContent.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--app-fg)]">Логин</span>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-12 rounded-2xl bg-[var(--panel-muted)]"
                  placeholder={showDemoDefaults ? 'demo.user' : 'Введите логин'}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--app-fg)]">Пароль</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-2xl bg-[var(--panel-muted)]"
                  placeholder="Введите пароль"
                />
              </label>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 sm:min-w-40"
                >
                  <ArrowRight className="h-4 w-4" />
                  Войти
                </Button>
                <p className="self-center text-sm leading-6 text-[var(--text-muted)]">
                  После входа откроется журнал табелей.
                </p>
              </div>
            </form>
          </section>

          <section className="app-surface rounded-[1.75rem] p-5 sm:p-7">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Что доступно после входа</h2>
              <div className="grid gap-3">
                <div className="rounded-[1.1rem] border border-sky-300/15 bg-sky-400/10 p-4">
                  <p className="text-sm font-medium">Журнал табелей и редактор дня</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    После входа можно открыть день, внести часы и пройти основной рабочий путь без
                    лишней навигации.
                  </p>
                </div>
                <div className="rounded-[1.1rem] border border-emerald-300/15 bg-emerald-400/10 p-4">
                  <p className="text-sm font-medium">Основа офлайн-режима</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    Локальные данные, очередь синхронизации и foundation под интеграцию с 1С уже
                    заложены в архитектуре.
                  </p>
                </div>
                {showDemoRouteLink && (
                  <div className="rounded-[1.1rem] border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4 text-sm leading-6 text-[var(--text-muted)]">
                    Нужен презентационный сценарий, seed/reset демо-базы или подсказки по offline
                    flow?
                    <Link
                      to="/demo"
                      className="ml-2 font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                    >
                      Открыть демо-центр
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
