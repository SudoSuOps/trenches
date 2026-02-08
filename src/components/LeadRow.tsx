'use client';

import type { CoffeeCard } from '@/lib/types';
import { TierBadge } from './TierBadge';
import { PlaybookBadge } from './PlaybookBadge';
import { getTierStyle } from '@/lib/theme';
import { formatCurrency, truncate, verticalLabel } from '@/lib/format';

interface LeadRowProps {
  card: CoffeeCard;
  expanded: boolean;
  onClick: () => void;
}

export function LeadRow({ card, expanded, onClick }: LeadRowProps) {
  const style = getTierStyle(card.tenant_tier);

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[2rem_3.5rem_1fr_3rem_4.5rem_4.5rem_3rem_auto] items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] cursor-pointer transition-colors hover:bg-[var(--color-surface-light)] ${
        expanded ? 'bg-[var(--color-surface-light)]' : ''
      } ${style.glow ? style.glow : ''}`}
    >
      {/* Tier */}
      <div>
        <TierBadge tier={card.tenant_tier} />
      </div>

      {/* Vertical */}
      <div className="text-[0.6rem] font-bold tracking-wider text-[var(--color-muted)]">
        {verticalLabel(card.vertical)}
      </div>

      {/* Pain summary */}
      <div className="text-[0.65rem] text-[var(--color-text)] truncate" title={card.pain_summary}>
        {truncate(card.pain_summary, 50)}
      </div>

      {/* Score */}
      <div className={`text-[0.65rem] font-bold text-right ${style.text}`}>
        {card.tenant_score.toFixed(1)}
      </div>

      {/* TCV */}
      <div className="text-[0.65rem] text-[var(--color-bright)] text-right font-bold">
        {formatCurrency(card.estimated_tcv)}
      </div>

      {/* Broker $ */}
      <div className="text-[0.65rem] text-[var(--color-glow)] text-right">
        {formatCurrency(card.broker_total)}
      </div>

      {/* Playbook */}
      <div>
        <PlaybookBadge playbook={card.recommended_playbook} />
      </div>

      {/* Status indicator */}
      <div className="text-[0.5rem] tracking-wider text-[var(--color-muted)] uppercase">
        {card.status}
      </div>
    </div>
  );
}
