'use client';

import { forwardRef, useState, type ReactNode } from 'react';
import Image, { type ImageProps } from 'next/image';
import { User } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted', {
  variants: {
    size: {
      xs: 'h-6 w-6 text-[10px]',
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-14 w-14 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const statusVariants = cva('absolute bottom-0 right-0 rounded-full border-2 border-background', {
  variants: {
    status: {
      online: 'bg-success',
      away: 'bg-warning',
      busy: 'bg-destructive',
      offline: 'bg-muted-foreground',
    },
  },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  fallback?: ReactNode;
  initials?: string;
  src?: ImageProps['src'];
  alt?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  className?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ size = 'md', fallback, initials, src, alt, status, className }, ref) => {
    const [imgError, setImgError] = useState(false);

    return (
      <div ref={ref} className={cn(avatarVariants({ size }), className)}>
        {src && !imgError ? (
          <Image src={src} alt={alt || ''} fill sizes="100%" className="object-cover" onError={() => setImgError(true)} />
        ) : initials ? (
          <span className="font-medium text-muted-foreground select-none">{initials.slice(0, 2).toUpperCase()}</span>
        ) : fallback ? (
          fallback
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        )}
        {status && <span className={cn(statusVariants({ status }))} />}
      </div>
    );
  },
);
Avatar.displayName = 'Avatar';

// ─── Avatar Group ──────────────────────────────────────────
interface AvatarGroupProps {
  children: ReactNode;
  limit?: number;
  className?: string;
}

export function AvatarGroup({ children, limit, className }: AvatarGroupProps) {
  const childrenArray = Array.isArray(children) ? children : [children];
  const visible = limit ? childrenArray.slice(0, limit) : childrenArray;
  const excess = limit ? childrenArray.length - limit : 0;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visible.map((child, i) => (
        <div key={i} className="ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {excess > 0 && (
        <div className="ring-2 ring-background rounded-full">
          <Avatar size={((visible[0] as React.ReactElement)?.props as AvatarProps)?.size || 'md'} initials={`+${excess}`} />
        </div>
      )}
    </div>
  );
}
