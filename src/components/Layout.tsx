import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock3, FileSpreadsheet, Menu, Wifi, WifiOff, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useRunSync } from '../hooks/useRunSync';
import { useSyncStatus } from '../hooks/useSyncStatus';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    href: '/timesheets',
    label: 'Табели',
    description: 'Список и быстрый доступ',
    icon: FileSpreadsheet,
  },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: syncStatus } = useSyncStatus();
  const runSyncMutation = useRunSync();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleRunSync = async () => {
    toast.loading('Синхронизация...', {
      id: 'sync-runner',
      description: 'Пробуем отправить локальные изменения',
    });

    try {
      const result = await runSyncMutation.mutateAsync();
      toast.success('Синхронизация завершена', {
        id: 'sync-runner',
        description:
          result.failedCount > 0
            ? `Синхронизировано: ${result.syncedCount}, осталось: ${result.failedCount}`
            : result.pendingCount > 0
              ? `Осталось в очереди: ${result.pendingCount}`
              : `Синхронизировано: ${result.syncedCount}, очередь пуста`,
        duration: 3000,
      });
    } catch {
      toast.error('Не удалось синхронизировать изменения', {
        id: 'sync-runner',
        description: 'Попробуйте снова, когда сеть и backend будут доступны.',
        duration: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-80 shrink-0 flex-col border-r border-white/10 bg-slate-950/80 px-6 py-8 backdrop-blur xl:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300 ring-1 ring-inset ring-sky-300/20">
              <Clock3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Timesheets</p>
              <h1 className="text-xl font-semibold text-white">Проектные табели</h1>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">
              Быстрый рабочий интерфейс для ежедневного учета времени, оптимизированный под
              редактирование табелей без календарного режима.
            </p>
          </div>

          <nav className="mt-8 space-y-3">
            {navigation.map((item) => {
              const isActive =
                (item.href === '/timesheets' && location.pathname === '/') ||
                location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border px-4 py-3 transition',
                    isActive
                      ? 'border-sky-300/30 bg-sky-400/15 text-white shadow-[0_18px_50px_-32px_rgba(56,189,248,0.75)]'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                  )}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset',
                  isOnline
                    ? 'bg-emerald-400/15 text-emerald-300 ring-emerald-300/30'
                    : 'bg-amber-400/15 text-amber-200 ring-amber-200/30'
                )}
              >
                {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {isOnline ? 'Онлайн-режим' : 'Офлайн-режим'}
                </p>
                <p className="text-sm text-slate-400">
                  {isOnline ? 'Синхронизация доступна' : 'Данные сохраняются локально'}
                </p>
                {syncStatus && syncStatus.pendingCount > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-sm text-amber-200">
                      Ожидают синхронизации: {syncStatus.pendingCount}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleRunSync()}
                      className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100 transition hover:bg-amber-400/20"
                    >
                      Синкнуть
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 xl:px-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((value) => !value)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 xl:hidden"
                  aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Offline-first workspace
                  </p>
                  <h2 className="text-lg font-semibold text-white">Учет рабочего времени</h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:flex sm:items-center sm:gap-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-amber-200" />
                  )}
                  <span>{isOnline ? 'Сервер доступен' : 'Работаем локально'}</span>
                </div>
                {syncStatus && syncStatus.pendingCount > 0 && (
                  <div className="hidden rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-100 lg:flex lg:items-center lg:gap-2">
                    <span>Pending sync: {syncStatus.pendingCount}</span>
                    <button
                      type="button"
                      onClick={() => void handleRunSync()}
                      className="rounded-full border border-amber-300/20 bg-slate-950/30 px-3 py-1 text-xs font-medium text-amber-100 transition hover:bg-slate-950/50"
                    >
                      Run sync
                    </button>
                  </div>
                )}
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-cyan-500 text-sm font-semibold text-slate-950">
                  П
                </div>
              </div>
            </div>

            {isMobileMenuOpen && (
              <nav className="border-t border-white/10 px-4 py-4 sm:px-6 xl:hidden">
                <div className="space-y-3">
                  {navigation.map((item) => {
                    const isActive =
                      (item.href === '/timesheets' && location.pathname === '/') ||
                      location.pathname === item.href ||
                      (item.href !== '/' && location.pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'flex items-start gap-3 rounded-2xl border px-4 py-3 transition',
                          isActive
                            ? 'border-sky-300/30 bg-sky-400/15 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                        )}
                      >
                        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            )}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 xl:px-10 xl:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
