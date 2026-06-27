'use client';

import { Card } from '@/components/ui/card';
import { Typography, Muted } from '@/components/ui/typography';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

interface ProposalStats {
  name: string;
  value: number;
  color: string;
}

interface CategoryStats {
  name: string;
  count: number;
}

/** Простая SVG-гистограмма — без recharts, 0 зависимостей */
function SimpleBarChart({ data }: { data: ProposalStats[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const BAR_WIDTH = 40;
  const GAP = 12;
  const CHART_HEIGHT = 200;
  const CHART_WIDTH = data.length * (BAR_WIDTH + GAP) + 20;

  return (
    <svg width="100%" height={CHART_HEIGHT + 40} viewBox={`0 0 ${Math.max(CHART_WIDTH, 300)} ${CHART_HEIGHT + 40}`}>
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <g key={ratio}>
          <line
            x1={0} y1={CHART_HEIGHT - CHART_HEIGHT * ratio + 5}
            x2={CHART_WIDTH} y2={CHART_HEIGHT - CHART_HEIGHT * ratio + 5}
            stroke="var(--border)" strokeDasharray="4 4" strokeWidth={0.5}
          />
          <text x={CHART_WIDTH - 5} y={CHART_HEIGHT - CHART_HEIGHT * ratio + 10}
            textAnchor="end" fontSize={10} fill="var(--muted-foreground)">
            {Math.round(maxValue * ratio)}
          </text>
        </g>
      ))}
      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / maxValue) * CHART_HEIGHT;
        const x = i * (BAR_WIDTH + GAP) + 10;
        return (
          <g key={i}>
            <rect
              x={x} y={CHART_HEIGHT - barH + 5}
              width={BAR_WIDTH} height={barH}
              fill={d.color} rx={4}
              className="transition-all duration-300 hover:opacity-80"
            >
              <title>{d.name}: {d.value}</title>
            </rect>
            <text x={x + BAR_WIDTH / 2} y={CHART_HEIGHT + 20}
              textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
              {d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Простая SVG-круговая диаграмма — без recharts */
function SimplePieChart({ data }: { data: CategoryStats[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const RADIUS = 80;
  const cx = 150;
  const cy = 130;

  let cumulativePercent = 0;
  const slices = data.reduce<{ path: string; color: string; label: string; percent: string }[]>((acc, d, i) => {
    const percent = d.count / total;
    const startAngle = cumulativePercent * 360;
    // eslint-disable-next-line react-hooks/immutability
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 360;
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const x1 = cx + RADIUS * Math.cos(startRad);
    const y1 = cy + RADIUS * Math.sin(startRad);
    const x2 = cx + RADIUS * Math.cos(endRad);
    const y2 = cy + RADIUS * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    acc.push({ path: `M ${cx} ${cy} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: PIE_COLORS[i % PIE_COLORS.length], label: d.name, percent: ((d.count / total) * 100).toFixed(0) });
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" height={260} viewBox="0 0 300 260">
        {slices.map((slice, i) => (
          <g key={i}>
            <path d={slice.path} fill={slice.color} stroke="var(--card)" strokeWidth={2} className="transition-all duration-300 hover:opacity-80">
              <title>{slice.label}: {slice.percent}%</title>
            </path>
          </g>
        ))}
        {/* Legend */}
        {data.map((d, i) => (
          <g key={`leg-${i}`} transform={`translate(220, ${10 + i * 22})`}>
            <rect x={0} y={0} width={10} height={10} fill={PIE_COLORS[i % PIE_COLORS.length]} rx={2} />
            <text x={16} y={9} fontSize={10} fill="var(--muted-foreground)">
              {d.name} ({d.count})
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function DashboardCharts({
  proposalStats,
  categoryStats,
}: {
  proposalStats: ProposalStats[];
  categoryStats: CategoryStats[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <Typography variant="h4" className="mb-4">КП по статусам</Typography>
        {proposalStats.length === 0 ? (
          <Muted className="text-center py-8">Нет данных</Muted>
        ) : (
          <div className="w-full overflow-x-auto">
            <SimpleBarChart data={proposalStats} />
          </div>
        )}
      </Card>

      <Card className="p-6">
        <Typography variant="h4" className="mb-4">Товары по категориям</Typography>
        {categoryStats.length === 0 ? (
          <Muted className="text-center py-8">Нет данных</Muted>
        ) : (
          <SimplePieChart data={categoryStats} />
        )}
      </Card>
    </div>
  );
}
