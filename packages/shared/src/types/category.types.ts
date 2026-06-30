/**
 * Category Types - Shared across Backend, Mobile, and Web
 * Sprint 2 - US-015
 */

export enum Scope {
  HABITOS = 'habitos',
  TAREAS = 'tareas',
  EVENTOS = 'eventos',
  /**
   * @deprecated Bucket histórico de dinero. Migrado a EGRESOS (jun-2026). Se mantiene
   * en el enum por compatibilidad con datos legacy, pero NO se ofrece en la UI nueva.
   * Para categorías de dinero usar INGRESOS / EGRESOS.
   */
  GASTOS = 'gastos',
  INGRESOS = 'ingresos',
  EGRESOS = 'egresos',
  METAS = 'metas',
  KNOWLEDGE = 'knowledge',
  NUTRICION = 'nutricion',
}

/**
 * Scopes que se muestran en el gestor de categorías y en los selectores, en orden de
 * presentación. Excluye GASTOS (legacy). Usar esta lista en vez de `Object.values(Scope)`.
 */
export const MANAGED_SCOPES: Scope[] = [
  Scope.HABITOS,
  Scope.TAREAS,
  Scope.EVENTOS,
  Scope.INGRESOS,
  Scope.EGRESOS,
  Scope.METAS,
  Scope.KNOWLEDGE,
  Scope.NUTRICION,
];

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
  [Scope.INGRESOS]: 'Ingresos',
  [Scope.EGRESOS]: 'Egresos',
  [Scope.METAS]: 'Metas',
  [Scope.KNOWLEDGE]: 'Conocimiento',
  [Scope.NUTRICION]: 'Nutrición',
};

export const SCOPE_ICONS: Record<Scope, string> = {
  [Scope.HABITOS]: '🎯',
  [Scope.TAREAS]: '✅',
  [Scope.EVENTOS]: '📅',
  [Scope.GASTOS]: '💰',
  [Scope.INGRESOS]: '💵',
  [Scope.EGRESOS]: '💸',
  [Scope.METAS]: '🏆',
  [Scope.KNOWLEDGE]: '📚',
  [Scope.NUTRICION]: '🥗',
};
