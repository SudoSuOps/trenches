'use client';

import { StatusDot } from './StatusDot';
import { formatUTC } from '@/lib/format';
import { useEffect, useState } from 'react';

interface TrenchNavProps {
  ensName: string | null;
  connected: boolean;
  onDisconnect: () => void;
}

export function TrenchNav({ ensName, connected, onDisconnect }: TrenchNavProps) {
  const [time, setTime] = useState(formatUTC());

  useEffect(() => {
    const id = setInterval(() => setTime(formatUTC()), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-deep)]">
      <div className="flex items-center gap-3">
        <span className="text-[var(--color-glow)] font-bold text-sm tracking-wider glow-text">
          TRENCHES
        </span>
        {ensName && (
          <button
            onClick={onDisconnect}
            className="text-[0.65rem] text-[var(--color-text)] hover:text-[var(--color-bright)] tracking-wide cursor-pointer"
            title="Click to disconnect"
          >
            {ensName}
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <StatusDot connected={connected} />
        <span className="text-[0.6rem] text-[var(--color-muted)] tracking-widest">{time}</span>
      </div>
    </header>
  );
}
