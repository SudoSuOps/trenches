'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTrenches } from './api';
import type { CoffeeCard, CoffeeStats, AgentAction, SSEPayload, TrendSnapshot } from './types';

// ---------------------------------------------------------------------------
// Generic polling hook
// ---------------------------------------------------------------------------

export function usePolling<T>(path: string, intervalMs: number): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      const result = await fetchTrenches<T>(path);
      if (active) {
        setData(result);
        setLoading(false);
      }
    };

    poll();
    const id = setInterval(poll, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [path, intervalMs]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// SSE hook
// ---------------------------------------------------------------------------

export function useSSE(path: string): { data: SSEPayload | null; connected: boolean } {
  const [data, setData] = useState<SSEPayload | null>(null);
  const [connected, setConnected] = useState(false);
  const retryRef = useRef(0);

  useEffect(() => {
    let es: EventSource | null = null;
    let active = true;

    const connect = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      es = new EventSource(`${apiUrl}${path}`);

      es.addEventListener('trenches', (e) => {
        if (!active) return;
        try {
          setData(JSON.parse(e.data));
          setConnected(true);
          retryRef.current = 0;
        } catch { /* ignore parse errors */ }
      });

      es.onerror = () => {
        setConnected(false);
        es?.close();
        if (active) {
          const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
          retryRef.current++;
          setTimeout(connect, delay);
        }
      };

      es.onopen = () => setConnected(true);
    };

    connect();
    return () => { active = false; es?.close(); };
  }, [path]);

  return { data, connected };
}

// ---------------------------------------------------------------------------
// Combined trenches data hook
// ---------------------------------------------------------------------------

export function useTrenchData() {
  const { data: sseData, connected } = useSSE('/api/trenches/stream');

  // Fallback polling when SSE disconnects
  const { data: cards, loading: cardsLoading } = usePolling<CoffeeCard[]>(
    '/api/trenches/cards', connected ? 120000 : 15000
  );
  const { data: stats } = usePolling<CoffeeStats>(
    '/api/trenches/stats', connected ? 120000 : 30000
  );
  const { data: agentFeed } = usePolling<AgentAction[]>(
    '/api/trenches/agents/feed', connected ? 120000 : 15000
  );
  const { data: trends } = usePolling<TrendSnapshot>(
    '/api/trenches/trends?limit=10', connected ? 120000 : 60000
  );

  return {
    connected,
    cards: sseData?.cards ?? cards ?? [],
    stats: sseData?.stats ?? stats ?? null,
    agents: sseData?.agents ?? agentFeed ?? [],
    trends: sseData?.trends ?? trends ?? null,
    loading: cardsLoading,
    timestamp: sseData?.timestamp ?? null,
  };
}

// ---------------------------------------------------------------------------
// Utility hooks
// ---------------------------------------------------------------------------

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}
