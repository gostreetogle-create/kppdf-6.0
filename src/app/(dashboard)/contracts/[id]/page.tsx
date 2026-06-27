'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Factory } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ContractPreview } from '@/components/ui/contract-preview';
import type { ContractPdfData } from '@/lib/pdf';
import { CONTRACT_STATUS, getStatus } from '@/lib/constants/statuses';
import { ActivityLog } from '@/components/activity-log'; // Cycle 57 (B.7)

interface ContractItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
}

interface Contract {
  id: string;
  number: string;
  title: string;
  status: string;
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
  items: ContractItem[];
  totalAmount: number;
  signedAt?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
}



export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedOrder, setConvertedOrder] = useState<{ number: string; id: string } | null>(null);
  const [convertError, setConvertError] = useState('');

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setContract(data.data || data);
        }
      } catch (err) {
        console.error('Error fetching contract:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchContract();
    }
  }, [params.id]);

  const handleConvertToProduction = async () => {
    if (converting || convertedOrder) return;
    setConverting(true);
    setConvertError('');
    try {
      const res = await fetch(`/api/contracts/${params.id}/convert-to-production`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setConvertedOrder({ number: data.data?.number || data.number, id: data.data?.id || data.id });
        // Обновляем статус договора локально
        setContract(prev => prev ? { ...prev, status: 'active' } : prev);
      } else {
        setConvertError(data.error || data.message || 'Ошибка конвертации');
      }
    } catch {
      setConvertError('Ошибка сети');
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/contracts/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/contracts');
      }
    } catch (err) {
      console.error('Error deleting contract:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Договор не найден</p>
        <button
          onClick={() => router.push('/contracts')}
          className="mt-4 text-[var(--primary)] hover:underline"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const status = getStatus(CONTRACT_STATUS, contract.status);

  const pdfData: ContractPdfData = {
    number: contract.number,
    title: contract.title,
    status: contract.status,
    client: contract.client,
    organization: contract.organization,
    items: contract.items,
    totalAmount: contract.totalAmount,
    signedAt: contract.signedAt,
    expiresAt: contract.expiresAt,
    notes: contract.notes,
    createdAt: contract.createdAt,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/contracts')}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{contract.title}</h1>
            <p className="text-sm text-muted-foreground">№ {contract.number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
            {status.label}
          </span>
          {contract.status !== 'active' && contract.status !== 'completed' && contract.items.length > 0 && (
            <button
              onClick={handleConvertToProduction}
              disabled={converting || !!convertedOrder}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--success)] text-[var(--success-foreground)] text-sm font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-50 active:scale-[0.97]"
            >
              <Factory size={15} />
              {converting ? 'Создание...' : convertedOrder ? 'Заказ создан' : 'Передать в производство'}
            </button>
          )}
          <button
            onClick={() => router.push(`/contracts?edit=${contract.id}`)}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 rounded-lg border border-[var(--status-danger-text)] text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Success banner */}
      {convertedOrder && (
        <div className="bg-[var(--status-emerald-bg)] border border-[var(--status-emerald-text)] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--status-emerald-bg)] flex items-center justify-center">
              <Factory size={16} className="text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">
                Производственный заказ №{convertedOrder.number} создан
              </p>
              <p className="text-xs text-success">
                Заказ передан в производство. Статус договора обновлён на «Активно».
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/production')}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-success text-success-foreground text-xs font-semibold hover:opacity-90 transition-colors"
          >
            Открыть заказы
          </button>
        </div>
      )}

      {/* Error banner */}
      {convertError && (
        <div className="bg-[var(--status-danger-bg)] border border-[var(--status-danger-text)] rounded-xl p-3 flex items-center gap-2">
          <span className="text-sm text-destructive">{convertError}</span>
          <button onClick={() => setConvertError('')} className="ml-auto text-muted-foreground hover:text-destructive">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold mb-4">Информация</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Заказчик</p>
                <p className="font-medium">
                  {contract.client
                    ? `${contract.client.lastName} ${contract.client.firstName}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Сумма</p>
                <p className="font-medium">{contract.totalAmount.toLocaleString('ru-RU')} ₽</p>
              </div>
              <div>
                <p className="text-muted-foreground">Создан</p>
                <p className="font-medium">
                  {new Date(contract.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              {contract.signedAt && (
                <div>
                  <p className="text-muted-foreground">Подписан</p>
                  <p className="font-medium">
                    {new Date(contract.signedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
              {contract.expiresAt && (
                <div>
                  <p className="text-muted-foreground">Действует до</p>
                  <p className="font-medium">
                    {new Date(contract.expiresAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
            {contract.notes && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-muted-foreground text-sm">Примечания</p>
                <p className="mt-1 text-sm">{contract.notes}</p>
              </div>
            )}
          </div>

          {contract.items && contract.items.length > 0 && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold mb-4">Позиции</h2>
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
                  {contract.items.map((item, index) => (
                    <tr key={index} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors">
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
                      {contract.totalAmount.toLocaleString('ru-RU')} ₽
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
            <ContractPreview data={pdfData} />
          </div>
          {/* Cycle 57 (B.7): UserActivity timeline below preview */}
          <ActivityLog entity="contract" entityId={contract.id} />
        </div>
      </div>
      <ConfirmDialog
        open={showDelete}
        title="Удалить договор?"
        message="Это действие нельзя отменить. Все позиции договора будут удалены."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
