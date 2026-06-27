'use client';

import { useState } from 'react';
import { HelpCircle, X, FileText, Package, ShoppingCart, Users, Building2, Factory, Warehouse, Settings } from 'lucide-react';

interface GuideSection {
  icon: React.ElementType;
  title: string;
  items: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    icon: Package,
    title: 'Товары',
    items: [
      'Добавляйте товары через раздел "Товары"',
      'Каждый товар имеет артикул, цену и единицу измерения',
      'Категории помогают группировать товары',
    ],
  },
  {
    icon: ShoppingCart,
    title: 'Оформление КП',
    items: [
      'Нажмите "Оформить КП" для создания нового предложения',
      'Выберите товары из каталога слева',
      'Настройте организацию, клиента и шаблон',
      'Скидка применяется ко всему КП',
      'НДС рассчитывается автоматически',
    ],
  },
  {
    icon: FileText,
    title: 'Документы',
    items: [
      'Шаблоны документов создаются в "Администрирование → Шаблоны"',
      'Каждый шаблон привязан к типу документа',
      'PDF генерируется из шаблона с данными КП',
      'Договоры создаются на основе КП',
    ],
  },
  {
    icon: Users,
    title: 'Клиенты',
    items: [
      'Ведите базу клиентов в разделе "Клиенты"',
      'У каждого клиента может быть персональная наценка',
      'Привязка к организации опциональна',
    ],
  },
  {
    icon: Building2,
    title: 'Организации',
    items: [
      'Добавьте ваши организации для выставления КП',
      'Укажите ИНН, КПП, банковские реквизиты',
      'Ставка НДС настраивается для каждой организации',
    ],
  },
  {
    icon: Factory,
    title: 'Производство',
    items: [
      'Создавайте заказы производства из КП',
      'Назначайте задачи работникам',
      'Гантт-чарт показывает расписание',
    ],
  },
  {
    icon: Warehouse,
    title: 'Склад',
    items: [
      'Отслеживайте остатки по складам',
      'Создавайте заявки на закупку',
      'Управляйте заказами поставщикам',
    ],
  },
  {
    icon: Settings,
    title: 'Администрирование',
    items: [
      'Управляйте пользователями и ролями',
      'Настройте мастер статусов для переходов',
      'Сертификаты и РПП записи',
    ],
  },
];

export function AppGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 h-10 w-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg hover:opacity-90 transition-all flex items-center justify-center"
        title="Справка"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Справка по системе</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--muted)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-64px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GUIDE_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.title} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-[var(--primary)]" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">{section.title}</h3>
                      </div>
                      <ul className="space-y-1">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-xs text-[var(--muted-foreground)] flex items-start gap-1.5">
                            <span className="text-[var(--primary)] mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
