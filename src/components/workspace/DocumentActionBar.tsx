import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function DocumentActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2.5 xl:justify-end',
        className
      )}
    >
      {children}
    </div>
  );
}
