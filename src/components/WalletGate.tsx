'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  verifyENSAccess,
  getCachedBroker,
  cacheBroker,
  clearBrokerCache,
} from '@/lib/wallet';

interface WalletGateProps {
  children: (props: { ensName: string; onDisconnect: () => void }) => React.ReactNode;
  devMode?: boolean;
}

export function WalletGate({ children, devMode }: WalletGateProps) {
  const [state, setState] = useState<'idle' | 'connecting' | 'verifying' | 'denied' | 'authorized'>(
    devMode ? 'authorized' : 'idle'
  );
  const [ensName, setEnsName] = useState<string | null>(devMode ? 'dev.swarmtrenches.eth' : null);
  const [error, setError] = useState<string | null>(null);

  // Check cached broker on mount (non-dev mode)
  useEffect(() => {
    if (devMode) return;
    const cached = getCachedBroker();
    if (cached) {
      setState('authorized');
      setEnsName(cached.ensName);
    }
  }, [devMode]);

  const connect = useCallback(async () => {
    setState('connecting');
    setError(null);

    try {
      const { address, provider } = await connectWallet();
      setState('verifying');

      const result = await verifyENSAccess(address, provider);

      if (result.authorized && result.ensName) {
        cacheBroker(address, result.ensName);
        setEnsName(result.ensName);
        setState('authorized');
      } else {
        setState('denied');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setState('idle');
    }
  }, []);

  const disconnect = useCallback(() => {
    clearBrokerCache();
    setEnsName(null);
    setState('idle');
  }, []);

  if (state === 'authorized' && ensName) {
    return <>{children({ ensName, onDisconnect: disconnect })}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-void)]">
      <div className="max-w-sm w-full mx-4 text-center space-y-6">
        {/* Logo */}
        <div>
          <div className="text-2xl font-bold text-[var(--color-glow)] glow-text tracking-wider mb-1">
            SWARMTRENCHES
          </div>
          <div className="text-[0.6rem] tracking-[0.2em] text-[var(--color-muted)] uppercase">
            Compute Broker War Room
          </div>
        </div>

        {state === 'denied' ? (
          <div className="space-y-4">
            <div className="trench-panel border-red-500/30">
              <div className="text-red-400 text-sm font-bold tracking-wider mb-2">
                ACCESS DENIED
              </div>
              <div className="text-[0.65rem] text-[var(--color-muted)] leading-relaxed">
                Your wallet does not own a <span className="text-[var(--color-text)]">*.swarmtrenches.eth</span> subdomain.
                Contact the operator to get your ENS and enter the trenches.
              </div>
            </div>
            <button
              onClick={() => setState('idle')}
              className="text-[0.6rem] text-[var(--color-muted)] hover:text-[var(--color-text)] tracking-wider cursor-pointer"
            >
              TRY DIFFERENT WALLET
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={connect}
              disabled={state === 'connecting' || state === 'verifying'}
              className="w-full py-3 rounded border border-[var(--color-glow)]/40 text-[var(--color-glow)] font-bold text-sm tracking-wider cursor-pointer hover:bg-[var(--color-glow)]/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {state === 'connecting' && 'CONNECTING WALLET...'}
              {state === 'verifying' && 'VERIFYING ENS...'}
              {state === 'idle' && 'CONNECT WALLET'}
            </button>

            {error && (
              <div className="text-[0.6rem] text-red-400">{error}</div>
            )}

            <div className="text-[0.55rem] text-[var(--color-muted)] leading-relaxed">
              Requires <span className="text-[var(--color-text)]">*.swarmtrenches.eth</span> subdomain ownership.
              <br />MetaMask or WalletConnect supported.
            </div>
          </div>
        )}

        <div className="text-[0.5rem] text-[var(--color-border-light)] tracking-[0.2em]">
          CLOSE OR STARVE
        </div>
      </div>
    </div>
  );
}
