/**
 * Category Types - Shared across Backend, Mobile, and Web
 * Sprint 2 - US-015
 */

export enum Scope {
  HABITOS = 'habitos',
  TAREAS = 'tareas',
  EVENTOS = 'eventos',
  GASTOS = 'gastos',
  METAS = 'metas',
  KNOWLEDGE = 'knowledge',
  NUTRICION = 'nutricion',
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  scope: Scope;
  icon?: string;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDTO {
  name: string;
  scope: Scope;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  icon?: string;
  color?: string;
}

export interface CategoryFilters {
  scope?: Scope;
}

export const SCOPE_LABELS: Record<Scope, string> = {
  [Scope.HABITOS]: 'Hábitos',
  [Scope.TAREAS]: 'Tareas',
  [Scope.EVENTOS]: 'Eventos',
  [Scope.GASTOS]: 'Gastos',
  [Scope.METAS]: 'Metas',
  [Scope.KNOWLEDGE]: 'Conocimiento',
  [Scope.NUTRICION]: 'Nutrición',
};

export const SCOPE_ICONS: Record<Scope, string> = {
  [Scope.HABITOS]: '🎯',
  [Scope.TAREAS]: '✅',
  [Scope.EVENTOS]: '📅',
  [Scope.GASTOS]: '💰',
  [Scope.METAS]: '🏆',
  [Scope.KNOWLEDGE]: '📚',
  [Scope.NUTRICION]: '🥗',
};
