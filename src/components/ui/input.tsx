import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-9 w-full border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 text-sm text-[var(--app-fg)] shadow-none outline-none transition placeholder:text-[var(--text-muted)] focus:border-sky-300/40 focus:ring-2 focus:ring-sky-400/15 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
}
