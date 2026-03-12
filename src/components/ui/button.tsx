import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'rounded-[var(--control-radius)] bg-[var(--cta)] text-[var(--cta-text)] shadow-[0_4px_14px_-6px_rgba(223,90,35,0.4)] hover:bg-[var(--cta-strong)]',
        primary:
          'rounded-[var(--control-radius)] bg-[var(--accent)] text-white shadow-[0_4px_14px_-6px_var(--accent-soft)] hover:bg-[var(--accent-strong)]',
        secondary:
          'rounded-[var(--control-radius)] border border-[var(--panel-border)] bg-[var(--panel-muted)] text-[var(--app-fg)] hover:bg-[var(--panel-hover)]',
        ghost:
          'rounded-[var(--control-radius)] text-[var(--text-soft)] hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]',
        destructive:
          'rounded-[var(--control-radius)] bg-rose-600 text-white hover:bg-rose-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
