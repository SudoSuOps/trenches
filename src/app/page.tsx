'use client';

import { WalletGate } from '@/components/WalletGate';
import { TrenchNav } from '@/components/TrenchNav';
import { PipelineBanner } from '@/components/PipelineBanner';
import { MarketTemperature } from '@/components/MarketTemperature';
import { LeadBoard } from '@/components/LeadBoard';
import { AgentFeed } from '@/components/AgentFeed';
import { useTrenchData } from '@/lib/hooks';

function Showroom({ ensName, onDisconnect }: { ensName: string; onDisconnect: () => void }) {
  const { connected, cards, stats, agents, trends, loading } = useTrenchData();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-void)]">
      <TrenchNav ensName={ensName} connected={connected} onDisconnect={onDisconnect} />
      <PipelineBanner cards={cards} stats={stats} />
      <MarketTemperature trends={trends} />

      {loading && cards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[0.65rem] text-[var(--color-muted)] tracking-wider animate-breathe">
            LOADING PIPELINE...
          </div>
        </div>
      ) : (
        <LeadBoard cards={cards} stats={stats} />
      )}

      <AgentFeed actions={agents} />

      <footer className="px-4 py-1.5 border-t border-[var(--color-border)] bg-[var(--color-deep)] text-center">
        <span className="text-[0.45rem] tracking-[0.2em] text-[var(--color-border-light)] uppercase">
          Close or Starve
        </span>
      </footer>
    </div>
  );
}

export default function Page() {
  // Enable dev mode when NEXT_PUBLIC_DEV_MODE is set (bypasses ENS gate)
  const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  return (
    <WalletGate devMode={devMode}>
      {({ ensName, onDisconnect }) => (
        <Showroom ensName={ensName} onDisconnect={onDisconnect} />
      )}
    </WalletGate>
  );
}
