'use client';

// Cycle 44 (B.3 Block 3.1): PdfExport sub-component — PDF preview modal.
// Uses DocPreview (Tier D, mutable) to render HTML preview of pdf data prior to download/create.
// Download button generates the real PDF via Tier B (frozen API) generateProposalPdf.

import { generateProposalPdf, downloadPdf } from '@/lib/pdf';
import { DocPreview } from '@/components/ui/doc-preview';
import { useProposalEditor } from './editor-provider';

export function PdfExport() {
  // Cycle 45: drop unused `actions` (was triggering @typescript-eslint/no-unused-vars);
  // `computed.pdfData` is now a memoized value (was a `() => ...` function — Date.now()
  // inside hit "Cannot call impure function during render" react-compiler rule).
  const { state, computed } = useProposalEditor();

  if (!state.showPdfPreview) return null;

  const data = computed.pdfData;
  if (!data) return null;

  const total = data.items.reduce((s, i) => s + i.total, 0);
  const discAmount = data.discountAmount ?? 0;
  const vat = data.vatAmount ?? 0;
  const grand = data.grandTotal ?? total;

  const handleDownload = async () => {
    if (!data) return;
    const doc = await generateProposalPdf(data);
    // Cycle 45: use data.number instead of Date.now() so react-compiler can preserve
    // manual memoization (no impure function in render-path closure).
    downloadPdf(doc, `${data.number}.pdf`);
  };

  return (
    <DocPreview
      title={`Предпросмотр — ${data.number}`}
      onDownload={handleDownload}
      downloadLabel="Скачать PDF"
    >
      <div className="space-y-4 text-sm text-[var(--foreground)]">
        {data.organization && (
          <p className="text-xs text-[var(--muted-foreground)] font-medium">
            {data.organization.name}
          </p>
        )}
        <div className="text-center">
          <h2 className="text-lg font-bold">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            № {data.number} от {new Date(data.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </div>
        {data.client && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Клиент: {data.client.lastName} {data.client.firstName}
          </p>
        )}
        {data.items && data.items.length > 0 && (
          <table className="w-full text-xs border-collapse border border-[var(--border)]">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th className="border border-[var(--border)] p-1.5 text-left">Наименование</th>
                <th className="border border-[var(--border)] p-1.5 text-right">Кол-во</th>
                <th className="border border-[var(--border)] p-1.5 text-center">Ед.</th>
                <th className="border border-[var(--border)] p-1.5 text-right">Цена</th>
                <th className="border border-[var(--border)] p-1.5 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="hover:bg-[var(--muted)]/50 transition-colors">
                  <td className="border border-[var(--border)] p-1.5">{item.name}</td>
                  <td className="border border-[var(--border)] p-1.5 text-right">{item.quantity}</td>
                  <td className="border border-[var(--border)] p-1.5 text-center">{item.unit || 'шт'}</td>
                  <td className="border border-[var(--border)] p-1.5 text-right">
                    {item.unitPrice.toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="border border-[var(--border)] p-1.5 text-right">
                    {item.total.toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--muted)] font-bold">
                <td colSpan={4} className="border border-[var(--border)] p-1.5 text-right">
                  Сумма:
                </td>
                <td className="border border-[var(--border)] p-1.5 text-right">
                  {total.toLocaleString('ru-RU')} ₽
                </td>
              </tr>
              {discAmount > 0 && (
                <tr className="text-[var(--destructive)]">
                  <td colSpan={4} className="border border-[var(--border)] p-1.5 text-right">
                    Скидка ({data.discountPercent}%):
                  </td>
                  <td className="border border-[var(--border)] p-1.5 text-right">
                    −{discAmount.toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={4} className="border border-[var(--border)] p-1.5 text-right">
                  НДС ({data.vatRate || 20}%):
                </td>
                <td className="border border-[var(--border)] p-1.5 text-right">
                  {vat.toLocaleString('ru-RU')} ₽
                </td>
              </tr>
              <tr className="bg-[var(--muted)] font-bold text-base">
                <td colSpan={4} className="border border-[var(--border)] p-1.5 text-right">
                  ИТОГО:
                </td>
                <td className="border border-[var(--border)] p-1.5 text-right">
                  {grand.toLocaleString('ru-RU')} ₽
                </td>
              </tr>
            </tfoot>
          </table>
        )}
        <p className="text-xs pt-4 border-t border-[var(--border)] text-[var(--muted-foreground)]">
          Подпись: ___________________
        </p>
      </div>
    </DocPreview>
  );
}
