import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '../test/test-utils';
import { LoginPage } from '../pages/LoginPage';

vi.mock('../features/auth/auth', () => ({
  useAuth: () => ({
    session: null,
    isAuthenticated: false,
    isRefreshing: false,
    logoutReason: null,
    login: vi.fn().mockResolvedValue(null),
    refreshSession: vi.fn().mockResolvedValue(null),
    logout: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
    useRouter: () => ({
      history: {
        push: vi.fn(),
      },
      navigate: vi.fn(),
    }),
  };
});

describe('LoginPage', () => {
  it('shows session expired banner when reason is expired', () => {
    render(<LoginPage reason="expired" />);

    expect(screen.getByText('Сессия истекла')).toBeInTheDocument();
    expect(
      screen.getByText('Срок действия access token закончился. Войдите снова, чтобы продолжить работу.')
    ).toBeInTheDocument();
  });

  it('shows refresh failed banner when reason is refresh-failed', () => {
    render(<LoginPage reason="refresh-failed" />);

    expect(screen.getByText('Не удалось обновить сессию')).toBeInTheDocument();
  });

  it('shows public demo warning and default credentials', () => {
    render(<LoginPage />);

    expect(screen.getByText('Рабочее место')).toBeInTheDocument();
    expect(screen.getByText(/Для быстрого старта сейчас подставлены/)).toBeInTheDocument();
    expect(screen.getByText(/demo\.user \/ demo/)).toBeInTheDocument();
  });
});
