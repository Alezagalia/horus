/**
 * Timeline Types
 * F-16 - Arqueología Personal
 * Sprint 16 - US-151
 */

export type TimelineModule = 'habits' | 'tasks' | 'workouts' | 'goals' | 'finance' | 'resources';

export type TimelineEventCategory =
  | 'first' // primera vez en un dominio
  | 'completed' // hito de cierre (meta completada, racha alcanzada)
  | 'anniversary' // aniversario exacto (1m, 3m, 6m, 1y, 2y...)
  | 'milestone'; // número redondo (100, 500, 1000)

export interface TimelineEventEntity {
  type: TimelineModule;
  id: string;
  name?: string;
}

export interface TimelineEventAnniversary {
  yearsAgo?: number;
  monthsAgo?: number;
}

export interface TimelineEvent {
  id: string; // stable: `${category}.${kind}.${entityId}` — used for React keys
  module: TimelineModule;
  category: TimelineEventCategory;
  kind: string; // ej: 'habit.created', 'goal.completed', 'tasks.100'
  date: string; // ISO date YYYY-MM-DD of the original event
  title: string; // user-facing text in es-AR
  description?: string;
  entity?: TimelineEventEntity;
  anniversary?: TimelineEventAnniversary;
}

export interface TimelineResponse {
  events: TimelineEvent[]; // descending by date
  total: number;
  hasMore: boolean;
}

export const TIMELINE_MODULES: readonly TimelineModule[] = [
  'habits',
  'tasks',
  'workouts',
  'goals',
  'finance',
  'resources',
] as const;

export const TIMELINE_CATEGORIES: readonly TimelineEventCategory[] = [
  'first',
  'completed',
  'anniversary',
  'milestone',
] as const;
