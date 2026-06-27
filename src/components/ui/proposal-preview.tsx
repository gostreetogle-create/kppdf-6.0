'use client';

import { DocPreview } from '@/components/ui/doc-preview';
import { generateProposalPdf, downloadPdf, type ProposalPdfData } from '@/lib/pdf';
import type { TableColumn } from '@/types';

interface ProposalPreviewProps {
  data: ProposalPdfData;
}

export function ProposalPreview({ data }: ProposalPreviewProps) {
  const handleDownload = async () => {
    const doc = await generateProposalPdf(data);
    downloadPdf(doc, `КП-${data.number}.pdf`);
  };

  const total = data.items?.reduce((sum, item) => sum + item.total, 0) || 0;

  // Блок 1.2b: data-driven columns. Если template.columns заданы — используем их, иначе fallback 5 колонок.
  const columns: TableColumn[] = (data.columns && data.columns.length > 0)
    ? data.columns
    : [
        { id: 'c-name', tableName: 'items', fieldName: 'name', label: 'Наименование', order: 0, align: 'left', type: 'text' },
        { id: 'c-qty', tableName: 'items', fieldName: 'quantity', label: 'Кол-во', order: 1, align: 'right', type: 'number' },
        { id: 'c-unit', tableName: 'items', fieldName: 'unit', label: 'Ед.', order: 2, align: 'center', type: 'text' },
        { id: 'c-up', tableName: 'items', fieldName: 'unitPrice', label: 'Цена', order: 3, align: 'right', type: 'currency' },
        { id: 'c-tot', tableName: 'items', fieldName: 'total', label: 'Сумма', order: 4, align: 'right', type: 'currency' },
      ];

  return (
    <DocPreview title={`КП ${data.number}`} onDownload={handleDownload} downloadLabel="Скачать КП">
      <div className="space-y-6 font-sans text-sm text-[var(--foreground)]">
        {data.organization && (
          <div className="text-xs text-[var(--muted-foreground)]">
            <p className="font-medium">{data.organization.name}</p>
            {data.organization.inn && <p>ИНН: {data.organization.inn}  КПП: {data.organization.kpp || '—'}</p>}
            {data.organization.legalAddress && <p>Адрес: {data.organization.legalAddress}</p>}
            {(data.organization.phone || data.organization.email) && (
              <p>Тел: {data.organization.phone || '—'}  Email: {data.organization.email || '—'}</p>
            )}
          </div>
        )}

        <div className="text-center">
          <h1 className="text-xl font-bold">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
          <p className="text-lg">№ {data.number}</p>
          <p className="text-sm text-[var(--muted-foreground)]">от {new Date(data.createdAt).toLocaleDateString('ru-RU')}</p>
        </div>

        {data.client && (
          <div className="border-b border-[var(--border)] pb-4">
            <p className="font-medium">Клиент:</p>
            <p>{data.client.lastName} {data.client.firstName} {data.client.patronymic || ''}</p>
            {data.client.phone && <p>Тел: {data.client.phone}</p>}
            {data.client.email && <p>Email: {data.client.email}</p>}
          </div>
        )}

        <div>
          <p><span className="font-medium">Наименование:</span> {data.title}</p>
        </div>

        {data.items && data.items.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--muted)]">
                {columns.map((c) => (
                  <th key={c.id}
                    className={`border border-[var(--border)] p-2 text-${c.align || 'left'} text-xs font-medium text-[var(--muted-foreground)]`}
                    style={c.width ? { width: c.width } : undefined}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="hover:bg-[var(--muted)]/50 transition-colors">
                  {columns.map((c) => {
                    const v = (item as Record<string, unknown>)[c.fieldName];
                    if (c.type === 'image' && v) {
                      return (
                        <td key={c.id} className="border border-[var(--border)] p-1 text-center align-middle">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={String(v)} alt=""
                            className="inline-block max-w-full max-h-[60px] object-contain align-middle"
                            style={c.width ? { width: c.width, height: 'auto' } : undefined} />
                        </td>
                      );
                    }
                    return (
                      <td key={c.id}
                        className={`border border-[var(--border)] p-2 text-${c.align || 'left'}`}>
                        {c.type === 'currency' && typeof v === 'number'
                          ? v.toLocaleString('ru-RU') + ' ₽'
                          : String(v ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--muted)] font-bold">
                <td colSpan={columns.length - 1} className="border border-[var(--border)] p-2 text-right">ИТОГО:</td>
                <td className="border border-[var(--border)] p-2 text-right">{total.toLocaleString('ru-RU')} ₽</td>
              </tr>
            </tfoot>
          </table>
        )}

        {data.markupPercent && data.markupPercent > 0 && (
          <p><span className="font-medium">Наценка:</span> {data.markupPercent}%</p>
        )}

        {data.validUntil && (
          <p><span className="font-medium">Действительно до:</span> {new Date(data.validUntil).toLocaleDateString('ru-RU')}</p>
        )}

        {data.notes && (
          <div>
            <p className="font-medium">Примечания:</p>
            <p className="whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <div className="pt-8 border-t">
          <p>Подпись: ___________________</p>
          {data.organization?.signerName && (
            <p className="mt-2">{data.organization.signerPosition || ''} {data.organization.signerName}</p>
          )}
        </div>
      </div>
    </DocPreview>
  );
}
