import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function DocumentTableToolbar({
  filters,
  actions,
  className,
}: {
  filters: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border border-[var(--panel-border)] bg-[var(--panel-muted)] p-3.5',
        className
      )}
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div>{filters}</div>
        {actions ? <div className="flex gap-2 xl:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}
