import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function DocumentTableFrame({
  summary,
  actions,
  children,
  className,
}: {
  summary?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2 pt-1', className)}>
      {(summary || actions) && (
        <div className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">{summary}</div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}
