/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'timesheets:theme-mode';

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'auto') {
    return storedMode;
  }

  return 'auto';
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const resolvedTheme = themeMode === 'auto' ? systemTheme : themeMode;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themeMode = themeMode;
  }, [resolvedTheme, themeMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
    }),
    [resolvedTheme, themeMode]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};
