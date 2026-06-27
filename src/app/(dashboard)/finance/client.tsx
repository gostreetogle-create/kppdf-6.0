'use client';

import { Receipt, FileCheck, BarChart3 } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'order-closings': <Receipt className="h-6 w-6" />,
  'reconciliation': <FileCheck className="h-6 w-6" />,
  'reports': <BarChart3 className="h-6 w-6" />,
};

interface Section {
  slug: string;
  title: string;
  description: string;
  href: string;
}

export function FinanceCards({ sections }: { sections: Section[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sections.map((s) => (
        <a
          key={s.title}
          href={s.href}
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:shadow-md transition-shadow block"
        >
          <div className="text-[var(--primary)] mb-3">{iconMap[s.slug]}</div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">{s.title}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{s.description}</p>
        </a>
      ))}
    </div>
  );
}
