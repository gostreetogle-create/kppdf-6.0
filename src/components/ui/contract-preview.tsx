'use client';

import { DocPreview } from '@/components/ui/doc-preview';
import { generateContractPdf, downloadPdf, type ContractPdfData } from '@/lib/pdf';
import type { TableColumn } from '@/types';

interface ContractPreviewProps {
  data: ContractPdfData;
}

export function ContractPreview({ data }: ContractPreviewProps) {
  const handleDownload = async () => {
    const doc = await generateContractPdf(data);
    downloadPdf(doc, `Договор-${data.number}.pdf`);
  };

  // Блок 1.2b: data-driven columns.
  const columns: TableColumn[] = (data.columns && data.columns.length > 0)
    ? data.columns
    : [
        { id: 'c-name', tableName: 'items', fieldName: 'name', label: 'Наименование', order: 0, align: 'left', type: 'text' },
        { id: 'c-qty', tableName: 'items', fieldName: 'quantity', label: 'Кол-во', order: 1, align: 'right', type: 'number' },
        { id: 'c-unit', tableName: 'items', fieldName: 'unit', label: 'Ед.', order: 2, align: 'center', type: 'text' },
        { id: 'c-tot', tableName: 'items', fieldName: 'total', label: 'Сумма', order: 3, align: 'right', type: 'currency' },
      ];

  return (
    <DocPreview title={`Договор ${data.number}`} onDownload={handleDownload} downloadLabel="Скачать договор">
      <div className="space-y-6 font-sans text-sm">
        {data.organization && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">{data.organization.name}</p>
            {data.organization.inn && <p>ИНН: {data.organization.inn}  КПП: {data.organization.kpp || '—'}</p>}
            {data.organization.legalAddress && <p>Адрес: {data.organization.legalAddress}</p>}
          </div>
        )}

        <div className="text-center">
          <h1 className="text-xl font-bold">ДОГОВОР</h1>
          <p className="text-lg">№ {data.number}</p>
          <p className="text-sm text-muted-foreground">от {new Date(data.createdAt).toLocaleDateString('ru-RU')}</p>
        </div>

        <div>
          <p><span className="font-medium">Наименование:</span> {data.title}</p>
        </div>

        {data.client && (
          <div className="border-b pb-4">
            <p className="font-medium">Заказчик:</p>
            <p>{data.client.lastName} {data.client.firstName} {data.client.patronymic || ''}</p>
            {data.client.phone && <p>Тел: {data.client.phone}</p>}
          </div>
        )}

        {data.items && data.items.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--status-neutral-bg)]">
                {columns.map((c) => (
                  <th key={c.id}
                    className={`border p-2 text-${c.align || 'left'} text-xs font-medium text-[var(--muted-foreground)]`}
                    style={c.width ? { width: c.width } : undefined}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="hover:bg-[var(--muted)]/40">
                  {columns.map((c) => {
                    const v = (item as Record<string, unknown>)[c.fieldName];
                    if (c.type === 'image' && v) {
                      return (
                        <td key={c.id} className="border p-1 text-center align-middle">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={String(v)} alt=""
                            className="inline-block max-w-full max-h-[60px] object-contain align-middle"
                            style={c.width ? { width: c.width, height: 'auto' } : undefined} />
                        </td>
                      );
                    }
                    return (
                      <td key={c.id} className={`border p-2 text-${c.align || 'left'}`}>
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
              <tr className="bg-muted font-bold">
                <td colSpan={columns.length - 1} className="border p-2 text-right">ИТОГО:</td>
                <td className="border p-2 text-right">{data.totalAmount.toLocaleString('ru-RU')} ₽</td>
              </tr>
            </tfoot>
          </table>
        )}

        {data.signedAt && (
          <p><span className="font-medium">Дата подписания:</span> {new Date(data.signedAt).toLocaleDateString('ru-RU')}</p>
        )}

        {data.expiresAt && (
          <p><span className="font-medium">Действует до:</span> {new Date(data.expiresAt).toLocaleDateString('ru-RU')}</p>
        )}

        {data.notes && (
          <div>
            <p className="font-medium">Примечания:</p>
            <p className="whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <div className="pt-8 border-t grid grid-cols-2 gap-8">
          <div>
            <p className="font-medium">ЗАКАЗЧИК:</p>
            <p className="mt-4">___________________</p>
            {data.client && (
              <p className="mt-2">{data.client.lastName} {data.client.firstName}</p>
            )}
          </div>
          <div>
            <p className="font-medium">ИСПОЛНИТЕЛЬ:</p>
            <p className="mt-4">___________________</p>
            {data.organization?.signerName && (
              <p className="mt-2">{data.organization.signerName}</p>
            )}
          </div>
        </div>
      </div>
    </DocPreview>
  );
}
