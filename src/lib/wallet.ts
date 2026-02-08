'use client';

import { BrowserProvider, namehash, Contract } from 'ethers';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const REGISTRY_ABI = [
  'function owner(bytes32 node) view returns (address)',
];

const PARENT_DOMAIN = 'swarmtrenches.eth';

/**
 * Connect wallet via MetaMask / injected provider.
 * Returns the connected address.
 */
export async function connectWallet(): Promise<{ address: string; provider: BrowserProvider }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected. Install MetaMask.');
  }

  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  const address = accounts[0] as string;
  return { address, provider };
}

/**
 * Check if an address owns a *.swarmtrenches.eth subdomain.
 * Returns the subdomain name if found, null otherwise.
 *
 * Strategy:
 * 1. Reverse-resolve the address to get its primary ENS name
 * 2. Check if it ends with .swarmtrenches.eth
 * 3. Also check if the address owns the parent domain directly
 */
export async function verifyENSAccess(
  address: string,
  provider: BrowserProvider
): Promise<{ authorized: boolean; ensName: string | null }> {
  try {
    // Check if address owns the parent domain (founder access)
    const registry = new Contract(ENS_REGISTRY, REGISTRY_ABI, provider);
    const parentNode = namehash(PARENT_DOMAIN);
    const parentOwner: string = await registry.owner(parentNode);

    if (parentOwner.toLowerCase() === address.toLowerCase()) {
      return { authorized: true, ensName: PARENT_DOMAIN };
    }

    // Try reverse lookup — get primary ENS name for this address
    const ensName = await provider.lookupAddress(address);
    if (ensName && ensName.endsWith(`.${PARENT_DOMAIN}`)) {
      // Verify forward resolution matches
      const resolved = await provider.resolveName(ensName);
      if (resolved && resolved.toLowerCase() === address.toLowerCase()) {
        return { authorized: true, ensName };
      }
    }

    // Check a list of known subdomains (can be expanded)
    // For now, check if they own any subdomain by checking the registry
    const knownBrokers = ['mitch', 'alpha', 'ops', 'dev'];
    for (const broker of knownBrokers) {
      const subdomain = `${broker}.${PARENT_DOMAIN}`;
      const node = namehash(subdomain);
      const owner: string = await registry.owner(node);
      if (owner.toLowerCase() === address.toLowerCase()) {
        return { authorized: true, ensName: subdomain };
      }
    }

    return { authorized: false, ensName: null };
  } catch (err) {
    console.error('ENS verification error:', err);
    return { authorized: false, ensName: null };
  }
}

/**
 * Get cached broker info from localStorage.
 */
export function getCachedBroker(): { address: string; ensName: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('swarmtrenches_broker');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

/**
 * Cache broker info to localStorage.
 */
export function cacheBroker(address: string, ensName: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('swarmtrenches_broker', JSON.stringify({ address, ensName }));
}

/**
 * Clear cached broker info.
 */
export function clearBrokerCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('swarmtrenches_broker');
}

// Extend Window for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
