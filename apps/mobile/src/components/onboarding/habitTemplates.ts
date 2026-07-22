import type { CreateHabitDTO } from '@/services/api/habitApi';

/**
 * Plantillas de hábitos del onboarding. `categoryName` se resuelve contra las
 * categorías default de hábitos que crea el backend en el registro (Salud,
 * Productividad, Aprendizaje, Bienestar). `timeOfDay` usa las keys de los
 * momentos default (habitMoment.service): MANANA/TARDE/NOCHE/ANYTIME.
 */
export interface HabitTemplate extends Omit<CreateHabitDTO, 'categoryId'> {
  id: string;
  emoji: string;
  categoryName: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'agua',
    emoji: '💧',
    name: 'Tomar agua',
    categoryName: 'Salud',
    type: 'NUMERIC',
    targetValue: 8,
    unit: 'vasos',
    periodicity: 'DAILY',
    weekDays: [],
    timeOfDay: 'ANYTIME',
  },
  {
    id: 'caminar',
    emoji: '🚶',
    name: 'Caminar 30 minutos',
    categoryName: 'Salud',
    type: 'CHECK',
    periodicity: 'DAILY',
    weekDays: [],
    timeOfDay: 'MANANA',
  },
  {
    id: 'leer',
    emoji: '📖',
    name: 'Leer 10 páginas',
    categoryName: 'Aprendizaje',
    type: 'NUMERIC',
    targetValue: 10,
    unit: 'páginas',
    periodicity: 'DAILY',
    weekDays: [],
    timeOfDay: 'NOCHE',
  },
  {
    id: 'meditar',
    emoji: '🧘',
    name: 'Meditar',
    categoryName: 'Bienestar',
    type: 'CHECK',
    periodicity: 'DAILY',
    weekDays: [],
    timeOfDay: 'MANANA',
  },
  {
    id: 'planificar',
    emoji: '📝',
    name: 'Planificar el día',
    categoryName: 'Productividad',
    type: 'CHECK',
    periodicity: 'WEEKLY',
    weekDays: [1, 2, 3, 4, 5],
    timeOfDay: 'MANANA',
  },
  {
    id: 'entrenar',
    emoji: '💪',
    name: 'Entrenar',
    categoryName: 'Salud',
    type: 'CHECK',
    periodicity: 'WEEKLY',
    weekDays: [1, 3, 5],
    timeOfDay: 'ANYTIME',
  },
];
