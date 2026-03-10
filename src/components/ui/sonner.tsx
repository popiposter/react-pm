import { Toaster } from 'sonner';
import { useTheme } from '../../features/theme/theme';

export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme}
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            '!border-[var(--panel-border)] !bg-[var(--panel-bg-strong)] !text-[var(--app-fg)] !shadow-[0_20px_60px_-30px_var(--shadow-color)]',
          title: '!text-[var(--app-fg)]',
          description: '!text-[var(--text-soft)]',
          actionButton: '!bg-[var(--accent)] !text-white',
          cancelButton: '!bg-[var(--panel-muted)] !text-[var(--app-fg)]',
        },
      }}
    />
  );
}
