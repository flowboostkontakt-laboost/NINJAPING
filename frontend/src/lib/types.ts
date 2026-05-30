export type PulseType = "BUY" | "HYPE" | "DUMP" | "VOLUME";
export type Persona = "standard" | "shadow";

export interface PulseMetrics {
  vol: string;
  social_velocity: string;
  platform: string;
  price_change: string;
  whale_size?: string | null;
  social_source?: "cryptopanic" | "coingecko" | "sim";
  social_live?: boolean;
}

export interface PulseTrigger {
  rule: string;
  metric: string;
  observed: number;
  baseline: number;
  threshold: number;
  unit: string; // "x" | "%" | "$"
  divergence: string;
}

export interface Pulse {
  id: string;
  created_at: string;
  type: PulseType;
  token: string;
  ai_report: string;
  metrics: PulseMetrics;
  trigger?: PulseTrigger | null;
  entry_price?: number | null;
  status?: "RUNNING" | "HIT" | "MISS";
  move_pct?: number | null;
  graded_at?: string | null;
  proof_hash?: string | null;
  proof_anchor?: string | null;
  degen_score: number; // 0 = smart money, 100 = pure degen
  persona: Persona;
  keywords: string[];
  raw?: Record<string, unknown>;
}

export interface TrendingToken {
  token: string;
  name: string;
  price: number;
  price_change_1h: number;
  ai_score: number;
  source: string;
  synthetic: boolean;
}

export interface FeedStats {
  total_detected: number;
  in_feed: number;
  subscribers: number;
  distribution: Record<string, number>;
}

export interface Scorecard {
  graded: number;
  hits: number;
  misses: number;
  running: number;
  hit_rate: number | null;
  avg_move: number | null;
}

export interface StatsResponse {
  feed: FeedStats;
  trending: TrendingToken[];
  scorecard: Scorecard;
}

export interface StatusResponse {
  agent: string;
  persona: Persona;
  next_scan_in: number;
  scan_interval: number;
  chain_height: number | null;
  llm_provider: string;
  tracked_tokens: string[];
}

export interface NftCheckResponse {
  wallet: string;
  is_holder: boolean;
  balance: number;
  contract: string | null;
  mode: "live" | "disabled";
}

export interface RaidResponse {
  text: string;
  intent_url: string;
  pulse_id: string;
}
