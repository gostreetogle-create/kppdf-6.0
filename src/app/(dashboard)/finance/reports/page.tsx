'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FinanceSummary {
  totalProposals: number;
  totalContracts: number;
  totalRevenue: number;
  pendingAmount: number;
}

function exportToCsv(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function FinanceReportsPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Record<string, unknown>[]>([]);
  const [contracts, setContracts] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [propRes, contractRes] = await Promise.all([
          fetch('/api/proposals?limit=200').then(r => r.json()).catch(() => ({ data: { items: [] } })),
          fetch('/api/contracts?limit=200').then(r => r.json()).catch(() => ({ data: { items: [] } })),
        ]);

        const p = propRes.data?.items || [];
        const c = contractRes.data?.items || [];
        setProposals(p);
        setContracts(c);

        setSummary({
          totalProposals: p.length,
          totalContracts: c.length,
          totalRevenue: c.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.totalAmount as number) || 0), 0),
          pendingAmount: p.filter((item: Record<string, unknown>) => item.status === 'draft' || item.status === 'sent').length,
        });
      } catch (e) { console.error('Load error:', e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleExportProposals = () => {
    exportToCsv(
      proposals.map((p) => ({
        Номер: p.number,
        Название: p.title,
        Статус: p.status,
        'Дата создания': new Date(p.createdAt as string).toLocaleDateString('ru-RU'),
      })),
      'отчёт_кп.csv'
    );
  };

  const handleExportContracts = () => {
    exportToCsv(
      contracts.map((c) => ({
        Номер: c.number,
        Название: c.title,
        Статус: c.status,
        Сумма: c.totalAmount,
        'Дата создания': new Date(c.createdAt as string).toLocaleDateString('ru-RU'),
      })),
      'отчёт_договоры.csv'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Финансовые отчёты</h1>
        <div className="flex gap-2">
          <button onClick={handleExportProposals} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]">
            <Download className="h-4 w-4" /> Экспорт КП
          </button>
          <button onClick={handleExportContracts} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]">
            <Download className="h-4 w-4" /> Экспорт договоров
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 animate-pulse">
              <div className="h-8 w-24 bg-[var(--muted)] rounded mb-2" />
              <div className="h-4 w-32 bg-[var(--muted)] rounded" />
            </div>
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <p className="text-sm text-[var(--muted-foreground)]">Всего КП</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{summary.totalProposals}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <p className="text-sm text-[var(--muted-foreground)]">Договоров</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{summary.totalContracts}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <p className="text-sm text-[var(--muted-foreground)]">Выручка</p>
            <p className="text-2xl font-bold text-[var(--success)] mt-1">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <p className="text-sm text-[var(--muted-foreground)]">Ожидают</p>
            <p className="text-2xl font-bold text-[var(--warning)] mt-1">{summary.pendingAmount}</p>
          </div>
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
          Сводка
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Экспорт отчётов в CSV доступен через кнопки выше.
        </p>
      </div>
    </div>
  );
}
