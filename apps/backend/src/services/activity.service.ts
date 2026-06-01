import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../middlewares/error.middleware.js';
import { parseISODateToNoonUTC } from '../utils/date.utils.js';

export interface CreateActivityData {
  name: string;
  description?: string;
  content?: string;
  periodicity: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  weekDays: number[];
  timesPerMonth?: number | null;
  timeMode: 'FIXED' | 'AFTER_ACTIVITY';
  fixedHour?: number | null;
  fixedMinute?: number | null;
  afterActivityId?: string | null;
  durationMinutes?: number | null;
  emoji?: string;
  color?: string;
  order: number;
}

export type UpdateActivityData = Partial<CreateActivityData>;

function getMonthRange(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0));
  return { start, end };
}

export const activityService = {
  async getActivitiesForDate(userId: string, dateStr: string) {
    const dateObj = parseISODateToNoonUTC(dateStr);
    // 0=Sun…6=Sat — JS getUTCDay() matches the weekDays convention
    const dayOfWeek = new Date(dateStr + 'T12:00:00Z').getUTCDay();

    const activities = await prisma.activity.findMany({
      where: { userId, isActive: true },
      include: {
        afterActivity: { select: { id: true, name: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    // Filter by periodicity
    const filtered = activities.filter((a) => {
      if (a.periodicity === 'DAILY') return true;
      if (a.periodicity === 'WEEKLY') return a.weekDays.includes(dayOfWeek);
      if (a.periodicity === 'MONTHLY') return true;
      return false;
    });

    if (filtered.length === 0) return [];

    // Fetch records for this date
    const records = await prisma.activityRecord.findMany({
      where: {
        userId,
        activityId: { in: filtered.map((a) => a.id) },
        date: dateObj,
      },
    });

    const recordMap = new Map(records.map((r) => [r.activityId, r]));

    // For MONTHLY activities, fetch monthly completion counts
    const monthlyIds = filtered.filter((a) => a.periodicity === 'MONTHLY').map((a) => a.id);
    let monthlyCompletionsMap = new Map<string, number>();

    if (monthlyIds.length > 0) {
      const { start, end } = getMonthRange(dateObj);
      const monthlyCounts = await prisma.activityRecord.groupBy({
        by: ['activityId'],
        where: {
          userId,
          activityId: { in: monthlyIds },
          completed: true,
          date: { gte: start, lte: end },
        },
        _count: { id: true },
      });
      monthlyCompletionsMap = new Map(monthlyCounts.map((c) => [c.activityId, c._count.id]));
    }

    return filtered.map((a) => ({
      ...a,
      record: recordMap.get(a.id) ?? null,
      monthlyCompletions:
        a.periodicity === 'MONTHLY' ? (monthlyCompletionsMap.get(a.id) ?? 0) : undefined,
    }));
  },

  async getAllActivities(userId: string) {
    return prisma.activity.findMany({
      where: { userId, isActive: true },
      include: { afterActivity: { select: { id: true, name: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async getActivityById(userId: string, id: string) {
    const activity = await prisma.activity.findFirst({
      where: { id, userId, isActive: true },
      include: { afterActivity: { select: { id: true, name: true } } },
    });
    if (!activity) throw new NotFoundError('Activity not found');
    return activity;
  },

  async createActivity(userId: string, data: CreateActivityData) {
    return prisma.activity.create({
      data: { ...data, userId },
      include: { afterActivity: { select: { id: true, name: true } } },
    });
  },

  async updateActivity(userId: string, id: string, data: UpdateActivityData) {
    const existing = await prisma.activity.findFirst({ where: { id, userId, isActive: true } });
    if (!existing) throw new NotFoundError('Activity not found');

    return prisma.activity.update({
      where: { id },
      data,
      include: { afterActivity: { select: { id: true, name: true } } },
    });
  },

  async deleteActivity(userId: string, id: string) {
    const existing = await prisma.activity.findFirst({ where: { id, userId, isActive: true } });
    if (!existing) throw new NotFoundError('Activity not found');

    await prisma.activity.update({ where: { id }, data: { isActive: false } });
  },

  async toggleRecord(
    userId: string,
    activityId: string,
    data: { date: string; completed: boolean; skipped?: boolean; notes?: string | null }
  ) {
    // Verify ownership
    const activity = await prisma.activity.findFirst({ where: { id: activityId, userId } });
    if (!activity) throw new NotFoundError('Activity not found');

    const dateObj = parseISODateToNoonUTC(data.date);

    return prisma.activityRecord.upsert({
      where: { activityId_userId_date: { activityId, userId, date: dateObj } },
      create: {
        activityId,
        userId,
        date: dateObj,
        completed: data.completed,
        completedAt: data.completed ? new Date() : null,
        skipped: data.skipped ?? false,
        notes: data.notes ?? null,
      },
      update: {
        completed: data.completed,
        completedAt: data.completed ? new Date() : null,
        skipped: data.skipped ?? false,
        notes: data.notes ?? null,
      },
    });
  },
};
