/**
 * Insight Types
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 */

export type InsightSeverity = 'positive' | 'neutral' | 'negative';

export interface Insight {
  id: string;
  kind: string; // detector identifier — e.g. 'productivity.worst-dow'
  title: string;
  description: string;
  severity: InsightSeverity;
  data: Record<string, unknown>; // detector-specific metrics
  detectedAt: string; // ISO datetime
  seenAt: string | null;
  dismissedAt: string | null;
}

export interface InsightsResponse {
  insights: Insight[];
  notEnoughData: boolean; // true when user has < 60 days of activity
  daysOfData: number;
}

export const INSIGHT_SEVERITIES: readonly InsightSeverity[] = [
  'positive',
  'neutral',
  'negative',
] as const;
