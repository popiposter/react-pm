import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function EntityPageHeader({
  breadcrumbs,
  eyebrow,
  title,
  titleMeta,
  actions,
  actionsClassName,
  className,
}: {
  breadcrumbs?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  titleMeta?: ReactNode;
  actions?: ReactNode;
  actionsClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn('app-surface p-4 sm:p-5 xl:p-6', className)}>
      <div className="space-y-4">
        {breadcrumbs}
        {eyebrow}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-2">
              <h1 className="text-[1.8rem] font-semibold tracking-tight xl:text-[2rem]">
                {title}
              </h1>
              {titleMeta}
            </div>
          </div>
          {actions && (
            <div className={cn('flex flex-wrap items-center gap-2.5', actionsClassName)}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
