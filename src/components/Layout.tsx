import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  Download,
  FileSpreadsheet,
  House,
  LogOut,
  MonitorCog,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  SunMedium,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '../assets/brand-logo.svg?react';
import { useAuth } from '../features/auth/auth';
import { usePwaInstallPrompt } from '../features/pwa/usePwaInstallPrompt';
import { useTheme, type ThemeMode } from '../features/theme/theme';
import { useRunSync } from '../hooks/useRunSync';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { cn } from '../lib/utils';
import { getDefaultTimesheetsSearch } from '../routes/_authenticated/timesheets';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  href: '/' | '/timesheets';
  label: string;
  icon: typeof FileSpreadsheet;
  description?: string;
  tone?: 'primary';
}

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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileChromeHidden, setIsMobileChromeHidden] = useState(false);
  const { data: syncStatus } = useSyncStatus();
  const runSyncMutation = useRunSync();
  const { canInstall, promptInstall } = usePwaInstallPrompt();
  const isEditorRoute = location.pathname.startsWith('/timesheet/');
  const defaultTimesheetsSearch = React.useMemo(() => getDefaultTimesheetsSearch(), []);
  const navigation: NavigationItem[] = React.useMemo(() => {
    return [
      {
        href: '/',
        label: 'Главная',
        icon: House,
        description: 'Домашний экран',
        tone: 'primary',
      },
      {
        href: '/timesheets',
        label: 'Табели',
        icon: FileSpreadsheet,
        description: 'Рабочие документы',
        tone: 'primary',
      },
    ];
  }, []);

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

  return (
    <div className="min-h-screen text-[var(--app-fg)]">
      <div className="pointer-events-none absolute inset-0" />

      <div className="relative flex min-h-screen w-full">
        <aside
          className={cn(
            'app-surface-strong hidden shrink-0 border-r border-[var(--panel-border)] xl:flex xl:flex-col',
            'transition-[width] duration-300 ease-out',
            isSidebarCollapsed ? 'w-[4.75rem]' : 'w-[15.5rem]'
          )}
        >
          <div className="flex h-full flex-col">
            <div
              className={cn(
                'relative flex h-16 items-center px-3',
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              )}
            >
              {isSidebarCollapsed ? (
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  title="Развернуть навигацию"
                  className="group/brand relative inline-flex h-10 w-10 items-center justify-center border border-transparent text-[var(--text-soft)] transition hover:border-[var(--panel-border)] hover:bg-[var(--panel-hover)]"
                >
                  <BrandLogo
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 text-[var(--brand-mark-color)] transition-opacity duration-200 group-hover/brand:opacity-0"
                  />
                  <PanelLeftOpen className="absolute h-4 w-4 opacity-0 transition-opacity duration-200 group-hover/brand:opacity-100" />
                </button>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center">
                    <BrandLogo
                      aria-hidden="true"
                      className="h-6 w-6 shrink-0 text-[var(--brand-mark-color)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(true)}
                    title="Свернуть навигацию"
                    className="inline-flex h-9 w-9 items-center justify-center border border-transparent text-[var(--text-muted)] transition hover:border-[var(--panel-border)] hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            <nav
              className={cn(
                'flex flex-1 flex-col gap-1.5 px-2 py-3',
                isSidebarCollapsed && 'items-center'
              )}
            >
              {navigation.map((item) => {
                const isActive =
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.href || location.pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    search={item.href === '/timesheets' ? defaultTimesheetsSearch : undefined}
                    title={item.label}
                    className={cn(
                      'group relative flex items-center rounded-[var(--control-radius)] border border-transparent text-[var(--text-soft)] transition',
                      isSidebarCollapsed ? 'h-11 w-11 justify-center px-0' : 'h-12 gap-3 px-3.5',
                      isActive
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'border-transparent hover:border-[var(--panel-border)] hover:bg-[var(--panel-muted)] hover:text-[var(--app-fg)]'
                    )}
                  >
                    {!isSidebarCollapsed && (
                      <span
                        className={cn(
                          'absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-transparent transition-all duration-200',
                          isActive && 'bg-[var(--accent)]'
                        )}
                      />
                    )}
                    <Icon className="h-5 w-5 shrink-0" />
                    {isSidebarCollapsed && isActive && (
                      <span className="absolute right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                    )}
                    {!isSidebarCollapsed && (
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="block truncate text-sm font-medium">{item.label}</span>
                        </span>
                        {item.description ? (
                          <span className="block truncate text-[11px] text-[var(--text-muted)] transition group-hover:text-[var(--text-soft)]">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-[var(--panel-border)] px-2 py-3">
              {syncStatus && syncStatus.pendingCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void handleRunSync()}
                  title={`Ожидают синхронизации: ${syncStatus.pendingCount}`}
                  className={cn(
                    'inline-flex items-center rounded-[var(--control-radius)] border border-transparent text-[var(--warning-text)] transition hover:border-amber-300/20 hover:bg-amber-400/10',
                    isSidebarCollapsed ? 'h-11 w-11 justify-center' : 'h-11 w-full gap-3 px-3.5'
                  )}
                >
                  <Wifi className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="truncate text-sm font-medium">
                      Синхронизация: {syncStatus.pendingCount}
                    </span>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header
            className={cn(
              'sticky top-0 z-40 border-b border-[var(--panel-border)] bg-[var(--panel-bg-strong)] pt-[var(--safe-area-top)] transition-transform duration-300 ease-out xl:pt-0',
              isMobileChromeHidden && '-translate-y-full xl:translate-y-0'
            )}
          >
            <div className="flex h-16 w-full items-center justify-between px-4 sm:px-5 xl:px-8 2xl:px-10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center xl:hidden">
                  <BrandLogo
                    aria-hidden="true"
                    className="h-[18px] w-[18px] shrink-0 text-[var(--brand-mark-color)]"
                  />
                </div>
                <h2 className="text-sm font-semibold sm:text-base xl:text-[1.35rem]">Проектные табели</h2>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {canInstall && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleInstallApp()}
                      className="hidden h-9 items-center gap-2 rounded-[var(--control-radius)] border border-emerald-300/20 bg-emerald-400/10 px-3 text-sm text-[var(--success-text)] transition hover:bg-emerald-400/20 lg:inline-flex"
                    >
                      <Download className="h-4 w-4" />
                      Установить
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleInstallApp()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--control-radius)] border border-emerald-300/20 bg-emerald-400/10 text-[var(--success-text)] transition hover:bg-emerald-400/20 lg:hidden"
                      aria-label="Установить приложение"
                      title="Установить приложение"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </>
                )}
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--control-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] transition hover:bg-[var(--panel-hover)]"
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((value) => !value)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-cyan-500 text-sm font-semibold text-slate-950"
                    aria-label="Меню пользователя"
                    title={auth.session?.user.displayName || 'Пользователь'}
                  >
                    {userInitials || 'П'}
                  </button>
                  {isAccountMenuOpen && (
                    <div className="app-surface-strong absolute right-0 top-12 z-50 min-w-48 p-1 shadow-[0_18px_48px_-24px_var(--shadow-color)]">
                      <div className="border-b border-[var(--panel-border)] px-3 py-2">
                        <p className="text-sm font-medium">
                          {auth.session?.user.displayName || 'Пользователь'}
                        </p>
                      </div>
                      <div className="py-1">
                        {themeOptions.map((option) => {
                          const Icon = option.icon;
                          const isActive = option.value === themeMode;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setThemeMode(option.value);
                                setIsAccountMenuOpen(false);
                              }}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-[var(--badge-radius)] px-3 py-2 text-sm transition',
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
                      <div className="border-t border-[var(--panel-border)] pt-1">
                        <button
                          type="button"
                          onClick={() => void handleLogout()}
                          className="flex w-full items-center gap-3 rounded-[var(--badge-radius)] px-3 py-2 text-sm text-[var(--text-soft)] transition hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Выйти</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main
            className={cn(
              'flex-1 px-3 py-4 sm:px-4 xl:px-6 xl:py-5 xl:pb-5',
              isEditorRoute
                ? 'pb-[var(--mobile-editor-bar-offset)]'
                : 'pb-[var(--mobile-nav-content-offset)]'
            )}
          >
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      {!isEditorRoute && (
        <nav
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 border-t border-[var(--panel-border)] bg-[var(--panel-bg-strong)]/96 px-2.5 pb-[var(--mobile-nav-bottom-padding)] pt-0.5 backdrop-blur transition-transform duration-300 ease-out xl:hidden',
            isMobileChromeHidden && 'translate-y-full'
          )}
        >
          <div className="mx-auto grid max-w-sm grid-cols-2 items-center gap-0.5">
            <Link
              to="/"
              className={cn(
                'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--control-radius)] px-2 py-1 text-[11px] font-medium transition',
                location.pathname === '/' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              )}
            >
              <span
                className={cn(
                  'absolute bottom-0.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-transparent transition-all duration-200',
                  location.pathname === '/' ? 'w-5 bg-[var(--accent)]' : 'w-0'
                )}
              />
              <House className="h-4.5 w-4.5" />
              <span>Главная</span>
            </Link>
            <Link
              to="/timesheets"
              search={defaultTimesheetsSearch}
              className={cn(
                'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--control-radius)] px-2 py-1 text-[11px] font-medium transition',
                location.pathname.startsWith('/timesheets')
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)]'
              )}
            >
              <span
                className={cn(
                  'absolute bottom-0.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-transparent transition-all duration-200',
                  location.pathname.startsWith('/timesheets') ? 'w-5 bg-[var(--accent)]' : 'w-0'
                )}
              />
              <FileSpreadsheet className="h-4.5 w-4.5" />
              <span>Табели</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
