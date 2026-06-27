'use client';

import { forwardRef } from 'react';

interface A4PageProps {
  children: React.ReactNode;
  backgroundImage?: string;
  backgroundOpacity?: number;
  scale?: number;
  editable?: boolean;
  pageNumber?: number;
  totalPages?: number;
}

export const A4Page = forwardRef<HTMLDivElement, A4PageProps>(
  ({ children, backgroundImage, backgroundOpacity = 1, scale = 1, editable = false, pageNumber, totalPages }, ref) => {
    return (
      <div
        className="relative mx-auto"
        style={{
          width: '210mm',
          minHeight: '297mm',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        <div
          ref={ref}
          className="relative bg-[var(--card)] shadow-lg overflow-hidden border border-[var(--border)]"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '4mm',
          }}
        >
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none z-0"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                opacity: backgroundOpacity,
              }}
            />
          )}

          <div className="relative z-10 w-full">
            {children}
          </div>

          {editable && (
            <div className="absolute bottom-2 right-2 text-xs text-[var(--muted-foreground)] select-none flex items-center gap-2">
              <span>A4 · 210×297 мм</span>
              {pageNumber && totalPages ? (
                <span className="font-semibold text-[var(--foreground)]">{pageNumber}/{totalPages}</span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }
);

A4Page.displayName = 'A4Page';
