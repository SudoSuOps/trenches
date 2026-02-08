/** Format dollar amount: $1.2M, $45K, $900 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

/** Format compact number */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

/** Format relative time: "3m ago", "2h ago" */
export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** UTC time string: "21:04 UTC" */
export function formatUTC(): string {
  const now = new Date();
  return `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`;
}

/** Truncate string */
export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

/** Vertical display name */
export function verticalLabel(v: string): string {
  const map: Record<string, string> = {
    healthcare: 'HEALTH',
    agents_ai: 'AGENTS',
    legal: 'LEGAL',
    financial: 'FINANCE',
    creative: 'CREATIVE',
    research: 'RESEARCH',
    other: 'OTHER',
  };
  return map[v] || v.toUpperCase();
}

/** Playbook display label */
export function playbookLabel(p: string): string {
  const map: Record<string, string> = {
    grind: 'GRIND',
    double_pop: 'D-POP',
    fee_stream: 'F+S',
    loc: 'LOC',
    dark_box: 'DARK',
    walk_away: 'WALK',
  };
  return map[p] || p.toUpperCase();
}
