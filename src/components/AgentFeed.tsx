'use client';

import type { AgentAction } from '@/lib/types';
import { formatTimeAgo } from '@/lib/format';

interface AgentFeedProps {
  actions: AgentAction[];
}

const agentColors: Record<string, string> = {
  qualifier: 'text-cyan-400',
  x_outreach: 'text-purple-400',
};

export function AgentFeed({ actions }: AgentFeedProps) {
  if (actions.length === 0) {
    return (
      <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-deep)]">
        <span className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)]">
          AGENT FEED — waiting for agent activity
        </span>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-deep)]">
      <div className="px-4 py-1.5">
        <span className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)]">
          AGENT FEED
        </span>
      </div>
      <div className="max-h-24 overflow-y-auto">
        {actions.slice(0, 10).map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 px-4 py-1 text-[0.6rem] animate-slide-in"
          >
            <span className={`font-bold tracking-wider ${agentColors[a.agent] || 'text-[var(--color-muted)]'}`}>
              [{a.agent}]
            </span>
            <span className="text-[var(--color-text)] truncate">{a.detail}</span>
            <span className="text-[var(--color-muted)] ml-auto shrink-0">{formatTimeAgo(a.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
