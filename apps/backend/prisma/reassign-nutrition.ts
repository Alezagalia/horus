/**
 * Reasigna toda la data de nutrición de test@test.com → alezagalia@gmail.com
 * Ejecutar: cd apps/backend && npx tsx prisma/reassign-nutrition.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

const FROM_EMAIL = 'test@test.com';
const TO_EMAIL = 'alezagalia@gmail.com';

async function main() {
  console.log(`Reasignando data de nutrición:`);
  console.log(`  Origen  : ${FROM_EMAIL}`);
  console.log(`  Destino : ${TO_EMAIL}\n`);

  // ── 1. Verificar usuarios
  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: FROM_EMAIL } }),
    prisma.user.findUnique({ where: { email: TO_EMAIL } }),
  ]);

  if (!fromUser) throw new Error(`Usuario origen no encontrado: ${FROM_EMAIL}`);
  if (!toUser) throw new Error(`Usuario destino no encontrado: ${TO_EMAIL}`);

  console.log(`IDs: ${FROM_EMAIL} → ${fromUser.id}`);
  console.log(`     ${TO_EMAIL}  → ${toUser.id}\n`);

  // ── 2. Contar data existente del usuario destino (para info)
  const [existingFoods, existingRecipes, existingPlans] = await Promise.all([
    prisma.food.count({ where: { userId: toUser.id } }),
    prisma.recipe.count({ where: { userId: toUser.id } }),
    prisma.mealPlan.count({ where: { userId: toUser.id } }),
  ]);

  if (existingFoods + existingRecipes + existingPlans > 0) {
    console.log(`Data existente en ${TO_EMAIL} (se eliminará para evitar conflictos):`);
    console.log(`  Foods    : ${existingFoods}`);
    console.log(`  Recipes  : ${existingRecipes}`);
    console.log(`  MealPlans: ${existingPlans}`);

    // Eliminar en orden correcto respetando foreign keys
    await prisma.mealPlan.deleteMany({ where: { userId: toUser.id } });
    await prisma.recipe.deleteMany({ where: { userId: toUser.id } });
    await prisma.food.deleteMany({ where: { userId: toUser.id } });
    console.log(`  Eliminados.\n`);
  }

  // ── 3. Contar data del usuario origen
  const [srcFoods, srcRecipes, srcPlans] = await Promise.all([
    prisma.food.count({ where: { userId: fromUser.id } }),
    prisma.recipe.count({ where: { userId: fromUser.id } }),
    prisma.mealPlan.count({ where: { userId: fromUser.id } }),
  ]);

  console.log(`Data a mover desde ${FROM_EMAIL}:`);
  console.log(`  Foods    : ${srcFoods}`);
  console.log(`  Recipes  : ${srcRecipes}`);
  console.log(`  MealPlans: ${srcPlans}\n`);

  if (srcFoods + srcRecipes + srcPlans === 0) {
    console.log(
      'No hay data de nutrición para mover. Verificar que se ejecutó seed-nutrition.ts primero.'
    );
    return;
  }

  // ── 4. Reasignar — el orden importa por las FK (Foods antes que Recipes)
  const [updFoods, updRecipes, updPlans] = await Promise.all([
    prisma.food.updateMany({
      where: { userId: fromUser.id },
      data: { userId: toUser.id },
    }),
    prisma.recipe.updateMany({
      where: { userId: fromUser.id },
      data: { userId: toUser.id },
    }),
    prisma.mealPlan.updateMany({
      where: { userId: fromUser.id },
      data: { userId: toUser.id },
    }),
  ]);

  // NutritionLog y ShoppingList (por si hubiera alguno)
  const [updLogs, updLists] = await Promise.all([
    prisma.nutritionLog.updateMany({
      where: { userId: fromUser.id },
      data: { userId: toUser.id },
    }),
    prisma.shoppingList.updateMany({
      where: { userId: fromUser.id },
      data: { userId: toUser.id },
    }),
  ]);

  // ── 5. Verificar resultado
  const [verFoods, verRecipes, verPlans] = await Promise.all([
    prisma.food.count({ where: { userId: toUser.id } }),
    prisma.recipe.count({ where: { userId: toUser.id } }),
    prisma.mealPlan.count({ where: { userId: toUser.id } }),
  ]);

  console.log(`Reasignacion completada:`);
  console.log(`  Foods movidos    : ${updFoods.count}  (total en destino: ${verFoods})`);
  console.log(`  Recipes movidos  : ${updRecipes.count}  (total en destino: ${verRecipes})`);
  console.log(`  MealPlans movidos: ${updPlans.count}  (total en destino: ${verPlans})`);
  if (updLogs.count > 0) console.log(`  NutritionLogs    : ${updLogs.count}`);
  if (updLists.count > 0) console.log(`  ShoppingLists    : ${updLists.count}`);

  console.log(`\nListo. Ingresar como ${TO_EMAIL} para ver los datos.`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
