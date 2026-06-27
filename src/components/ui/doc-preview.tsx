'use client';

import { useState, useRef } from 'react';
import { Download, Eye, X } from 'lucide-react';

interface DocPreviewProps {
  title: string;
  children: React.ReactNode;
  onDownload: () => void;
  downloadLabel?: string;
}

export function DocPreview({ title, children, onDownload, downloadLabel = 'Скачать PDF' }: DocPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await onDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors"
        >
          <Eye size={16} />
          Предпросмотр
        </button>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Download size={16} />
          {isGenerating ? 'Генерация...' : downloadLabel}
        </button>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div ref={previewRef} className="bg-[var(--background)] p-8 shadow-inner min-h-[500px] text-[var(--foreground)]">
                {children}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-[var(--border)]">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors"
              >
                Закрыть
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Download size={16} />
                {isGenerating ? 'Генерация...' : downloadLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
