'use client';

import { MetricCard } from './MetricCard';
import { formatCurrency } from '@/lib/format';
import type { CoffeeCard, CoffeeStats } from '@/lib/types';

interface PipelineBannerProps {
  cards: CoffeeCard[];
  stats: CoffeeStats | null;
}

export function PipelineBanner({ cards, stats }: PipelineBannerProps) {
  const totalTCV = stats?.total_tcv ?? cards.reduce((s, c) => s + c.estimated_tcv, 0);
  const totalBroker = stats?.total_broker_value ?? cards.reduce((s, c) => s + c.broker_total, 0);
  const activeCount = cards.filter(c => c.status !== 'expired' && c.status !== 'converted').length;
  const priorityCount = cards.filter(c => c.tenant_tier === 'priority').length;
  const freshCount = cards.filter(c => c.status === 'fresh').length;

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <MetricCard label="TCV" value={formatCurrency(totalTCV)} accent />
      <div className="w-px h-6 bg-[var(--color-border)]" />
      <MetricCard label="BROKER $" value={formatCurrency(totalBroker)} />
      <div className="w-px h-6 bg-[var(--color-border)]" />
      <MetricCard label="ACTIVE" value={String(activeCount)} />
      <div className="w-px h-6 bg-[var(--color-border)]" />
      <MetricCard label="PRIORITY" value={String(priorityCount)} />
      <div className="w-px h-6 bg-[var(--color-border)]" />
      <MetricCard label="FRESH" value={String(freshCount)} />
    </div>
  );
}
