'use client';

import { useState } from 'react';
import { postTrenches } from '@/lib/api';
import type { BrewResult } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface BrewButtonProps {
  onBrewed?: () => void;
}

export function BrewButton({ onBrewed }: BrewButtonProps) {
  const [brewing, setBrewing] = useState(false);
  const [result, setResult] = useState<BrewResult | null>(null);

  const brew = async () => {
    setBrewing(true);
    setResult(null);
    const res = await postTrenches<BrewResult>('/api/trenches/brew', {});
    setBrewing(false);
    if (res) {
      setResult(res);
      onBrewed?.();
      // Auto-dismiss toast after 4s
      setTimeout(() => setResult(null), 4000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={brew}
        disabled={brewing}
        className={`px-3 py-1 rounded text-[0.65rem] font-bold tracking-wider border cursor-pointer transition-all ${
          brewing
            ? 'border-[var(--color-border)] text-[var(--color-muted)] cursor-wait'
            : 'border-[var(--color-glow)]/40 text-[var(--color-glow)] hover:bg-[var(--color-glow)]/10 active:scale-95'
        }`}
      >
        {brewing ? 'BREWING...' : 'BREW'}
      </button>

      {result && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 rounded border border-[var(--color-glow)]/30 bg-[var(--color-surface)] text-[0.6rem] animate-slide-in whitespace-nowrap z-50">
          <span className="text-[var(--color-glow)]">{result.brewed} cards brewed</span>
          <span className="text-[var(--color-muted)] ml-2">
            {formatCurrency(result.total_broker_value)} broker value
          </span>
        </div>
      )}
    </div>
  );
}
