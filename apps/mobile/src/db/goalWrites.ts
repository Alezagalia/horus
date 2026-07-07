import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { requestSync } from './syncScheduler';
import { Goal as GoalModel } from './models/Goal';
import { KeyResult as KeyResultModel } from './models/KeyResult';
import type {
  CreateGoalDTO,
  UpdateGoalDTO,
  CreateKeyResultDTO,
  UpdateKeyResultDTO,
} from '@horus/shared';

/**
 * Escrituras locales del dominio Metas (offline-first Fase 2c). Mismas
 * transiciones que goal.service del backend (completedAt al completar,
 * una sola meta destacada). Soft deletes (is_active=false) → updated.
 * Los vínculos meta↔hábito/tarea NO se editan desde mobile.
 */

const goals = () => database.get<GoalModel>('goals');
const keyResults = () => database.get<KeyResultModel>('key_results');

export async function createGoalLocal(dto: CreateGoalDTO): Promise<void> {
  await database.write(async () => {
    await goals().create((g) => {
      g.categoryId = dto.categoryId;
      g.title = dto.title;
      g.description = dto.description;
      g.priority = dto.priority ?? 'media';
      g.status = 'en_progreso';
      g.targetDate = dto.targetDate ? new Date(dto.targetDate) : undefined;
      g.isActive = true;
      g.isFeatured = false;
    });
  });
  requestSync();
}

export async function updateGoalLocal(id: string, dto: UpdateGoalDTO): Promise<void> {
  await database.write(async () => {
    const goal = await goals().find(id);
    await goal.update((g) => {
      if (dto.title !== undefined) g.title = dto.title;
      if (dto.description !== undefined) g.description = dto.description;
      if (dto.categoryId !== undefined) g.categoryId = dto.categoryId;
      if (dto.priority !== undefined) g.priority = dto.priority;
      if (dto.targetDate !== undefined) {
        g.targetDate = dto.targetDate ? new Date(dto.targetDate) : undefined;
      }
      if (dto.status !== undefined && dto.status !== g.status) {
        g.status = dto.status;
        // Igual que el server: completar setea completedAt (y des-completar lo limpia)
        g.completedAt = dto.status === 'completada' ? new Date() : undefined;
      }
    });
  });
  requestSync();
}

/** Soft delete (igual que el REST): viaja como update con is_active=false. */
export async function deleteGoalLocal(id: string): Promise<void> {
  await database.write(async () => {
    const goal = await goals().find(id);
    await goal.update((g) => {
      g.isActive = false;
    });
  });
  requestSync();
}

/** Toggle de destacada con la invariante del server: una sola por usuario. */
export async function featureGoalLocal(id: string): Promise<void> {
  await database.write(async () => {
    const target = await goals().find(id);
    const willFeature = !target.isFeatured;
    const featured = await goals().query(Q.where('is_featured', true)).fetch();
    for (const g of featured) {
      if (g.id !== id) {
        await g.update((x) => {
          x.isFeatured = false;
        });
      }
    }
    await target.update((g) => {
      g.isFeatured = willFeature;
    });
  });
  requestSync();
}

// ---------------------------------------------------------------------------
// Key Results
// ---------------------------------------------------------------------------

export async function createKeyResultLocal(goalId: string, dto: CreateKeyResultDTO): Promise<void> {
  await database.write(async () => {
    await keyResults().create((kr) => {
      kr.goalId = goalId;
      kr.title = dto.title;
      kr.targetValue = dto.targetValue;
      kr.currentValue = dto.currentValue ?? 0;
      kr.unit = dto.unit;
      kr.isActive = true;
    });
  });
  requestSync();
}

export async function updateKeyResultLocal(krId: string, dto: UpdateKeyResultDTO): Promise<void> {
  await database.write(async () => {
    const kr = await keyResults().find(krId);
    await kr.update((k) => {
      if (dto.title !== undefined) k.title = dto.title;
      if (dto.targetValue !== undefined) k.targetValue = dto.targetValue;
      if (dto.currentValue !== undefined) k.currentValue = dto.currentValue;
      if (dto.unit !== undefined) k.unit = dto.unit;
    });
  });
  requestSync();
}

/** Soft delete (igual que el REST). */
export async function deleteKeyResultLocal(krId: string): Promise<void> {
  await database.write(async () => {
    const kr = await keyResults().find(krId);
    await kr.update((k) => {
      k.isActive = false;
    });
  });
  requestSync();
}
