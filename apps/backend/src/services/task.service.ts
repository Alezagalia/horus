/**
 * Task Service
 * Sprint 7 - US-057, US-060
 */

import { prisma } from '../lib/prisma.js';
import { Priority, TaskStatus, Scope } from '../generated/prisma/client.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';

export interface CreateTaskData {
  categoryId: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  categoryId?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueDate?: string | null;
  cancelReason?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  categoryId?: string;
  dueDateFilter?: 'overdue' | 'today' | 'week' | 'month' | 'none';
}

export const taskService = {
  async findAll(userId: string, filters?: TaskFilters) {
    const where: {
      userId: string;
      isActive: boolean;
      archivedAt: null;
      status?: TaskStatus;
      priority?: Priority;
      categoryId?: string;
      dueDate?: {
        lt?: Date;
        gte?: Date;
        lte?: Date;
      };
    } = {
      userId,
      isActive: true,
      archivedAt: null,
    };

    // Apply filters
    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // Apply dueDate filters
    if (filters?.dueDateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      switch (filters.dueDateFilter) {
        case 'overdue': {
          where.dueDate = {
            lt: today,
          };
          break;
        }
        case 'today': {
          where.dueDate = {
            gte: today,
            lt: tomorrow,
          };
          break;
        }
        case 'week': {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          where.dueDate = {
            gte: today,
            lte: weekEnd,
          };
          break;
        }
        case 'month': {
          const monthEnd = new Date(today);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          where.dueDate = {
            gte: today,
            lte: monthEnd,
          };
          break;
        }
        case 'none': {
          // Only tasks without dueDate
          where.dueDate = undefined;
          // @ts-expect-error - Prisma allows null check
          where.dueDate = null;
          break;
        }
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            scope: true,
          },
        },
        checklistItems: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [{ orderPosition: 'asc' }, { createdAt: 'desc' }],
    });

    return tasks;
  },

  async findById(id: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: { id, userId, isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            scope: true,
          },
        },
        checklistItems: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task;
  },

  async create(userId: string, data: CreateTaskData) {
    // Verify category exists, belongs to user, and is of scope 'tareas'
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId,
        isActive: true,
        scope: Scope.tareas,
      },
    });

    if (!category) {
      throw new BadRequestError('Category not found or is not a task category');
    }

    // Calculate orderPosition (last + 1)
    const lastTask = await prisma.task.findFirst({
      where: { userId, isActive: true },
      orderBy: { orderPosition: 'desc' },
      select: { orderPosition: true },
    });

    const orderPosition = lastTask ? lastTask.orderPosition + 1 : 0;

    // Create task
    const task = await prisma.task.create({
      data: {
        userId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        orderPosition,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            scope: true,
          },
        },
      },
    });

    return task;
  },

  async update(id: string, userId: string, data: UpdateTaskData) {
    // Verify task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    // If categoryId is being updated, verify it exists and is of scope 'tareas'
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          userId,
          isActive: true,
          scope: Scope.tareas,
        },
      });

      if (!category) {
        throw new BadRequestError('Category not found or is not a task category');
      }
    }

    // Prepare update data
    const updateData: {
      title?: string;
      description?: string | null;
      categoryId?: string;
      priority?: Priority;
      status?: TaskStatus;
      dueDate?: Date | null;
      cancelReason?: string | null;
      completedAt?: Date | null;
      canceledAt?: Date | null;
      archivedAt?: Date | null;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Handle status changes with timestamps
    if (data.status !== undefined) {
      updateData.status = data.status;

      // If changing to 'completada', set completedAt
      if (data.status === 'completada') {
        updateData.completedAt = new Date();
      }

      // If changing to 'cancelada', set canceledAt and allow cancelReason
      if (data.status === 'cancelada') {
        updateData.canceledAt = new Date();
        if (data.cancelReason !== undefined) {
          updateData.cancelReason = data.cancelReason;
        }
      }

      // If changing FROM 'completada' to another status, clear completedAt and archivedAt
      if (existingTask.status === 'completada' && data.status !== 'completada') {
        updateData.completedAt = null;
        updateData.archivedAt = null;
      }

      // If changing FROM 'cancelada' to another status, clear canceledAt
      if (existingTask.status === 'cancelada' && data.status !== 'cancelada') {
        updateData.canceledAt = null;
        updateData.cancelReason = null;
      }
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            scope: true,
          },
        },
      },
    });

    return task;
  },

  async delete(id: string, userId: string) {
    // Verify task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Delete task (CASCADE will delete checklist items)
    await prisma.task.delete({
      where: { id },
    });

    // Recalculate orderPosition for remaining tasks
    const remainingTasks = await prisma.task.findMany({
      where: { userId, isActive: true },
      orderBy: { orderPosition: 'asc' },
      select: { id: true },
    });

    // Update positions sequentially
    for (let i = 0; i < remainingTasks.length; i++) {
      await prisma.task.update({
        where: { id: remainingTasks[i].id },
        data: { orderPosition: i },
      });
    }

    return { message: 'Task deleted successfully' };
  },

  async toggleTaskStatus(id: string, userId: string) {
    // Verify task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Cannot toggle canceled tasks - must be reactivated explicitly
    if (task.status === 'cancelada') {
      throw new BadRequestError(
        'Cannot toggle canceled task. Please reactivate it first or change status manually.'
      );
    }

    // Determine new status and timestamps
    let newStatus: TaskStatus;
    let completedAt: Date | null;
    let archivedAt: Date | null;

    if (task.status === 'pendiente' || task.status === 'en_progreso') {
      // Change to completed
      newStatus = 'completada';
      completedAt = new Date();
      archivedAt = task.archivedAt; // Keep existing archivedAt if any
    } else {
      // task.status === 'completada'
      // Change to pending
      newStatus = 'pendiente';
      completedAt = null;
      archivedAt = null; // Clear archivedAt when uncompleting
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt,
        archivedAt,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            scope: true,
          },
        },
      },
    });

    return updatedTask;
  },
};
