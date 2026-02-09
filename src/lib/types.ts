/* SwarmTrenches type definitions — matches Heph coffee card model */

export type TenantTier = 'priority' | 'growth' | 'opportunistic' | 'avoid';
export type CardStatus = 'fresh' | 'assigned' | 'contacted' | 'converted' | 'expired';
export type Playbook = 'grind' | 'double_pop' | 'fee_stream' | 'loc' | 'dark_box' | 'walk_away';
export type Vertical = 'healthcare' | 'agents_ai' | 'legal' | 'financial' | 'creative' | 'research' | 'other';

export interface CoffeeCard {
  id: string;
  created_at: string;
  pain_claim_ids: string;     // JSON array
  pain_summary: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source_urls: string;        // JSON array
  vertical: string;
  persona: string;
  company_type: string;
  inferred_gpu_type: string;
  inferred_gpu_count: number;
  inferred_duration_months: number;
  tenant_score: number;
  tenant_tier: string;
  monthly_revenue: number;
  estimated_tcv: number;
  broker_fee: number;
  broker_stream: number;
  broker_total: number;
  pitch_angle: string;
  recommended_playbook: string;
  next_action: string;
  status: CardStatus;
  expires_at: string | null;
  deal_id?: number | null;
  // Market intelligence (Pain Trend Engine)
  demand_volume?: number;
  trend_momentum?: number;
  solvability?: string | null;
  market_action?: string | null;
}

export interface CoffeeStats {
  total_cards: number;
  by_status: Record<string, number>;
  by_vertical: Record<string, number>;
  by_tier: Record<string, number>;
  total_tcv: number;
  total_broker_value: number;
  graph?: {
    total_claims: number;
    pain_claims: number;
    sources: Record<string, number>;
  };
}

export interface BrewResult {
  brewed: number;
  total_broker_value: number;
  by_vertical: Record<string, number>;
}

export interface AgentAction {
  id: string;
  agent: 'qualifier' | 'x_outreach';
  action: string;
  detail: string;
  timestamp: string;
  card_id?: string;
}

export interface XDraft {
  id: string;
  card_id: string;
  text: string;
  status: 'draft' | 'approved' | 'posted';
  created_at: string;
}

export interface PainTrend {
  pain_type: string;
  vertical: string;
  signal_count: number;
  velocity: number;
  momentum: number;
  composite_score: number;
  is_emerging: boolean;
  solvable_by_swarm: boolean;
  solvability_detail: string;
  market_action: string;
  avg_confidence: number;
  top_claims: string[];
}

export interface VerticalHeat {
  vertical: string;
  signal_count: number;
  velocity: number;
  momentum: number;
  heat: 'hot' | 'warm' | 'cool' | 'cold';
}

export interface TrendSnapshot {
  trends: PainTrend[];
  verticals: Record<string, VerticalHeat>;
  fleet_coverage: number;
  window_days: number;
  generated_at: string;
}

export interface SSEPayload {
  timestamp: string;
  cards: CoffeeCard[];
  stats: CoffeeStats;
  agents: AgentAction[];
  trends?: TrendSnapshot;
}
