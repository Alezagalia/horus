import { prisma } from '../lib/prisma.js';
import { Scope } from '../generated/prisma/client.js';
import { ConflictError, NotFoundError } from '../middlewares/error.middleware.js';

export interface CreateCategoryData {
  name: string;
  scope: Scope;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
}

export const categoryService = {
  async findAll(userId: string, scope?: Scope) {
    const where: { userId: string; isActive: boolean; scope?: Scope } = {
      userId,
      isActive: true,
    };

    if (scope) {
      where.scope = scope;
    }

    return prisma.category.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async findById(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  },

  async create(userId: string, data: CreateCategoryData) {
    // Check if category with same name and scope already exists
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: data.name,
        scope: data.scope,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictError(`Category "${data.name}" already exists for scope "${data.scope}"`);
    }

    return prisma.category.create({
      data: {
        ...data,
        userId,
      },
    });
  },

  async update(id: string, userId: string, data: UpdateCategoryData) {
    // Verify category exists and belongs to user
    await this.findById(id, userId);

    // If updating name, check for conflicts
    if (data.name) {
      const category = await prisma.category.findUnique({
        where: { id },
      });

      const existing = await prisma.category.findFirst({
        where: {
          userId,
          name: data.name,
          scope: category!.scope,
          isActive: true,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError(`Category "${data.name}" already exists for this scope`);
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, userId: string) {
    // Verify category exists and belongs to user
    const category = await this.findById(id, userId);

    // Don't allow deleting default categories
    if (category.isDefault) {
      throw new ConflictError('Cannot delete default category');
    }

    // TODO (Sprint 3+): Check if category has associated items
    // When Habit, Task, Event, Expense models are implemented, add:
    // const habitsCount = await prisma.habit.count({ where: { categoryId: id } });
    // const tasksCount = await prisma.task.count({ where: { categoryId: id } });
    // const eventsCount = await prisma.event.count({ where: { categoryId: id } });
    // const expensesCount = await prisma.expense.count({ where: { categoryId: id } });
    // const totalCount = habitsCount + tasksCount + eventsCount + expensesCount;
    //
    // if (totalCount > 0) {
    //   const itemType = category.scope === 'habitos' ? 'hábitos' :
    //                    category.scope === 'tareas' ? 'tareas' :
    //                    category.scope === 'eventos' ? 'eventos' : 'gastos';
    //   throw new ConflictError(
    //     `No se puede eliminar. Tiene ${totalCount} ${itemType} asociados.`
    //   );
    // }

    // Soft delete (sets isActive to false, doesn't delete from database)
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async setDefault(id: string, userId: string) {
    // Verify category exists and belongs to user
    const category = await this.findById(id, userId);

    // Unset current default for this scope
    await prisma.category.updateMany({
      where: {
        userId,
        scope: category.scope,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set new default
    return prisma.category.update({
      where: { id },
      data: { isDefault: true },
    });
  },

  async createDefaultCategories(userId: string) {
    const defaultCategories = [
      // Hábitos (US-019)
      { name: 'Salud', scope: 'habitos' as Scope, icon: '🏃', color: '#4CAF50' },
      { name: 'Productividad', scope: 'habitos' as Scope, icon: '💼', color: '#2196F3' },
      { name: 'Aprendizaje', scope: 'habitos' as Scope, icon: '📚', color: '#FF9800' },
      { name: 'Bienestar', scope: 'habitos' as Scope, icon: '🧘', color: '#9C27B0' },

      // Tareas (US-019)
      { name: 'Personal', scope: 'tareas' as Scope, icon: '🏠', color: '#FFC107' },
      { name: 'Trabajo', scope: 'tareas' as Scope, icon: '💼', color: '#2196F3' },
      { name: 'Compras', scope: 'tareas' as Scope, icon: '🛒', color: '#4CAF50' },

      // Eventos (US-019)
      { name: 'Reuniones', scope: 'eventos' as Scope, icon: '🤝', color: '#2196F3' },
      { name: 'Personal', scope: 'eventos' as Scope, icon: '🎉', color: '#E91E63' },
      { name: 'Recordatorios', scope: 'eventos' as Scope, icon: '⏰', color: '#FF9800' },

      // Gastos (US-019)
      { name: 'Alimentación', scope: 'gastos' as Scope, icon: '🍔', color: '#4CAF50' },
      { name: 'Transporte', scope: 'gastos' as Scope, icon: '🚗', color: '#2196F3' },
      { name: 'Hogar', scope: 'gastos' as Scope, icon: '🏠', color: '#FF9800' },
      { name: 'Entretenimiento', scope: 'gastos' as Scope, icon: '🎬', color: '#E91E63' },
      { name: 'Salud', scope: 'gastos' as Scope, icon: '💊', color: '#F44336' },
    ];

    const categories = await prisma.category.createMany({
      data: defaultCategories.map((cat, index) => ({
        ...cat,
        userId,
        isDefault: index === 0 || index === 4 || index === 7 || index === 10, // First of each scope
      })),
    });

    return categories;
  },
};
