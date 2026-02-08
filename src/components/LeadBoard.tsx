'use client';

import { useState, useMemo } from 'react';
import type { CoffeeCard, CoffeeStats } from '@/lib/types';
import { VerticalFilter } from './VerticalFilter';
import { BrewButton } from './BrewButton';
import { LeadRow } from './LeadRow';
import { CardDetail } from './CardDetail';

interface LeadBoardProps {
  cards: CoffeeCard[];
  stats: CoffeeStats | null;
  onRefresh?: () => void;
}

type SortKey = 'score' | 'tcv' | 'broker' | 'tier';

const tierOrder: Record<string, number> = { priority: 0, growth: 1, opportunistic: 2, avoid: 3 };

export function LeadBoard({ cards, stats, onRefresh }: LeadBoardProps) {
  const [vertical, setVertical] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = vertical === 'all' ? cards : cards.filter((c) => c.vertical === vertical);

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.tenant_score - a.tenant_score;
        case 'tcv': return b.estimated_tcv - a.estimated_tcv;
        case 'broker': return b.broker_total - a.broker_total;
        case 'tier': return (tierOrder[a.tenant_tier] ?? 9) - (tierOrder[b.tenant_tier] ?? 9);
        default: return 0;
      }
    });

    return list;
  }, [cards, vertical, sortBy]);

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortBy(key)}
      className={`text-[0.55rem] tracking-wider cursor-pointer ${
        sortBy === key
          ? 'text-[var(--color-glow)] font-bold'
          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-3">
          <BrewButton onBrewed={onRefresh} />
          <VerticalFilter selected={vertical} onSelect={setVertical} />
        </div>
        <div className="text-[0.55rem] text-[var(--color-muted)]">
          {filtered.length} cards
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2rem_3.5rem_1fr_3rem_4.5rem_4.5rem_3rem_auto] items-center gap-2 px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        {sortBtn('tier', 'TIER')}
        <span className="text-[0.55rem] tracking-wider text-[var(--color-muted)]">VERT</span>
        <span className="text-[0.55rem] tracking-wider text-[var(--color-muted)]">PAIN</span>
        {sortBtn('score', 'SCORE')}
        {sortBtn('tcv', 'TCV')}
        {sortBtn('broker', 'BROKER$')}
        <span className="text-[0.55rem] tracking-wider text-[var(--color-muted)]">PLAY</span>
        <span className="text-[0.55rem] tracking-wider text-[var(--color-muted)]">STATUS</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[0.65rem] text-[var(--color-muted)]">
            No cards. Hit BREW to generate fresh leads.
          </div>
        ) : (
          filtered.map((card) => (
            <div key={card.id}>
              <LeadRow
                card={card}
                expanded={expandedId === card.id}
                onClick={() => setExpandedId(expandedId === card.id ? null : card.id)}
              />
              {expandedId === card.id && (
                <CardDetail card={card} onAction={onRefresh} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
