import { ShoppingList, ShoppingListItem } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { ShoppingListItemRaw, ShoppingListRaw } from '../types.js';

/**
 * Listas de compras + items. Hard delete con tombstones (la lista cascadea
 * items). transactionId es @unique: si la transacción es ajena/inexistente o
 * ya está vinculada a otra lista, se guarda null en vez de fallar el push.
 */

export function toRaw(l: ShoppingList): ShoppingListRaw {
  return {
    id: l.id,
    meal_plan_id: l.mealPlanId,
    name: l.name,
    transaction_id: l.transactionId,
    generated_at: l.generatedAt?.getTime() ?? null,
    created_at: l.createdAt.getTime(),
    updated_at: l.updatedAt.getTime(),
  };
}

export function itemToRaw(i: ShoppingListItem): ShoppingListItemRaw {
  return {
    id: i.id,
    shopping_list_id: i.shoppingListId,
    food_id: i.foodId,
    name: i.name,
    quantity: Number(i.quantity),
    unit: i.unit,
    checked: i.checked,
    notes: i.notes,
    created_at: i.createdAt.getTime(),
    updated_at: i.updatedAt.getTime(),
  };
}

async function safeMealPlanId(
  ctx: PushContext,
  rawPlanId: string | null,
  planRemap: Map<string, string>
): Promise<string | null> {
  if (!rawPlanId) return null;
  const planId = planRemap.get(rawPlanId) ?? rawPlanId;
  const plan = await ctx.tx.mealPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== ctx.userId) {
    logger.warn(`[replication] shopping_list con meal_plan ajeno/inexistente: se anula`);
    return null;
  }
  return planId;
}

async function safeTransactionId(
  ctx: PushContext,
  transactionId: string | null,
  listId: string
): Promise<string | null> {
  if (!transactionId) return null;
  const tx = await ctx.tx.transaction.findUnique({ where: { id: transactionId } });
  if (!tx || tx.userId !== ctx.userId) {
    logger.warn(
      `[replication] shopping_list ${listId} con transaction ajena/inexistente: se anula`
    );
    return null;
  }
  const taken = await ctx.tx.shoppingList.findUnique({ where: { transactionId } });
  if (taken && taken.id !== listId) {
    logger.warn(
      `[replication] shopping_list ${listId}: transaction ${transactionId} ya vinculada a ${taken.id}: se anula`
    );
    return null;
  }
  return transactionId;
}

export async function applyCreated(
  ctx: PushContext,
  raws: ShoppingListRaw[],
  planRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.shoppingList.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'shopping_lists', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] shopping_list ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    await ctx.tx.shoppingList.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        mealPlanId: await safeMealPlanId(ctx, raw.meal_plan_id, planRemap),
        name: raw.name,
        transactionId: await safeTransactionId(ctx, raw.transaction_id, raw.id),
        generatedAt: raw.generated_at != null ? new Date(raw.generated_at) : null,
      },
    });
  }
}

export async function applyUpdated(
  ctx: PushContext,
  raws: ShoppingListRaw[],
  planRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.shoppingList.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw], planRemap);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'shopping_lists', raw.id, existing.updatedAt);

    await ctx.tx.shoppingList.update({
      where: { id: raw.id },
      data: {
        mealPlanId: await safeMealPlanId(ctx, raw.meal_plan_id, planRemap),
        name: raw.name,
        transactionId: await safeTransactionId(ctx, raw.transaction_id, raw.id),
        generatedAt: raw.generated_at != null ? new Date(raw.generated_at) : null,
      },
    });
  }
}

export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.shoppingList.findUnique({
      where: { id },
      include: { items: { select: { id: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'shopping_lists', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    await recordTombstones(
      ctx.tx,
      ctx.userId,
      'shopping_list_items',
      existing.items.map((i) => i.id)
    );
    await recordTombstones(ctx.tx, ctx.userId, 'shopping_lists', [id]);
    await ctx.tx.shoppingList.delete({ where: { id } }); // cascadea items
  }
}

export async function applyItems(
  ctx: PushContext,
  raws: ShoppingListItemRaw[],
  foodRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    // food inválido → null (como SetNull); el item conserva nombre/cantidad
    let foodId: string | null = null;
    if (raw.food_id) {
      const mapped = foodRemap.get(raw.food_id) ?? raw.food_id;
      const food = await ctx.tx.food.findUnique({ where: { id: mapped } });
      foodId = food && food.userId === ctx.userId ? mapped : null;
    }

    const data = {
      foodId,
      name: raw.name,
      quantity: raw.quantity,
      unit: raw.unit,
      checked: raw.checked ?? false,
      notes: raw.notes,
    };

    const existing = await ctx.tx.shoppingListItem.findUnique({
      where: { id: raw.id },
      include: { shoppingList: { select: { userId: true } } },
    });
    if (existing) {
      if (existing.shoppingList.userId !== ctx.userId) continue;
      // shopping_list_id no se acepta (re-parenting)
      await ctx.tx.shoppingListItem.update({ where: { id: raw.id }, data });
      continue;
    }

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'shopping_list_items', rowId: raw.id } },
    });
    if (tombstone) continue;

    const list = await ctx.tx.shoppingList.findUnique({ where: { id: raw.shopping_list_id } });
    if (!list || list.userId !== ctx.userId) {
      logger.warn(
        `[replication] shopping_list_item ${raw.id} de lista ajena/inexistente: ignorado`
      );
      continue;
    }

    await ctx.tx.shoppingListItem.create({
      data: { id: raw.id, shoppingListId: raw.shopping_list_id, ...data },
    });
  }
}

export async function deleteItems(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.shoppingListItem.findUnique({
      where: { id },
      include: { shoppingList: { select: { userId: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'shopping_list_items', [id]);
      continue;
    }
    if (existing.shoppingList.userId !== ctx.userId) continue;

    await recordTombstones(ctx.tx, ctx.userId, 'shopping_list_items', [id]);
    await ctx.tx.shoppingListItem.delete({ where: { id } });
  }
}
