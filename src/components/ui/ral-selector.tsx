'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

/**
 * Популярные RAL цвета для выбора
 */
const RAL_COLORS: { code: string; name: string; hex: string }[] = [
  // Белые и бежевые
  { code: 'RAL 9010', name: 'Чисто-белый', hex: '#FFFFFF' },
  { code: 'RAL 9016', name: 'Транспортный белый', hex: '#F6F6F6' },
  { code: 'RAL 9001', name: 'Кремово-белый', hex: '#FDF4E3' },
  { code: 'RAL 9003', name: 'Сигнальный белый', hex: '#F4F4F4' },
  { code: 'RAL 1013', name: 'Жемчужно-белый', hex: '#EAE5CA' },
  // Жёлтые
  { code: 'RAL 1003', name: 'Сигнальный жёлтый', hex: '#F9A800' },
  { code: 'RAL 1018', name: 'Цинково-жёлтый', hex: '#FACA30' },
  { code: 'RAL 1023', name: 'Транспортный жёлтый', hex: '#FAD201' },
  // Оранжевые
  { code: 'RAL 2004', name: 'Чистый оранжевый', hex: '#E24424' },
  { code: 'RAL 2008', name: 'Красный оранжевый', hex: '#F27A2D' },
  // Красные
  { code: 'RAL 3000', name: 'Огненно-красный', hex: '#AF2B1E' },
  { code: 'RAL 3004', name: 'Тёмно-красный', hex: '#701F1C' },
  { code: 'RAL 3013', name: 'Томатно-красный', hex: '#A12312' },
  // Синие
  { code: 'RAL 5010', name: 'Горечавково-синий', hex: '#13447C' },
  { code: 'RAL 5015', name: 'Небесно-голубой', hex: '#2478B8' },
  { code: 'RAL 5005', name: 'Сигнальный синий', hex: '#1E3A6E' },
  { code: 'RAL 5024', name: 'Пастельно-голубой', hex: '#609AB8' },
  // Зелёные
  { code: 'RAL 6002', name: 'Лиственно-зелёный', hex: '#2D572C' },
  { code: 'RAL 6005', name: 'Мохово-зелёный', hex: '#104410' },
  { code: 'RAL 6018', name: 'Жёлто-зелёный', hex: '#57A639' },
  { code: 'RAL 6034', name: 'Пастельно-зелёный', hex: '#7FB0B0' },
  // Серые
  { code: 'RAL 7001', name: 'Серебристо-серый', hex: '#8F8F8F' },
  { code: 'RAL 7035', name: 'Светло-серый', hex: '#C8C8C8' },
  { code: 'RAL 7042', name: 'Дорожно-серый', hex: '#8D948D' },
  // Чёрные и коричневые
  { code: 'RAL 9005', name: 'Глубокий чёрный', hex: '#0A0A0A' },
  { code: 'RAL 8014', name: 'Тёмно-коричневый', hex: '#59351F' },
  { code: 'RAL 8017', name: 'Шоколадно-коричневый', hex: '#45322E' },
  { code: 'RAL 8028', name: 'Терракотовый', hex: '#755C48' },
  // Металлик
  { code: 'RAL 9006', name: 'Бело-алюминиевый', hex: '#A5A5A5' },
  { code: 'RAL 9007', name: 'Серо-алюминиевый', hex: '#8C8C8C' },
];

interface RalSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RalSelector({ value, onChange, className = '' }: RalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = search
    ? RAL_COLORS.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : RAL_COLORS;

  const selected = RAL_COLORS.find((c) => c.code === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      >
        {selected ? (
          <>
            <span
              className="w-5 h-5 rounded border border-[var(--border)] shrink-0"
              style={{ backgroundColor: selected.hex }}
            />
            <span className="font-mono text-xs">{selected.code}</span>
            <span className="text-xs text-[var(--muted-foreground)]">{selected.name}</span>
          </>
        ) : (
          <>
            <Palette className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)]">
              {value || 'Выбрать RAL...'}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-[320px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[var(--border)]">
            <input
              type="text"
              id="search-ral"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по коду или названию..."
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              autoFocus
            />
          </div>

          {/* Palette */}
          <div className="max-h-[280px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] text-center py-4">Ничего не найдено</p>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      value === c.code
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'hover:bg-[var(--muted)] text-[var(--foreground)]'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded border border-[var(--border)] shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="font-mono font-semibold">{c.code}</span>
                    <span className="text-[var(--muted-foreground)]">{c.name}</span>
                    {value === c.code && (
                      <span className="ml-auto text-[var(--primary)]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear */}
          {value && (
            <div className="p-1.5 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="w-full px-2 py-1 rounded text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/5 transition-colors"
              >
                Очистить RAL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Отображение выбранного RAL кода в виде цветной метки
 */
export function RalBadge({ code }: { code?: string | null }) {
  if (!code) return null;
  const color = RAL_COLORS.find((c) => c.code === code);
  const displayName = color ? color.name : code;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[var(--border)]">
      {color && (
        <span
          className="w-3 h-3 rounded-full border border-[var(--border)]"
          style={{ backgroundColor: color.hex }}
        />
      )}
      {displayName}
    </span>
  );
}

// Экспортируем цвета для использования в других частях приложения
export { RAL_COLORS };
