'use client';

import { verticalLabel } from '@/lib/format';

const VERTICALS = ['all', 'healthcare', 'agents_ai', 'legal', 'financial', 'creative', 'research'] as const;

interface VerticalFilterProps {
  selected: string;
  onSelect: (v: string) => void;
}

export function VerticalFilter({ selected, onSelect }: VerticalFilterProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {VERTICALS.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={`px-2 py-0.5 rounded text-[0.6rem] tracking-wider font-bold border transition-colors cursor-pointer ${
            selected === v
              ? 'border-[var(--color-glow)]/40 text-[var(--color-glow)] bg-[var(--color-glow)]/10'
              : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-light)]'
          }`}
        >
          {v === 'all' ? 'ALL' : verticalLabel(v)}
        </button>
      ))}
    </div>
  );
}
