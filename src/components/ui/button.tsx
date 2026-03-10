import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-400/20 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'bg-sky-400 text-slate-950 hover:bg-sky-300',
        secondary:
          'border border-[var(--panel-border)] bg-[var(--panel-muted)] text-[var(--app-fg)] hover:bg-[var(--panel-hover)]',
        ghost: 'text-[var(--text-soft)] hover:bg-[var(--panel-hover)] hover:text-[var(--app-fg)]',
        destructive: 'bg-rose-400 text-slate-950 hover:bg-rose-300',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        default: 'h-9 px-3.5 text-sm',
        lg: 'h-10 px-4 text-sm',
        icon: 'h-8 w-8',
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
