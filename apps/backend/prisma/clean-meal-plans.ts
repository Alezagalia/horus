/**
 * Elimina todos los planes de comida del usuario alezagalia@gmail.com
 * Ejecutar: cd apps/backend && npx tsx prisma/clean-meal-plans.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

const EMAIL = 'alezagalia@gmail.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error(`Usuario ${EMAIL} no encontrado`);

  // Cascade: MealPlan → MealEntry → MealEntryItem
  const { count } = await prisma.mealPlan.deleteMany({ where: { userId: user.id } });
  console.log(`✓ ${count} planes de comida eliminados para ${EMAIL}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
