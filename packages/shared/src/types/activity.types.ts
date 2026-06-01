export enum ActivityPeriodicity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum ActivityTimeMode {
  FIXED = 'FIXED',
  AFTER_ACTIVITY = 'AFTER_ACTIVITY',
}

export interface ActivityRecord {
  id: string;
  activityId: string;
  userId: string;
  date: string;
  completed: boolean;
  completedAt?: string | null;
  skipped: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  content?: string | null;
  periodicity: ActivityPeriodicity;
  weekDays: number[];
  timesPerMonth?: number | null;
  timeMode: ActivityTimeMode;
  fixedHour?: number | null;
  fixedMinute?: number | null;
  afterActivityId?: string | null;
  afterActivity?: { id: string; name: string } | null;
  durationMinutes?: number | null;
  emoji?: string | null;
  color?: string | null;
  order: number;
  isActive: boolean;
  record?: ActivityRecord | null;
  monthlyCompletions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityDTO {
  name: string;
  description?: string;
  content?: string;
  periodicity: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  weekDays: number[];
  timesPerMonth?: number | null;
  timeMode: 'FIXED' | 'AFTER_ACTIVITY';
  fixedHour?: number | null;
  fixedMinute?: number | null;
  afterActivityId?: string | null;
  durationMinutes?: number | null;
  emoji?: string;
  color?: string;
  order?: number;
}

export type UpdateActivityDTO = Partial<CreateActivityDTO>;

export interface ToggleActivityRecordDTO {
  date: string;
  completed: boolean;
  skipped?: boolean;
  notes?: string | null;
}

// Keep the Activity response type using enums for backend consistency
// but DTOs use string literals for form/API compatibility
