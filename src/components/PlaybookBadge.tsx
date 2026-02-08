'use client';

import { playbookLabel } from '@/lib/format';

const playbookColors: Record<string, string> = {
  grind: 'text-[var(--color-glow)] border-[var(--color-glow)]/30',
  fee_stream: 'text-[var(--color-gold)] border-[var(--color-gold)]/30',
  loc: 'text-cyan-400 border-cyan-400/30',
  dark_box: 'text-purple-400 border-purple-400/30',
  double_pop: 'text-amber-400 border-amber-400/30',
  walk_away: 'text-neutral-500 border-neutral-500/30',
};

export function PlaybookBadge({ playbook }: { playbook: string }) {
  const color = playbookColors[playbook] || 'text-[var(--color-muted)] border-[var(--color-border)]';

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-bold tracking-wider border ${color}`}
    >
      {playbookLabel(playbook)}
    </span>
  );
}
