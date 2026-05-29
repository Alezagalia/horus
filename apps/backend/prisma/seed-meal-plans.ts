/**
 * Seed de planes de comida semanales — 3 semanas usando las 20 recetas saludables
 * Para 3 personas (2 adultos + 1 niño de 4 años) — enfocado en almuerzo y cena
 * Cada receta tiene 6 porciones → 2 comidas familiares de 3 porciones c/u
 *
 * Ejecutar: cd apps/backend && npx tsx prisma/seed-meal-plans.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Crea una fecha UTC exacta sin problemas de timezone */
function d(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

const FAMILY_SERVINGS = 3; // 3 personas por comida

// ─────────────────────────────────────────────
// Estructura del plan
// ─────────────────────────────────────────────

interface DayEntry {
  date: Date;
  lunch: string; // nombre de receta
  dinner: string; // nombre de receta
  lunchNotes?: string;
  dinnerNotes?: string;
}

interface WeekPlan {
  weekStart: Date;
  notes: string;
  days: DayEntry[];
}

// ─────────────────────────────────────────────
// 3 semanas de planes — Junio / Julio 2026
// Cada receta aparece 2 veces (usa las 6 porciones en 2 comidas familiares)
// ─────────────────────────────────────────────

const weekPlans: WeekPlan[] = [
  // ══════════════════════════════════════════
  // SEMANA 1 — 1 al 7 de junio 2026
  // Preparar este finde: Albóndigas pavo · Sopa lentejas · Crema zapallo
  //                       Pollo curry · Lasaña verduras · Croquetas pollo
  //                       Arroz con pollo
  // ══════════════════════════════════════════
  {
    weekStart: d(2026, 6, 1),
    notes:
      'SEMANA 1 — Batch cooking del fin de semana: 7 recetas para tener almuerzo y cena cubiertos toda la semana.\n' +
      'Orden de preparación sugerido (sábado): 1) Sopa lentejas · 2) Albóndigas pavo · 3) Arroz con pollo\n' +
      'Orden de preparación sugerido (domingo): 4) Crema zapallo · 5) Pollo curry · 6) Lasaña · 7) Croquetas\n' +
      'Guardar en recipientes etiquetados con nombre y fecha. Congelar todo excepto lo del lunes y martes.',
    days: [
      {
        date: d(2026, 6, 1), // Lunes
        lunch: 'Sopa de lentejas con espinacas',
        dinner: 'Albóndigas de pavo en salsa de tomate',
        lunchNotes: 'Porción 1/2 — recién cocinada, no congelada',
        dinnerNotes: 'Porción 1/2 — recién cocinada, no congelada',
      },
      {
        date: d(2026, 6, 2), // Martes
        lunch: 'Sopa de lentejas con espinacas',
        dinner: 'Albóndigas de pavo en salsa de tomate',
        lunchNotes: 'Porción 2/2 — del sábado, refrigerada',
        dinnerNotes: 'Porción 2/2 — del sábado, refrigerada',
      },
      {
        date: d(2026, 6, 3), // Miércoles
        lunch: 'Crema de zapallo con cúrcuma',
        dinner: 'Pollo al curry con vegetales',
        lunchNotes: 'Porción 1/2 — descongelar noche anterior',
        dinnerNotes: 'Porción 1/2 — descongelar noche anterior',
      },
      {
        date: d(2026, 6, 4), // Jueves
        lunch: 'Crema de zapallo con cúrcuma',
        dinner: 'Pollo al curry con vegetales',
        lunchNotes: 'Porción 2/2 — del congelador',
        dinnerNotes: 'Porción 2/2 — del congelador',
      },
      {
        date: d(2026, 6, 5), // Viernes
        lunch: 'Lasaña de verduras con salsa bechamel',
        dinner: 'Croquetas de pollo horneadas',
        lunchNotes: 'Porción 1/2 — del congelador · hornear 25 min a 180°C',
        dinnerNotes: 'Porción 1/2 — del congelador · hornear 20 min a 200°C',
      },
      {
        date: d(2026, 6, 6), // Sábado
        lunch: 'Lasaña de verduras con salsa bechamel',
        dinner: 'Croquetas de pollo horneadas',
        lunchNotes: 'Porción 2/2 — del congelador',
        dinnerNotes: 'Porción 2/2 — del congelador',
      },
      {
        date: d(2026, 6, 7), // Domingo
        lunch: 'Arroz con pollo al estilo casero',
        dinner: 'Arroz con pollo al estilo casero',
        lunchNotes: 'Porción 1/2 — recalentado con caldo',
        dinnerNotes: 'Porción 2/2 — termina la receta',
      },
    ],
  },

  // ══════════════════════════════════════════
  // SEMANA 2 — 8 al 14 de junio 2026
  // Preparar este finde: Sopa pollo · Chili · Garbanzos chorizo · Tarta
  //                       Guiso carne · Cazuela pollo champiñones · Minestrone
  // ══════════════════════════════════════════
  {
    weekStart: d(2026, 6, 8),
    notes:
      'SEMANA 2 — Batch cooking del fin de semana anterior: 7 recetas nuevas.\n' +
      'Orden sugerido (sábado): 1) Sopa de pollo con fideos · 2) Chili con carne · 3) Guiso de carne\n' +
      'Orden sugerido (domingo): 4) Garbanzos con chorizo · 5) Tarta espinacas · 6) Cazuela pollo · 7) Minestrone\n' +
      'Tip: El chili y el guiso mejoran de sabor al día siguiente. Prepararlos primero.',
    days: [
      {
        date: d(2026, 6, 8), // Lunes
        lunch: 'Sopa de pollo con fideos',
        dinner: 'Chili con carne suave',
        lunchNotes: 'Porción 1/2 — hervir con fideos frescos al recalentar',
        dinnerNotes: 'Porción 1/2 — servir con arroz blanco',
      },
      {
        date: d(2026, 6, 9), // Martes
        lunch: 'Sopa de pollo con fideos',
        dinner: 'Chili con carne suave',
        lunchNotes: 'Porción 2/2',
        dinnerNotes: 'Porción 2/2 — servir con pan de campo',
      },
      {
        date: d(2026, 6, 10), // Miércoles
        lunch: 'Cazuela de garbanzos con chorizo',
        dinner: 'Tarta de espinacas y ricota',
        lunchNotes: 'Porción 1/2 — descongelar noche anterior',
        dinnerNotes: 'Porción 1/2 — hornear 15 min a 170°C para que quede crocante',
      },
      {
        date: d(2026, 6, 11), // Jueves
        lunch: 'Cazuela de garbanzos con chorizo',
        dinner: 'Tarta de espinacas y ricota',
        lunchNotes: 'Porción 2/2',
        dinnerNotes: 'Porción 2/2 — se puede comer fría también',
      },
      {
        date: d(2026, 6, 12), // Viernes
        lunch: 'Guiso de carne con papas y zanahorias',
        dinner: 'Cazuela de pollo con champiñones y crema',
        lunchNotes: 'Porción 1/2 — del congelador',
        dinnerNotes: 'Porción 1/2 — revolver al calentar si la crema se separó',
      },
      {
        date: d(2026, 6, 13), // Sábado
        lunch: 'Guiso de carne con papas y zanahorias',
        dinner: 'Cazuela de pollo con champiñones y crema',
        lunchNotes: 'Porción 2/2',
        dinnerNotes: 'Porción 2/2 — servir con pasta o arroz',
      },
      {
        date: d(2026, 6, 14), // Domingo
        lunch: 'Minestrone con legumbres y pasta',
        dinner: 'Minestrone con legumbres y pasta',
        lunchNotes: 'Porción 1/2 — agregar pasta fresca al calentar',
        dinnerNotes: 'Porción 2/2 — termina la receta',
      },
    ],
  },

  // ══════════════════════════════════════════
  // SEMANA 3 — 15 al 21 de junio 2026
  // Preparar este finde: Merluza · Pastel carne · Carne provenzal
  //                       Berenjenas · Pollo brócoli · Pollo limón batata
  //                       + Albóndigas y Sopa lentejas (repetir favoritas)
  // ══════════════════════════════════════════
  {
    weekStart: d(2026, 6, 15),
    notes:
      'SEMANA 3 — Batch cooking del fin de semana: últimas 6 recetas del ciclo + 2 favoritas repetidas para el domingo.\n' +
      'Orden sugerido (sábado): 1) Merluza horno · 2) Carne provenzal · 3) Pollo brócoli arroz\n' +
      'Orden sugerido (domingo): 4) Pastel carne · 5) Berenjenas rellenas · 6) Pollo limón batata\n' +
      'Para el domingo: repetir Albóndigas de pavo y Sopa de lentejas — las favoritas de la semana 1.\n' +
      'Con estas 3 semanas ya cubriste las 20 recetas del plan. ¡A repetir el ciclo!',
    days: [
      {
        date: d(2026, 6, 15), // Lunes
        lunch: 'Merluza al horno con verduras mediterráneas',
        dinner: 'Pastel de carne con puré de papa',
        lunchNotes: 'Porción 1/2 — hornear 15 min a 170°C tapado',
        dinnerNotes: 'Porción 1/2 — hornear 20 min a 180°C con aluminio',
      },
      {
        date: d(2026, 6, 16), // Martes
        lunch: 'Merluza al horno con verduras mediterráneas',
        dinner: 'Pastel de carne con puré de papa',
        lunchNotes: 'Porción 2/2',
        dinnerNotes: 'Porción 2/2 — gratinar 5 min al final',
      },
      {
        date: d(2026, 6, 17), // Miércoles
        lunch: 'Carne a la provenzal',
        dinner: 'Berenjenas rellenas de carne',
        lunchNotes: 'Porción 1/2 — servir con arroz o pan',
        dinnerNotes: 'Porción 1/2 — hornear 20 min a 180°C tapadas',
      },
      {
        date: d(2026, 6, 18), // Jueves
        lunch: 'Carne a la provenzal',
        dinner: 'Berenjenas rellenas de carne',
        lunchNotes: 'Porción 2/2',
        dinnerNotes: 'Porción 2/2',
      },
      {
        date: d(2026, 6, 19), // Viernes
        lunch: 'Pollo salteado con brócoli y arroz integral',
        dinner: 'Pollo al limón con batata asada',
        lunchNotes: 'Porción 1/2 — saltear 3 min en sartén con chorrito de agua',
        dinnerNotes: 'Porción 1/2 — horno 15 min a 180°C',
      },
      {
        date: d(2026, 6, 20), // Sábado
        lunch: 'Pollo salteado con brócoli y arroz integral',
        dinner: 'Pollo al limón con batata asada',
        lunchNotes: 'Porción 2/2',
        dinnerNotes: 'Porción 2/2',
      },
      {
        date: d(2026, 6, 21), // Domingo
        lunch: 'Albóndigas de pavo en salsa de tomate',
        dinner: 'Sopa de lentejas con espinacas',
        lunchNotes: 'Favorita repetida — nueva tanda cocinada este finde',
        dinnerNotes: 'Favorita repetida — nueva tanda cocinada este finde',
      },
    ],
  },
];

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log('Iniciando seed de planes de comida semanales...\n');

  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) throw new Error('No se encontró ningún usuario.');
  console.log(`Usuario: ${user.email}\n`);

  // Cargar todas las recetas del usuario en un mapa nombre → id
  const recipeRows = await prisma.recipe.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, name: true },
  });

  const recipeMap = new Map(recipeRows.map((r) => [r.name, r.id]));
  console.log(`Recetas encontradas: ${recipeRows.length}\n`);

  if (recipeRows.length < 20) {
    console.warn('  AVISO: Se esperaban 20 recetas. Correr primero seed-nutrition.ts');
  }

  let planCount = 0;
  let entryCount = 0;
  let itemCount = 0;

  for (const week of weekPlans) {
    const weekLabel = week.weekStart.toISOString().slice(0, 10);

    // Upsert el plan semanal
    const mealPlan = await prisma.mealPlan.upsert({
      where: { userId_weekStart: { userId: user.id, weekStart: week.weekStart } },
      update: { notes: week.notes },
      create: { userId: user.id, weekStart: week.weekStart, notes: week.notes },
    });

    // Limpiar entradas existentes para poder re-ejecutar de forma idempotente
    await prisma.mealEntry.deleteMany({ where: { mealPlanId: mealPlan.id } });

    planCount++;
    console.log(`── Plan Semana ${planCount}: ${weekLabel}`);

    for (const day of week.days) {
      const dayLabel = day.date.toISOString().slice(0, 10);

      // Helper para crear una entrada con su item de receta
      const createEntry = async (
        mealTime: 'LUNCH' | 'DINNER',
        recipeName: string,
        notes: string | undefined
      ) => {
        const recipeId = recipeMap.get(recipeName);
        if (!recipeId) {
          console.warn(`     WARN: receta no encontrada → "${recipeName}"`);
          return;
        }

        const entry = await prisma.mealEntry.create({
          data: {
            mealPlanId: mealPlan.id,
            day: day.date,
            mealTime,
            notes: notes ?? null,
          },
        });

        await prisma.mealEntryItem.create({
          data: {
            mealEntryId: entry.id,
            recipeId,
            // grams: peso aprox. por persona (300g) × 3 personas = referencia
            // La lógica de macros usa el campo `servings` para recetas
            grams: 300,
            servings: FAMILY_SERVINGS,
          },
        });

        entryCount++;
        itemCount++;
      };

      await createEntry('LUNCH', day.lunch, day.lunchNotes);
      await createEntry('DINNER', day.dinner, day.dinnerNotes);

      const lunchShort = day.lunch.length > 35 ? day.lunch.slice(0, 32) + '...' : day.lunch;
      const dinnerShort = day.dinner.length > 35 ? day.dinner.slice(0, 32) + '...' : day.dinner;
      console.log(`   ${dayLabel}  ALM: ${lunchShort}`);
      console.log(`               CEN: ${dinnerShort}`);
    }

    console.log('');
  }

  // Resumen final
  console.log('════════════════════════════════════════');
  console.log('Seed de planes de comida completado!');
  console.log(`  Semanas planificadas : ${planCount}`);
  console.log(`  Dias cubiertos       : ${weekPlans.reduce((s, w) => s + w.days.length, 0)}`);
  console.log(`  Entradas de comida   : ${entryCount}  (almuerzo + cena)`);
  console.log(`  Items de receta      : ${itemCount}`);
  console.log('');
  console.log('Cada dia tiene 3 porciones por comida (1 por persona).');
  console.log('Ciclo completo: 20 recetas distribuidas en 3 semanas.');
  console.log('Renovar el ciclo repitiendo las recetas favoritas a partir de semana 4.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
