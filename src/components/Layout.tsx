import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  Download,
  FileSpreadsheet,
  FolderClock,
  LogOut,
  MonitorCog,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  SunMedium,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useRunSync } from '../hooks/useRunSync';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useAuth } from '../features/auth/auth';
import { usePwaInstallPrompt } from '../features/pwa/usePwaInstallPrompt';
import { useTheme, type ThemeMode } from '../features/theme/theme';
import brandLogo from '../assets/brand-logo.svg';

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

const quickActions = [
  {
    label: 'Табель на сегодня',
    description: 'Открыть текущий рабочий день',
    icon: FolderClock,
  },
];

const startOfToday = () => new Date().toISOString().split('T')[0];

export default function Layout({ children }: LayoutProps) {
  const auth = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('timesheets:sidebar-collapsed') === 'true';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobileChromeHidden, setIsMobileChromeHidden] = useState(false);
  const { data: syncStatus } = useSyncStatus();
  const runSyncMutation = useRunSync();
  const { canInstall, promptInstall } = usePwaInstallPrompt();
  const isEditorRoute = location.pathname.startsWith('/timesheet/');

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
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('timesheets:sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateChrome = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 24 || delta < -8) {
        setIsMobileChromeHidden(false);
      } else if (delta > 10) {
        setIsMobileChromeHidden(true);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (window.innerWidth >= 1280) {
        if (isMobileChromeHidden) {
          setIsMobileChromeHidden(false);
        }
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(updateChrome);
        ticking = true;
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsMobileChromeHidden(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileChromeHidden]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    document.documentElement.dataset.mobileChrome = isMobileChromeHidden ? 'hidden' : 'visible';
    window.dispatchEvent(
      new CustomEvent('mobile-chrome-change', {
        detail: { hidden: isMobileChromeHidden },
      })
    );
  }, [isMobileChromeHidden]);

  const userInitials = auth.session?.user.displayName
    ? auth.session.user.displayName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : undefined;

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

  const handleLogout = async () => {
    auth.logout();
    await navigate({ to: '/login', search: { redirect: undefined, reason: undefined } });
  };

  const handleInstallApp = async () => {
    const result = await promptInstall();

    if (!result) {
      toast('Установка недоступна', {
        description: 'Этот браузер сейчас не отдал системный prompt для установки.',
      });
      return;
    }

    if (result.outcome === 'accepted') {
      toast.success('Приложение устанавливается', {
        description: 'После установки его можно запускать как отдельное приложение.',
      });
      return;
    }

    toast('Установка отменена', {
      description: 'Можно установить приложение позже из меню браузера.',
    });
  };

  const themeOptions: Array<{
    value: ThemeMode;
    label: string;
    icon: typeof SunMedium;
  }> = [
    { value: 'light', label: 'Светлая', icon: SunMedium },
    { value: 'dark', label: 'Темная', icon: MoonStar },
    { value: 'auto', label: 'Авто', icon: MonitorCog },
  ];

  const currentThemeOption =
    themeOptions.find((option) => option.value === themeMode) ?? themeOptions[2];
  const CurrentThemeIcon = currentThemeOption.icon;

  const handleOpenToday = async () => {
    await navigate({
      to: '/timesheet/$date',
      params: { date: startOfToday() },
    });
  };

  return (
    <div className="min-h-screen text-[var(--app-fg)]">
      <div className="pointer-events-none absolute inset-0" />

      <div className="relative flex min-h-screen w-full">
        <aside
          className={cn(
            'hidden shrink-0 px-4 py-5 transition-[width,padding] duration-200 xl:flex',
            isSidebarCollapsed ? 'w-24' : 'w-[20.5rem] 2xl:w-[22.5rem]'
          )}
        >
          <div
            className={cn(
              'flex h-full w-full gap-4',
              isSidebarCollapsed ? 'justify-center' : 'items-stretch'
            )}
          >
            <div className="app-surface-strong flex w-14 shrink-0 flex-col items-center rounded-[1.6rem] px-2 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.45)]">
                <img src={brandLogo} alt="Логотип Проектные табели" className="h-6 w-6 object-contain" />
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((value) => !value)}
                title={isSidebarCollapsed ? 'Развернуть навигацию' : 'Свернуть навигацию'}
                className="mt-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--panel-border)] bg-[var(--panel-muted)] text-[var(--text-soft)] transition hover:bg-[var(--panel-hover)]"
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>

              <nav className="mt-4 flex w-full flex-1 flex-col items-center gap-2">
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
                      title={item.label}
                      className={cn(
                        'inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition',
                        isActive
                          ? 'border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_14px_32px_-22px_var(--shadow-color)]'
                          : 'border-transparent text-[var(--text-muted)] hover:border-[var(--panel-border)] hover:bg-[var(--panel-muted)] hover:text-[var(--app-fg)]'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  );
                })}
              </nav>

              {syncStatus && syncStatus.pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleRunSync()}
                  title={`Ожидают синхронизации: ${syncStatus.pendingCount}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-[var(--warning-text)] transition hover:bg-amber-400/20"
                >
                  <Wifi className="h-4 w-4" />
                </button>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="app-surface-strong flex min-w-0 flex-1 flex-col rounded-[1.9rem] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    Рабочее место
                  </p>
                  <h1 className="mt-2 text-[1.85rem] font-semibold leading-9 tracking-tight">
                    Проектные табели
                  </h1>
                </div>

                <div className="mt-6">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    Навигация
                  </p>
                  <nav className="mt-3 space-y-2">
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
                              ? 'border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--app-fg)]'
                              : 'border-[var(--panel-border)] bg-[var(--panel-muted)] text-[var(--text-soft)] hover:bg-[var(--panel-hover)]'
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                              isActive ? 'bg-white/10 text-[var(--accent)]' : 'bg-black/10 text-[var(--text-muted)]'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{item.label}</p>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="mt-6">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    Быстрые действия
                  </p>
                  <div className="mt-3 space-y-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => void handleOpenToday()}
                          className="flex w-full items-start gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)] px-4 py-3 text-left text-[var(--text-soft)] transition hover:bg-[var(--panel-hover)]"
                        >
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{action.label}</p>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">{action.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  {syncStatus && syncStatus.pendingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleRunSync()}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm font-medium text-[var(--warning-text)] transition hover:bg-amber-400/20"
                    >
                      Ожидают синхронизации: {syncStatus.pendingCount}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header
            className={cn(
              'app-surface-strong sticky top-0 z-40 border-b transition-transform duration-300 ease-out',
              isMobileChromeHidden && '-translate-y-full xl:translate-y-0'
            )}
          >
            <div className="mx-auto flex w-full max-w-[1560px] items-center justify-between px-4 py-2.5 sm:px-5 xl:px-8 xl:py-3 2xl:max-w-[1720px] 2xl:px-10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-white/90 xl:hidden">
                  <img src={brandLogo} alt="Логотип Проектные табели" className="h-4.5 w-4.5 object-contain" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold sm:text-base xl:text-lg">Учет рабочего времени</h2>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {canInstall && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleInstallApp()}
                      className="hidden h-9 items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 text-sm text-[var(--success-text)] transition hover:bg-emerald-400/20 lg:inline-flex"
                    >
                      <Download className="h-4 w-4" />
                      Установить
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleInstallApp()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)] transition hover:bg-emerald-400/20 lg:hidden"
                      aria-label="Установить приложение"
                      title="Установить приложение"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsThemeMenuOpen((value) => !value)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)] px-3 text-sm transition hover:bg-[var(--panel-hover)]"
                    aria-label="Переключить тему"
                  >
                    <CurrentThemeIcon className="h-4 w-4" />
                  </button>
                  {isThemeMenuOpen && (
                    <div className="app-surface-strong absolute right-0 top-12 z-50 min-w-44 rounded-2xl p-1 shadow-[0_18px_48px_-24px_var(--shadow-color)]">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = option.value === themeMode;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setThemeMode(option.value);
                              setIsThemeMenuOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                              isActive
                                ? 'bg-[var(--accent-soft)] text-[var(--app-fg)]'
                                : 'text-[var(--text-soft)] hover:bg-[var(--panel-hover)]'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void (syncStatus?.pendingCount ? handleRunSync() : undefined)}
                  title={
                    syncStatus?.pendingCount
                      ? `Ожидают синхронизации: ${syncStatus.pendingCount}`
                      : isOnline
                        ? 'Сервер доступен'
                        : 'Оффлайн-режим'
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)] transition hover:bg-[var(--panel-hover)]"
                >
                  {isOnline ? (
                    <Wifi
                      className={cn(
                        'h-4 w-4',
                        syncStatus?.pendingCount
                          ? 'text-[var(--warning-text)]'
                          : 'text-[var(--success-text)]'
                      )}
                    />
                  ) : (
                    <WifiOff className="h-4 w-4 text-[var(--warning-text)]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-muted)] transition hover:bg-[var(--panel-hover)]"
                  aria-label="Выйти"
                  title={`Выйти (${auth.session?.user.displayName || 'Пользователь'})`}
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-cyan-500 text-sm font-semibold text-slate-950">
                  {userInitials || 'П'}
                </div>
              </div>
            </div>

          </header>

          <main
            className={cn(
              'flex-1 px-4 py-5 sm:px-5 xl:px-8 xl:py-6 xl:pb-6',
              isEditorRoute
                ? 'pb-[var(--mobile-editor-bar-offset)]'
                : 'pb-[var(--mobile-nav-content-offset)]'
            )}
          >
            <div
              className={cn(
                'mx-auto w-full',
                isEditorRoute ? 'max-w-[1540px] 2xl:max-w-[1680px]' : 'max-w-[1480px] 2xl:max-w-[1640px]'
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      {!isEditorRoute && (
        <nav
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 border-t border-[var(--panel-border)] bg-[var(--panel-bg-strong)]/95 px-4 pb-[var(--mobile-nav-bottom-padding)] pt-2.5 backdrop-blur transition-transform duration-300 ease-out xl:hidden',
            isMobileChromeHidden && 'translate-y-full'
          )}
        >
          <div className="mx-auto flex max-w-md items-center justify-between gap-2.5">
          <Link
            to="/timesheets"
            search={{
              period: new Date().toISOString().slice(0, 7),
              status: 'all',
              q: '',
            }}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[11px] font-medium transition',
              location.pathname.startsWith('/timesheets')
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            )}
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            <span>Табели</span>
          </Link>
          <button
            type="button"
            onClick={() =>
              void navigate({
                to: '/timesheet/$date',
                params: { date: startOfToday() },
              })
            }
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[11px] font-medium transition',
              location.pathname.startsWith('/timesheet/')
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            )}
          >
            <FolderClock className="h-4.5 w-4.5" />
            <span>Сегодня</span>
          </button>
        </div>
        </nav>
      )}
    </div>
  );
}
