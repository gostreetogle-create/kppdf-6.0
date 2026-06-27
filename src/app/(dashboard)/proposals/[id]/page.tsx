'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, GitBranch } from 'lucide-react';
import { ProposalPreview } from '@/components/ui/proposal-preview';
import type { ProposalPdfData } from '@/lib/pdf';
import { PROPOSAL_STATUS, getStatus } from '@/lib/constants/statuses';
import { ActivityLog } from '@/components/activity-log';

interface ProposalItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  markupPercent?: number;
  total: number;
}

interface Proposal {
  id: string;
  number: string;
  title: string;
  status: string;
  // Cycle 42 — Версионирование КП (Block 3.2)
  version: number;
  parentProposalId: string | null;
  supersededAt: string | null;
  client?: {
    lastName: string;
    firstName: string;
    patronymic?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  organization?: {
    name: string;
    shortName?: string;
    legalForm?: string;
    inn?: string;
    kpp?: string;
    ogrn?: string;
    legalAddress?: string;
    phone?: string;
    email?: string;
    bankName?: string;
    bankBik?: string;
    bankAccount?: string;
    signerName?: string;
    signerPosition?: string;
  };
  items: ProposalItem[];
  markupPercent?: number;
  notes?: string;
  validUntil?: string;
  createdAt: string;
}



export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingVersion, setCreatingVersion] = useState(false); // Cycle 43

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await fetch(`/api/proposals/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProposal(data.data || data);
        }
      } catch (err) {
        console.error('Error fetching proposal:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProposal();
    }
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить это предложение?')) return;
    try {
      const res = await fetch(`/api/proposals/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/proposals');
      }
    } catch (err) {
      console.error('Error deleting proposal:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Предложение не найдено</p>
        <button
          onClick={() => router.push('/proposals')}
          className="mt-4 text-[var(--primary)] hover:underline"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const status = getStatus(PROPOSAL_STATUS, proposal.status);

  // Cycle 43 — обработчик "Создать новую версию"
  const handleCreateVersion = async () => {
    if (!confirm(`Создать новую версию на основе v${proposal.version}? Старая версия будет помечена как superseded.`)) return;
    setCreatingVersion(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/versions`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const newProposal = data.data?.proposal || data.proposal;
        window.location.href = `/proposals/${newProposal.id}`;
      } else {
        const err = await res.json();
        alert(`Ошибка: ${err.error || 'не удалось создать версию'}`);
      }
    } catch (err) {
      console.error('Error creating version:', err);
      alert('Ошибка сети');
    } finally {
      setCreatingVersion(false);
    }
  };

  const pdfData: ProposalPdfData = {
    number: proposal.number,
    title: proposal.title,
    status: proposal.status,
    client: proposal.client,
    organization: proposal.organization,
    items: proposal.items,
    markupPercent: proposal.markupPercent,
    notes: proposal.notes,
    validUntil: proposal.validUntil,
    createdAt: proposal.createdAt,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/proposals')}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{proposal.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              № {proposal.number}
              {/* Cycle 43 — version badge */}
              {proposal.version > 1 && (
                <span className="inline-flex px-2 py-0.5 bg-[var(--muted)] text-[var(--muted-foreground)] rounded text-xs font-medium">
                  v{proposal.version}
                </span>
              )}
              {/* Cycle 43 — superseded indicator */}
              {proposal.supersededAt && (
                <span className="inline-flex px-2 py-0.5 bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] rounded text-xs font-medium">
                  superseded — есть новая версия
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
            {status.label}
          </span>
          {/* Cycle 43 — кнопка "Создать новую версию" (только если не superseded) */}
          {!proposal.supersededAt && (
            <button
              onClick={handleCreateVersion}
              disabled={creatingVersion}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors text-sm disabled:opacity-50"
              title="Создать новую версию на основе этой"
            >
              <GitBranch size={14} />
              {creatingVersion ? 'Создаём...' : 'Новая версия'}
            </button>
          )}
          {/* Cycle 43 — disable Edit если superseded */}
          {!proposal.supersededAt && (
            <button
              onClick={() => router.push(`/proposals?edit=${proposal.id}`)}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
              title="Редактировать"
            >
              <Edit size={16} />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg border border-[var(--status-danger-text)] text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] transition-colors"
            title="Удалить"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold mb-4">Информация</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Клиент</p>
                <p className="font-medium">
                  {proposal.client
                    ? `${proposal.client.lastName} ${proposal.client.firstName}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Наценка</p>
                <p className="font-medium">{proposal.markupPercent || 0}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Создано</p>
                <p className="font-medium">
                  {new Date(proposal.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              {proposal.validUntil && (
                <div>
                  <p className="text-muted-foreground">Действует до</p>
                  <p className="font-medium">
                    {new Date(proposal.validUntil).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
            {proposal.notes && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-muted-foreground text-sm">Примечания</p>
                <p className="mt-1 text-sm">{proposal.notes}</p>
              </div>
            )}
          </div>

          {proposal.items && proposal.items.length > 0 && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold mb-4">Товары</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2">Наименование</th>
                    <th className="text-right py-2">Кол-во</th>
                    <th className="text-right py-2">Цена</th>
                    <th className="text-right py-2">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.items.map((item, index) => (
                    <tr key={index} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="py-2">{item.name}</td>
                      <td className="text-right py-2">{item.quantity} {item.unit || 'шт'}</td>
                      <td className="text-right py-2">{item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                      <td className="text-right py-2">{item.total.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={3} className="text-right py-2">ИТОГО:</td>
                    <td className="text-right py-2">
                      {proposal.items.reduce((sum, item) => sum + item.total, 0).toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold mb-4">Документы</h2>
            <ProposalPreview data={pdfData} />
          </div>
          {/* Cycle 57 (B.7): UserActivity timeline below preview */}
          <ActivityLog entity="proposal" entityId={proposal.id} />
        </div>
      </div>
    </div>
  );
}
