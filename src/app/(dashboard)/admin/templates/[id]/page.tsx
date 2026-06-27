'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, ImageIcon } from 'lucide-react';
import { AdminSkeleton } from '@/components/skeletons';

// Code-split: BlockEditor (DnD blocks, templates) → отдельный чанк
const BlockEditor = dynamic(
  () => import('@/components/ui/block-editor').then(m => ({ default: m.BlockEditor })),
  {
    ssr: false,
    loading: () => <AdminSkeleton />,
  },
);
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { DocBlock } from '@/types';

interface DocType {
  id: string;
  name: string;
  slug: string;
}

interface Organization {
  id: string;
  name: string;
}

interface TableTemplateOption {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  pageSize?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  isDefault?: boolean;
  docTypeId?: string;
  docType?: DocType;
  organizationId?: string;
  blocks: DocBlock[];
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [template, setTemplate] = useState<Template>({
    id: '',
    name: '',
    description: '',
    pageSize: 'A4',
    backgroundOpacity: 1,
    isDefault: false,
    blocks: [],
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tableTemplates, setTableTemplates] = useState<TableTemplateOption[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch doc types
  useEffect(() => {
    fetch('/api/doc-types')
      .then(r => r.ok ? r.json() : null)
      .then(d => setDocTypes(d?.data?.items ?? d?.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch organizations
  useEffect(() => {
    fetch('/api/organizations')
      .then(r => r.ok ? r.json() : null)
      .then(d => setOrganizations(d?.data?.items ?? d?.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch table templates
  useEffect(() => {
    fetch('/api/table-templates')
      .then(r => r.ok ? r.json() : null)
      .then(d => setTableTemplates(d?.data?.items ?? d?.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch existing template
  useEffect(() => {
    if (isNew) return;
    fetch(`/api/document-templates/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setTemplate(d.data || d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id, isNew]);

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.data?.url || data.url;
        if (url) setTemplate(t => ({ ...t, backgroundImage: url }));
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/document-templates' : `/api/document-templates/${params.id}`;
      const body = {
        name: template.name,
        description: template.description,
        pageSize: template.pageSize,
        backgroundImage: template.backgroundImage,
        backgroundOpacity: template.backgroundOpacity,
        isDefault: template.isDefault,
        docTypeId: template.docTypeId || null,
        organizationId: template.organizationId || null,
        blocks: template.blocks.map((block, index) => ({
          type: block.type,
          order: index,
          page: block.page,
          title: block.title,
          content: block.content,
          columns: block.columns,
          tableTemplateId: block.tableTemplateId,
          height: block.height,
          showLine: block.showLine,
          settings: block.settings,
        })),
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) router.push('/admin/templates');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/templates')} className="p-2 rounded-xl hover:bg-[var(--muted)] transition-colors">
            <ArrowLeft size={20} className="text-[var(--muted-foreground)]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              {isNew ? 'Новый шаблон' : `Редактирование: ${template.name}`}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">Настройте блоки шаблона перетаскиванием</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !template.name}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[var(--primary)]/20">
          <Save size={16} />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {/* Settings bar — collapsible row */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">Настройки шаблона</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider" required>Название *</Label>
            <Input value={template.name} onChange={e => setTemplate({ ...template, name: e.target.value })} placeholder="Название" required />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider">Тип документа</Label>
            <Select value={template.docTypeId || ''} onChange={e => setTemplate({ ...template, docTypeId: e.target.value || undefined })}
              options={[{ value: '', label: 'Не выбран' }, ...docTypes.map(dt => ({ value: dt.id, label: dt.name }))]} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider">Организация</Label>
            <Select value={template.organizationId || ''} onChange={e => setTemplate({ ...template, organizationId: e.target.value || undefined })}
              options={[{ value: '', label: 'Не выбрана' }, ...organizations.map(org => ({ value: org.id, label: org.name }))]} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider">Размер страницы</Label>
            <Select value={template.pageSize || 'A4'} onChange={e => setTemplate({ ...template, pageSize: e.target.value })}
              options={[{ value: 'A4', label: 'A4' }, { value: 'A5', label: 'A5' }, { value: 'Letter', label: 'Letter' }]} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider">Фоновое фото</Label>
            <div className="flex items-center gap-2">
              {template.backgroundImage ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-cover bg-center border border-[var(--border)]" style={{ backgroundImage: `url(${template.backgroundImage})` }} />
                  <button onClick={() => setTemplate({ ...template, backgroundImage: undefined })}
                    className="text-[10px] text-[var(--destructive)] hover:underline">Удалить</button>
                </div>
              ) : (
                <label className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-dashed border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/40 hover:bg-[var(--muted)]/30 transition-all">
                  <ImageIcon size={14} className="text-[var(--muted-foreground)]" />
                  <span className="text-xs text-[var(--muted-foreground)]">{uploading ? 'Загрузка...' : 'Выбрать'}</span>
                  <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label className="block text-[10px] font-semibold uppercase tracking-wider">Описание</Label>
            <Input value={template.description || ''} onChange={e => setTemplate({ ...template, description: e.target.value })}
              placeholder="Описание" className="h-10 px-3 py-2 rounded-xl" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
              Прозрачность фона: {Math.round((template.backgroundOpacity || 1) * 100)}%
            </label>
            <input type="range" min="0" max="1" step="0.1" value={template.backgroundOpacity || 1}
              onChange={e => setTemplate({ ...template, backgroundOpacity: Number(e.target.value) })}
              className="w-full mt-2" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={template.isDefault || false}
                onChange={e => setTemplate({ ...template, isDefault: e.target.checked })}
                className="rounded border-[var(--input)]" />
              Шаблон по умолчанию
            </label>
          </div>
        </div>
      </div>

      {/* Block editor */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <BlockEditor
          blocks={template.blocks}
          onChange={blocks => setTemplate({ ...template, blocks })}
          backgroundImage={template.backgroundImage}
          backgroundOpacity={template.backgroundOpacity}
          templateId={template.id || undefined}
          tableTemplates={tableTemplates}
          onCreateTableTemplate={() => router.push('/admin/table-templates/new')}
        />
      </div>
    </div>
  );
}
