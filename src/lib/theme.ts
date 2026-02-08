/** Tier → color mapping */
export const tierColors: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  priority: {
    border: 'border-red-500/40',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    glow: 'glow-priority',
  },
  growth: {
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    glow: 'glow-growth',
  },
  opportunistic: {
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    glow: 'glow-opportunistic',
  },
  avoid: {
    border: 'border-neutral-600/40',
    text: 'text-neutral-500',
    bg: 'bg-neutral-500/10',
    glow: '',
  },
};

/** Tier short label */
export const tierLabel: Record<string, string> = {
  priority: 'P',
  growth: 'G',
  opportunistic: 'O',
  avoid: 'A',
};

/** Status colors */
export const statusColors: Record<string, string> = {
  fresh: 'text-[var(--color-glow)]',
  assigned: 'text-amber-400',
  contacted: 'text-cyan-400',
  converted: 'text-emerald-400',
  expired: 'text-neutral-500',
};

/** Get tier color config, defaulting to avoid */
export function getTierStyle(tier: string) {
  return tierColors[tier.toLowerCase()] || tierColors.avoid;
}
