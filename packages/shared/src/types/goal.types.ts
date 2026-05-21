/**
 * Goal & OKR Shared Types
 * F-02 - Metas y Objetivos
 */

export type GoalStatus = 'en_progreso' | 'completada' | 'cancelada';
export type GoalPriority = 'alta' | 'media' | 'baja';

export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface Goal {
  id: string;
  userId: string;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate?: string | null;
  completedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: GoalCategory | null;
  keyResults?: KeyResult[];
}

export interface GoalLinkedHabit {
  habitId: string;
  habit: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    lastCompletedDate?: string | null;
  };
}

export interface GoalLinkedTask {
  taskId: string;
  task: { id: string; title: string; status: string; priority?: string; dueDate?: string | null };
}

export interface GoalWithProgress extends Goal {
  progress: number;
  linkedHabitsCount: number;
  linkedTasksCount: number;
  goalHabits?: GoalLinkedHabit[];
  goalTasks?: GoalLinkedTask[];
}

export interface CreateGoalDTO {
  title: string;
  description?: string;
  categoryId?: string;
  priority?: GoalPriority;
  targetDate?: string;
}

export interface UpdateGoalDTO extends Partial<CreateGoalDTO> {
  status?: GoalStatus;
}

export interface CreateKeyResultDTO {
  title: string;
  targetValue: number;
  currentValue?: number;
  unit?: string;
}

export type UpdateKeyResultDTO = Partial<CreateKeyResultDTO>;

export interface GoalsResponse {
  message: string;
  goals: GoalWithProgress[];
  count: number;
}

export interface GoalResponse {
  message: string;
  goal: GoalWithProgress;
}

export interface KeyResultResponse {
  message: string;
  keyResult: KeyResult;
}
