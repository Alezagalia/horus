/**
 * Checklist Service
 * Sprint 7 - US-058
 */

import { prisma } from '../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';

export interface CreateChecklistItemData {
  title: string;
}

export interface UpdateChecklistItemData {
  title?: string;
  completed?: boolean;
}

export interface ReorderItem {
  itemId: string;
  position: number;
}

export const checklistService = {
  /**
   * Verify task exists and belongs to user
   */
  async verifyTaskOwnership(taskId: string, userId: string): Promise<void> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId, isActive: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }
  },

  /**
   * Create a new checklist item for a task
   * POST /api/tasks/:taskId/checklist
   */
  async createChecklistItem(
    taskId: string,
    userId: string,
    data: CreateChecklistItemData
  ): Promise<unknown> {
    // Verify task ownership
    await this.verifyTaskOwnership(taskId, userId);

    // Calculate position (last + 1)
    const lastItem = await prisma.taskChecklistItem.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = lastItem ? lastItem.position + 1 : 0;

    // Create item
    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId,
        title: data.title,
        completed: false,
        position,
      },
    });

    return item;
  },

  /**
   * Update a checklist item
   * PUT /api/tasks/:taskId/checklist/:itemId
   */
  async updateChecklistItem(
    taskId: string,
    itemId: string,
    userId: string,
    data: UpdateChecklistItemData
  ): Promise<unknown> {
    // Verify task ownership
    await this.verifyTaskOwnership(taskId, userId);

    // Verify item exists and belongs to task
    const item = await prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });

    if (!item) {
      throw new NotFoundError('Checklist item not found');
    }

    // Update item
    const updatedItem = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        title: data.title,
        completed: data.completed,
      },
    });

    return updatedItem;
  },

  /**
   * Delete a checklist item and recalculate positions
   * DELETE /api/tasks/:taskId/checklist/:itemId
   */
  async deleteChecklistItem(taskId: string, itemId: string, userId: string): Promise<void> {
    // Verify task ownership
    await this.verifyTaskOwnership(taskId, userId);

    // Verify item exists and belongs to task
    const item = await prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });

    if (!item) {
      throw new NotFoundError('Checklist item not found');
    }

    // Delete item
    await prisma.taskChecklistItem.delete({
      where: { id: itemId },
    });

    // Recalculate positions for remaining items
    const remainingItems = await prisma.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });

    // Update positions sequentially
    for (let i = 0; i < remainingItems.length; i++) {
      await prisma.taskChecklistItem.update({
        where: { id: remainingItems[i].id },
        data: { position: i },
      });
    }
  },

  /**
   * Reorder checklist items
   * PUT /api/tasks/:taskId/checklist/reorder
   */
  async reorderChecklistItems(
    taskId: string,
    userId: string,
    items: ReorderItem[]
  ): Promise<unknown[]> {
    // Verify task ownership
    await this.verifyTaskOwnership(taskId, userId);

    // Get all checklist items for this task
    const allItems = await prisma.taskChecklistItem.findMany({
      where: { taskId },
      select: { id: true },
    });

    const allItemIds = allItems.map((item) => item.id);
    const reorderItemIds = items.map((item) => item.itemId);

    // Verify all provided itemIds exist and belong to this task
    for (const itemId of reorderItemIds) {
      if (!allItemIds.includes(itemId)) {
        throw new BadRequestError(`Item ${itemId} does not belong to this task`);
      }
    }

    // Verify we're reordering all items (no missing items)
    if (reorderItemIds.length !== allItemIds.length) {
      throw new BadRequestError('All checklist items must be included in reorder operation');
    }

    // Verify no duplicate positions
    const positions = items.map((item) => item.position);
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      throw new BadRequestError('Duplicate positions are not allowed');
    }

    // Update positions in batch using transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.taskChecklistItem.update({
          where: { id: item.itemId },
          data: { position: item.position },
        })
      )
    );

    // Return reordered items
    const reorderedItems = await prisma.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { position: 'asc' },
    });

    return reorderedItems;
  },
};
