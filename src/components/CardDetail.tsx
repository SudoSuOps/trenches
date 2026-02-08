'use client';

import type { CoffeeCard } from '@/lib/types';
import { EconomicsBreakdown } from './EconomicsBreakdown';
import { ActionBar } from './ActionBar';

interface CardDetailProps {
  card: CoffeeCard;
  onAction?: () => void;
}

export function CardDetail({ card, onAction }: CardDetailProps) {
  return (
    <div className="animate-slide-in px-4 py-3 bg-[var(--color-deep)] border-t border-[var(--color-border)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pitch */}
        <div className="md:col-span-1 space-y-2">
          <div className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)]">
            PITCH ANGLE
          </div>
          <div className="text-[0.7rem] text-[var(--color-text)] leading-relaxed">
            {card.pitch_angle}
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)]">
              PROSPECT
            </div>
            <div className="text-[0.65rem] text-[var(--color-text)]">
              {card.persona} / {card.company_type}
            </div>
            <div className="text-[0.65rem] text-[var(--color-muted)]">
              {card.inferred_gpu_count}x {card.inferred_gpu_type} / {card.inferred_duration_months}mo
            </div>
          </div>
        </div>

        {/* Economics */}
        <div className="md:col-span-1">
          <EconomicsBreakdown card={card} />
        </div>

        {/* Next Action + Actions */}
        <div className="md:col-span-1 space-y-3">
          <div>
            <div className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)]">
              NEXT ACTION
            </div>
            <div className="text-[0.65rem] text-[var(--color-glow)] mt-1">
              {card.next_action}
            </div>
          </div>
          <ActionBar cardId={card.id} status={card.status} onAction={onAction} />
          {card.source_urls && (
            <div className="mt-2">
              <div className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)]">
                SOURCES
              </div>
              <div className="text-[0.6rem] text-[var(--color-muted)] mt-0.5 break-all">
                {(() => {
                  try {
                    const urls = JSON.parse(card.source_urls);
                    return urls.slice(0, 3).map((u: string, i: number) => (
                      <a
                        key={i}
                        href={u}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:text-[var(--color-text)] truncate"
                      >
                        {u}
                      </a>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
