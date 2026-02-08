'use client';

export function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[0.6rem] tracking-widest uppercase">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          connected
            ? 'bg-[var(--color-glow)] animate-dot-blink'
            : 'bg-red-500'
        }`}
      />
      {connected ? 'LIVE' : 'OFFLINE'}
    </span>
  );
}
