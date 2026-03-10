import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { AlertTriangle, ArrowRight, DatabaseZap, LockKeyhole, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_30px_120px_-48px_rgba(15,23,42,0.95)] backdrop-blur">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-sky-200">
              <LockKeyhole className="h-3.5 w-3.5" />
              Protected workspace
            </span>
            <div className="mt-6 space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white">
                Вход в офлайн-first рабочее место табелей.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Здесь сразу закладываем ту же схему, которая позже пойдет в 1С: экран логина,
                защищенные маршруты, локальная сессия для демо и готовность к токенам.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
                <Sparkles className="h-5 w-5 text-sky-300" />
                <h2 className="mt-4 text-lg font-semibold text-white">Демо без боли</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Можно наполнить локальную базу реалистичными табелями и сразу показать flow
                  списка, редактора, offline и sync-очереди.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
                <DatabaseZap className="h-5 w-5 text-emerald-300" />
                <h2 className="mt-4 text-lg font-semibold text-white">Готово к backend</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Data layer уже идет через repository и sync transport, а auth session теперь
                  хранит access/refresh token contract, поэтому реальный 1С backend можно будет
                  подключать без переверстки приложения.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_30px_120px_-48px_rgba(15,23,42,0.95)] backdrop-blur">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Авторизация</p>
              <h2 className="text-2xl font-semibold text-white">Войти в приложение</h2>
              <p className="text-sm leading-6 text-slate-400">
                Пока это локальная demo-сессия, но интерфейс и маршруты уже построены под будущий
                password + token flow.
              </p>
            </div>

            {reasonContent && (
              <div className="mt-6 rounded-[1.5rem] border border-amber-300/20 bg-amber-400/10 p-4 text-amber-50">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-950/30 p-2 text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{reasonContent.title}</p>
                    <p className="mt-1 text-sm leading-6 text-amber-100/80">
                      {reasonContent.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Логин</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="demo.user"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="Введите пароль"
                />
              </label>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ArrowRight className="h-4 w-4" />
                  Войти
                </button>
                <button
                  type="button"
                  onClick={() => void handleSeedDemoData()}
                  disabled={seedDemoData.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <DatabaseZap className="h-4 w-4" />
                  Заполнить демо-данными
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
