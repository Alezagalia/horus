import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError } from '../middlewares/error.middleware.js';

export interface CreateHabitMomentData {
  key: string;
  label: string;
  emoji?: string;
  startHour: number;
  startMinute?: number;
  endHour: number;
  endMinute?: number;
  sortOrder?: number;
}

export interface UpdateHabitMomentData {
  label?: string;
  emoji?: string;
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  sortOrder?: number;
  isActive?: boolean;
}

const DEFAULT_MOMENTS: CreateHabitMomentData[] = [
  {
    key: 'AYUNO',
    label: 'En ayunas',
    emoji: '🌅',
    startHour: 6,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
    sortOrder: 0,
  },
  {
    key: 'MANANA',
    label: 'Mañana',
    emoji: '☀️',
    startHour: 8,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
    sortOrder: 1,
  },
  {
    key: 'MEDIA_MANANA',
    label: 'Media mañana',
    emoji: '☕',
    startHour: 10,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    sortOrder: 2,
  },
  {
    key: 'TARDE',
    label: 'Tarde',
    emoji: '🌤️',
    startHour: 12,
    startMinute: 0,
    endHour: 15,
    endMinute: 0,
    sortOrder: 3,
  },
  {
    key: 'MEDIA_TARDE',
    label: 'Media tarde',
    emoji: '🍵',
    startHour: 15,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    sortOrder: 4,
  },
  {
    key: 'NOCHE',
    label: 'Noche',
    emoji: '🌙',
    startHour: 18,
    startMinute: 0,
    endHour: 21,
    endMinute: 0,
    sortOrder: 5,
  },
  {
    key: 'ANTES_DORMIR',
    label: 'Antes de dormir',
    emoji: '😴',
    startHour: 21,
    startMinute: 0,
    endHour: 23,
    endMinute: 59,
    sortOrder: 6,
  },
  {
    key: 'ANYTIME',
    label: 'Cualquier momento',
    emoji: '⏰',
    startHour: 0,
    startMinute: 0,
    endHour: 23,
    endMinute: 59,
    sortOrder: 7,
  },
];

export const habitMomentService = {
  async findAll(userId: string) {
    return prisma.habitMoment.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async findById(id: string, userId: string) {
    const moment = await prisma.habitMoment.findFirst({
      where: { id, userId },
    });
    if (!moment) throw new NotFoundError('Moment not found');
    return moment;
  },

  async create(userId: string, data: CreateHabitMomentData) {
    const key = data.key.toUpperCase().replace(/\s+/g, '_');
    const existing = await prisma.habitMoment.findUnique({
      where: { userId_key: { userId, key } },
    });
    if (existing) throw new ConflictError(`Ya existe un momento con la clave "${key}"`);

    return prisma.habitMoment.create({
      data: {
        userId,
        key,
        label: data.label,
        emoji: data.emoji ?? '⏰',
        startHour: data.startHour,
        startMinute: data.startMinute ?? 0,
        endHour: data.endHour,
        endMinute: data.endMinute ?? 0,
        sortOrder: data.sortOrder ?? 99,
      },
    });
  },

  async update(id: string, userId: string, data: UpdateHabitMomentData) {
    await this.findById(id, userId);
    return prisma.habitMoment.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, userId: string) {
    await this.findById(id, userId);
    return prisma.habitMoment.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /** Crea los momentos por defecto para un usuario nuevo. */
  async createDefaultMoments(userId: string) {
    await prisma.habitMoment.createMany({
      data: DEFAULT_MOMENTS.map((m) => ({
        userId,
        key: m.key,
        label: m.label,
        emoji: m.emoji ?? '⏰',
        startHour: m.startHour,
        startMinute: m.startMinute ?? 0,
        endHour: m.endHour,
        endMinute: m.endMinute ?? 0,
        sortOrder: m.sortOrder ?? 99,
      })),
      skipDuplicates: true,
    });
  },

  /** Asegura que el usuario tenga los momentos por defecto (para usuarios existentes). */
  async ensureDefaults(userId: string) {
    const count = await prisma.habitMoment.count({ where: { userId } });
    if (count === 0) {
      await this.createDefaultMoments(userId);
    }
  },
};
