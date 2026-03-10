import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowRight,
  DatabaseZap,
  Globe2,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../features/auth/auth';
import { useSeedDemoData } from '../hooks/useSeedDemoData';
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
  const seedDemoData = useSeedDemoData();
  const [username, setUsername] = useState('demo.user');
  const [password, setPassword] = useState('demo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reasonContent = reason ? loginReasonContent[reason] : null;

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
        description: 'Демо-сессия активна. Можно работать с защищенными страницами.',
      });
      await navigateAfterLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить вход';
      toast.error('Ошибка входа', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDemoData = async () => {
    toast.loading('Подготавливаем демо-данные...', { id: 'seed-demo' });

    try {
      const result = await seedDemoData.mutateAsync();
      toast.success('Демо-база готова', {
        id: 'seed-demo',
        description: `Добавлено ${result.timesheetsCount} табелей и ${result.tasksCount} задач.`,
      });
    } catch {
      toast.error('Не удалось подготовить демо-данные', {
        id: 'seed-demo',
      });
    }
  };

  return (
    <div className="min-h-screen text-[var(--app-fg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_28%),radial-gradient(circle_at_bottom_right,var(--success-soft),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-8 sm:py-12 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6">
          <section className="app-surface rounded-[1.75rem] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Protected workspace
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--success-text)]">
                <Globe2 className="h-3.5 w-3.5" />
                Public demo
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Вход в офлайн-first рабочее место табелей.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--text-soft)]">
                Здесь сразу закладываем ту же схему, которая позже пойдет в 1С: экран логина,
                защищенные маршруты, локальная сессия для демо и готовность к токенам.
              </p>
            </div>
            <div className="mt-6 rounded-[1.25rem] border border-sky-300/15 bg-sky-400/10 p-4 text-sm leading-6 text-[var(--text-soft)]">
              Это публичная демо-страница для показа UX и offline-first сценариев.
              Не вводите реальные пароли, персональные данные или чувствительную служебную
              информацию.
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="app-surface-strong rounded-[1.25rem] p-5">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="mt-4 text-lg font-semibold">Демо без боли</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  Можно наполнить локальную базу реалистичными табелями и сразу показать flow
                  списка, редактора, offline и sync-очереди.
                </p>
              </div>
              <div className="app-surface-strong rounded-[1.25rem] p-5">
                <DatabaseZap className="h-5 w-5 text-[var(--success-text)]" />
                <h2 className="mt-4 text-lg font-semibold">Готово к backend</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  Data layer уже идет через repository и sync transport, а auth session теперь
                  хранит access/refresh token contract, поэтому реальный 1С backend можно будет
                  подключать без переверстки приложения.
                </p>
              </div>
            </div>
          </section>

          <section className="app-surface-strong rounded-[1.75rem] p-6 sm:p-8">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">Авторизация</p>
              <h2 className="text-2xl font-semibold">Войти в приложение</h2>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Пока это локальная demo-сессия, но интерфейс и маршруты уже построены под будущий
                password + token flow.
              </p>
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-[var(--panel-border)] bg-[var(--panel-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Demo access</p>
              <p className="mt-2 text-sm text-[var(--app-fg)]">
                Для входа можно использовать значения по умолчанию:
                <span className="ml-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-bg-strong)] px-2 py-1 text-xs text-[var(--accent)]">
                  demo.user / demo
                </span>
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Demo auth transport принимает любую непустую пару логин/пароль, но для
                предсказуемого сценария лучше оставлять стандартные значения.
              </p>
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

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--app-fg)]">Логин</span>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-12 rounded-2xl bg-[var(--panel-muted)]"
                  placeholder="demo.user"
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

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 rounded-2xl bg-white text-slate-950 hover:bg-slate-100"
                >
                  <ArrowRight className="h-4 w-4" />
                  Войти
                </Button>
                <Button
                  onClick={() => void handleSeedDemoData()}
                  disabled={seedDemoData.isPending}
                  variant="secondary"
                  className="h-11 rounded-2xl"
                >
                  <DatabaseZap className="h-4 w-4" />
                  Заполнить демо-данными
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
