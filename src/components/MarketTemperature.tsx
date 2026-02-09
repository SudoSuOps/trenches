'use client';

import type { TrendSnapshot, PainTrend, VerticalHeat } from '@/lib/types';

interface MarketTemperatureProps {
  trends: TrendSnapshot | null;
}

const HEAT_COLORS: Record<string, string> = {
  hot: 'bg-red-500',
  warm: 'bg-amber-400',
  cool: 'bg-cyan-400',
  cold: 'bg-gray-500',
};

const HEAT_TEXT: Record<string, string> = {
  hot: 'text-red-400',
  warm: 'text-amber-400',
  cool: 'text-cyan-400',
  cold: 'text-gray-500',
};

function HeatDot({ heat }: { heat: string }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${HEAT_COLORS[heat] ?? HEAT_COLORS.cold}`}
    />
  );
}

function VerticalPill({ vh }: { vh: VerticalHeat }) {
  const textClass = HEAT_TEXT[vh.heat] ?? HEAT_TEXT.cold;
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
      <HeatDot heat={vh.heat} />
      <span className={`text-[0.55rem] font-bold tracking-wider uppercase ${textClass}`}>
        {vh.vertical.replace('_', ' ')}
      </span>
      <span className="text-[0.5rem] text-[var(--color-muted)]">{vh.signal_count}</span>
    </div>
  );
}

function TrendRow({ trend, rank }: { trend: PainTrend; rank: number }) {
  const momColor = trend.momentum > 0
    ? 'text-green-400'
    : trend.momentum < 0
      ? 'text-red-400'
      : 'text-[var(--color-muted)]';
  const momStr = `${trend.momentum > 0 ? '+' : ''}${trend.momentum.toFixed(0)}%`;

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[0.5rem] text-[var(--color-muted)] w-3 text-right">{rank}</span>
      <span className="text-[0.6rem] text-[var(--color-text)] truncate flex-1">
        {trend.pain_type.replace(/_/g, ' ')}
      </span>
      <span className="text-[0.5rem] text-[var(--color-muted)] w-8 text-right">
        {trend.signal_count}
      </span>
      <span className={`text-[0.5rem] w-8 text-right ${momColor}`}>
        {momStr}
      </span>
      {trend.solvable_by_swarm && (
        <span className="text-[0.45rem] px-1 py-px rounded bg-green-900/50 text-green-400 font-bold tracking-wider">
          SOLVE
        </span>
      )}
      {trend.is_emerging && (
        <span className="text-[0.45rem] px-1 py-px rounded bg-amber-900/50 text-amber-400 font-bold tracking-wider">
          NEW
        </span>
      )}
    </div>
  );
}

export function MarketTemperature({ trends }: MarketTemperatureProps) {
  if (!trends || !trends.trends?.length) return null;

  const verticals = Object.values(trends.verticals ?? {}).sort(
    (a, b) => b.signal_count - a.signal_count
  );

  const covColor = trends.fleet_coverage >= 60
    ? 'text-green-400'
    : trends.fleet_coverage >= 30
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)] font-bold">
            Market Temperature
          </span>
          <span className={`text-[0.5rem] font-bold ${covColor}`}>
            {trends.fleet_coverage.toFixed(0)}% fleet coverage
          </span>
        </div>
        <span className="text-[0.45rem] text-[var(--color-muted)]">
          {trends.window_days}d window
        </span>
      </div>

      {/* Vertical heat pills */}
      <div className="flex flex-wrap gap-1 mb-2">
        {verticals.map((vh) => (
          <VerticalPill key={vh.vertical} vh={vh} />
        ))}
      </div>

      {/* Top trending pain topics */}
      <div className="space-y-0">
        {trends.trends.slice(0, 5).map((t, i) => (
          <TrendRow key={`${t.pain_type}-${t.vertical}`} trend={t} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
