'use client';

interface MetricCardProps {
  label: string;
  value: string;
  accent?: boolean;
}

export function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3">
      <span
        className={`text-base font-bold tracking-tight ${
          accent ? 'text-[var(--color-glow)] glow-text-subtle' : 'text-[var(--color-bright)]'
        }`}
      >
        {value}
      </span>
      <span className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--color-muted)]">
        {label}
      </span>
    </div>
  );
}
