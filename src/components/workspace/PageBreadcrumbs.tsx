import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function PageBreadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Навигационная цепочка" className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="text-sm text-[var(--text-muted)] transition hover:text-[var(--app-fg)]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'text-sm',
                  isLast ? 'font-medium text-[var(--app-fg)]' : 'text-[var(--text-muted)]'
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
          </div>
        );
      })}
    </nav>
  );
}
