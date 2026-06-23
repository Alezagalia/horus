import type { MuscleGroup } from '@/services/api/exerciseApi';

/** Muscle group filter chips. `undefined` key = "Todos" (no filter). */
export const MUSCLE_GROUPS: Array<{ key: MuscleGroup | undefined; label: string }> = [
  { key: undefined, label: 'Todos' },
  { key: 'pecho', label: 'Pecho' },
  { key: 'espalda', label: 'Espalda' },
  { key: 'piernas', label: 'Piernas' },
  { key: 'hombros', label: 'Hombros' },
  { key: 'brazos', label: 'Brazos' },
  { key: 'core', label: 'Core' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'otro', label: 'Otro' },
];

export const MUSCLE_GROUP_LABELS: Partial<Record<MuscleGroup, string>> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  piernas: 'Piernas',
  hombros: 'Hombros',
  brazos: 'Brazos',
  core: 'Core',
  cardio: 'Cardio',
  otro: 'Otro',
};
