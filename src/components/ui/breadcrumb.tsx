'use client';

import { forwardRef, type ComponentPropsWithRef } from 'react';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps extends ComponentPropsWithRef<'nav'> {
  items: BreadcrumbItem[];
  showHome?: boolean;
  homeHref?: string;
  maxItems?: number;
  separator?: React.ReactNode;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, showHome, homeHref = '/', maxItems, separator, className, ...props }, ref) => {
    const sep = separator || <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;

    let displayItems = items;
    if (maxItems && items.length > maxItems) {
      const first = items[0];
      const last = items.slice(-(maxItems - 2));
      displayItems = [first, { label: '...', href: undefined }, ...last];
    }

    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)} {...props}>
        {showHome && (
          <>
            <Link href={homeHref} className="transition-colors hover:text-foreground p-0.5" aria-label="Главная">
              <Home className="h-3.5 w-3.5" />
            </Link>
            {sep}
          </>
        )}
        {displayItems.map((item, i) => {
          const isLast = i === displayItems.length - 1;
          const isEllipsis = item.label === '...';
          return (
            <span key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && !isEllipsis && sep}
              {isEllipsis ? (
                <span className="flex items-center" aria-hidden="true">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </span>
              ) : isLast || !item.href ? (
                <span className={cn('truncate', isLast && 'font-medium text-foreground')}>{item.label}</span>
              ) : (
                <Link href={item.href} className="truncate transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    );
  },
);
Breadcrumb.displayName = 'Breadcrumb';
