'use client';

import { formatCurrency } from '@/lib/format';
import type { CoffeeCard } from '@/lib/types';

export function EconomicsBreakdown({ card }: { card: CoffeeCard }) {
  const items = [
    { label: 'TCV', value: card.estimated_tcv },
    { label: 'MONTHLY', value: card.monthly_revenue },
    { label: 'FEE', value: card.broker_fee },
    { label: 'STREAM', value: card.broker_stream },
    { label: 'TOTAL BROKER', value: card.broker_total, accent: true },
  ];

  return (
    <div className="space-y-1.5">
      <div className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)]">
        ECONOMICS
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-[0.65rem]">
          <span className="text-[var(--color-muted)]">{item.label}</span>
          <span className={item.accent ? 'text-[var(--color-glow)] font-bold glow-text-subtle' : 'text-[var(--color-text)]'}>
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}

      {/* Visual bar */}
      <div className="mt-2 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-glow)] rounded-full transition-all duration-700"
          style={{ width: `${Math.min((card.broker_total / Math.max(card.estimated_tcv, 1)) * 100, 100)}%` }}
        />
      </div>
      <div className="text-[0.5rem] text-[var(--color-muted)] text-right">
        {((card.broker_total / Math.max(card.estimated_tcv, 1)) * 100).toFixed(1)}% capture
      </div>
    </div>
  );
}
