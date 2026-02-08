'use client';

import { getTierStyle, tierLabel } from '@/lib/theme';

export function TierBadge({ tier }: { tier: string }) {
  const style = getTierStyle(tier);
  const label = tierLabel[tier.toLowerCase()] || '?';

  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded text-[0.65rem] font-bold border ${style.border} ${style.text} ${style.bg}`}
    >
      {label}
    </span>
  );
}
