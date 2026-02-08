'use client';

import { useState } from 'react';
import { postTrenches } from '@/lib/api';

interface ActionBarProps {
  cardId: string;
  status: string;
  onAction?: () => void;
}

export function ActionBar({ cardId, status, onAction }: ActionBarProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const doAction = async (action: string, endpoint: string, body?: Record<string, unknown>) => {
    setLoading(action);
    await postTrenches(endpoint, body);
    setLoading(null);
    onAction?.();
  };

  const actions = [
    {
      label: 'PROMOTE',
      key: 'promote',
      show: status === 'fresh' || status === 'assigned',
      action: () => doAction('promote', `/api/trenches/card/${cardId}/promote`),
    },
    {
      label: 'CONTACTED',
      key: 'contacted',
      show: status !== 'contacted' && status !== 'converted' && status !== 'expired',
      action: () => doAction('contacted', `/api/trenches/card/${cardId}/status`, { status: 'contacted' }),
    },
    {
      label: 'DRAFT X',
      key: 'draft_x',
      show: true,
      action: () => doAction('draft_x', `/api/trenches/agents/x-draft`, { card_id: cardId }),
      accent: true,
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {actions
        .filter((a) => a.show)
        .map((a) => (
          <button
            key={a.key}
            onClick={a.action}
            disabled={loading === a.key}
            className={`px-2 py-0.5 rounded text-[0.55rem] font-bold tracking-wider border cursor-pointer transition-all active:scale-95 ${
              a.accent
                ? 'border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10'
                : 'border-[var(--color-border-light)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-glow)]/30'
            } ${loading === a.key ? 'opacity-50 cursor-wait' : ''}`}
          >
            {loading === a.key ? '...' : a.label}
          </button>
        ))}
    </div>
  );
}
