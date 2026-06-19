/**
 * Seed de tareas vinculadas a las metas personales.
 * Filosofía: pasitos cortos y realistas — primeros pasos que destraban cada meta.
 * Vincula cada Task a su Goal vía GoalTask.
 * Ejecutar: cd apps/backend && npx tsx prisma/seed-goal-tasks.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

const USER_ID = '2691c4f2-e94c-4d97-993a-0efc24b90899'; // alezagalia@gmail.com

type Priority = 'alta' | 'media' | 'baja';
type Domain = 'salud' | 'finanzas' | 'trabajo';

// Categorías de tareas a usar/crear (scope 'tareas'). 'trabajo' ya existe.
const CATEGORY_DEFS: Record<Domain, { name: string; icon: string; color: string }> = {
  salud: { name: 'Salud', icon: '💪', color: '#22C55E' },
  finanzas: { name: 'Finanzas', icon: '💰', color: '#0EA5E9' },
  trabajo: { name: 'Trabajo', icon: '💼', color: '#6366F1' },
};

// Base: hoy 2026-06-16 (fijo para que los vencimientos sean deterministas)
const BASE = new Date('2026-06-16T12:00:00.000Z');
const inDays = (d: number) => new Date(BASE.getTime() + d * 24 * 60 * 60 * 1000);

interface TaskSeed {
  title: string;
  description?: string;
  priority: Priority;
  dueInDays: number;
}

interface Group {
  goalTitle: string; // debe coincidir con el title de la meta ya creada
  domain: Domain;
  tasks: TaskSeed[];
}

const groups: Group[] = [
  // ───────── 💪 Entrenar 3x/semana (corto) ─────────
  {
    goalTitle: '💪 Construir el hábito de entrenar 3x por semana',
    domain: 'salud',
    tasks: [
      { title: 'Elegir 3 días fijos de la semana para entrenar', priority: 'alta', dueInDays: 2 },
      { title: 'Dejar lista la ropa de gym la noche anterior', priority: 'baja', dueInDays: 1 },
      {
        title: "Crear el hábito 'Entrenar' en Horus y vincularlo a esta meta",
        priority: 'media',
        dueInDays: 3,
      },
      { title: 'Hacer la primera sesión corta de 20 minutos', priority: 'media', dueInDays: 4 },
      { title: 'Agendar los 3 entrenamientos en el calendario', priority: 'baja', dueInDays: 5 },
    ],
  },
  // ───────── 🏃 Correr 10k (mediano) ─────────
  {
    goalTitle: '🏃 Correr 10 km sin parar',
    domain: 'salud',
    tasks: [
      { title: "Descargar un plan 'de cero a 10k'", priority: 'baja', dueInDays: 7 },
      { title: 'Definir una ruta de 2-3 km cerca de casa', priority: 'baja', dueInDays: 8 },
      { title: 'Revisar o conseguir zapatillas para correr', priority: 'baja', dueInDays: 10 },
      { title: 'Hacer la primera caminata-trote de 15 minutos', priority: 'media', dueInDays: 9 },
    ],
  },
  // ───────── 🧗 Ejercicio como identidad (largo) ─────────
  {
    goalTitle: '🧗 Hacer del ejercicio parte de mi identidad',
    domain: 'salud',
    tasks: [
      {
        title: 'Definir mi "piso mínimo" mensual de entrenamientos',
        priority: 'baja',
        dueInDays: 14,
      },
      {
        title: 'Anotar por qué quiero ser una persona que entrena',
        priority: 'baja',
        dueInDays: 14,
      },
      {
        title: 'Programar una revisión mensual de mi racha en Horus',
        priority: 'baja',
        dueInDays: 30,
      },
    ],
  },
  // ───────── 💵 Fondo de emergencia (corto) ─────────
  {
    goalTitle: '💵 Armar un fondo de emergencia de 1 mes de gastos',
    domain: 'finanzas',
    tasks: [
      { title: 'Cargar mis cuentas y gastos fijos en Horus', priority: 'baja', dueInDays: 3 },
      { title: 'Calcular cuánto es 1 mes de mis gastos fijos', priority: 'alta', dueInDays: 2 },
      { title: 'Definir un monto fijo de aporte mensual', priority: 'media', dueInDays: 4 },
      { title: 'Elegir/separar una cuenta solo para el fondo', priority: 'media', dueInDays: 5 },
      { title: 'Hacer el primer aporte, aunque sea simbólico', priority: 'media', dueInDays: 6 },
    ],
  },
  // ───────── 📈 Ahorrar 20% automático (mediano) ─────────
  {
    goalTitle: '📈 Ahorrar automáticamente el 20% de mis ingresos',
    domain: 'finanzas',
    tasks: [
      { title: 'Calcular el 20% de mi ingreso mensual', priority: 'media', dueInDays: 7 },
      {
        title: 'Configurar una transferencia automática el día de cobro',
        priority: 'media',
        dueInDays: 10,
      },
      { title: 'Identificar y recortar 1 gasto hormiga este mes', priority: 'baja', dueInDays: 12 },
    ],
  },
  // ───────── 🏆 Libertad financiera (largo) ─────────
  {
    goalTitle: '🏆 Encaminar mi libertad financiera',
    domain: 'finanzas',
    tasks: [
      { title: 'Investigar 1 vehículo de inversión simple', priority: 'baja', dueInDays: 20 },
      { title: 'Definir mi número objetivo de patrimonio', priority: 'media', dueInDays: 21 },
      { title: 'Abrir una cuenta de inversión', priority: 'media', dueInDays: 30 },
    ],
  },
  // ───────── 🚀 Horus usable a diario (corto, featured) ─────────
  {
    goalTitle: '🚀 Dejar Horus usable a diario por mí',
    domain: 'trabajo',
    tasks: [
      { title: 'Listar los bugs bloqueantes actuales de Horus', priority: 'alta', dueInDays: 2 },
      { title: 'Usar Horus 10 minutos al arrancar el día', priority: 'baja', dueInDays: 1 },
      {
        title: 'Cargar mis datos reales (hábitos, cuentas) en la app',
        priority: 'media',
        dueInDays: 4,
      },
      { title: 'Cerrar 1 brecha de paridad mobile en Metas', priority: 'media', dueInDays: 5 },
    ],
  },
  // ───────── 🌱 Lanzar Horus (mediano) ─────────
  {
    goalTitle: '🌱 Lanzar Horus a sus primeros usuarios',
    domain: 'trabajo',
    tasks: [
      {
        title: 'Verificar que el despliegue productivo es estable',
        priority: 'media',
        dueInDays: 14,
      },
      { title: 'Hacer una lista de 10 personas para invitar', priority: 'baja', dueInDays: 18 },
      {
        title: 'Escribir un onboarding mínimo para nuevos usuarios',
        priority: 'baja',
        dueInDays: 21,
      },
    ],
  },
  // ───────── 🎯 Dominar full-stack (largo) ─────────
  {
    goalTitle: '🎯 Dominar arquitectura full-stack de producto',
    domain: 'trabajo',
    tasks: [
      { title: 'Dedicar 30 minutos al día a estudio técnico', priority: 'baja', dueInDays: 14 },
      {
        title: 'Elegir 1 área técnica para profundizar este trimestre',
        priority: 'baja',
        dueInDays: 21,
      },
      { title: 'Armar un plan de aprendizaje de 90 días', priority: 'media', dueInDays: 25 },
    ],
  },
];

async function main() {
  // crear/obtener categorías por dominio (scope 'tareas')
  const categoryIdByDomain = new Map<Domain, string>();
  for (const domain of Object.keys(CATEGORY_DEFS) as Domain[]) {
    const def = CATEGORY_DEFS[domain];
    const cat = await prisma.category.upsert({
      where: { userId_name_scope: { userId: USER_ID, name: def.name, scope: 'tareas' } },
      update: {},
      create: {
        userId: USER_ID,
        name: def.name,
        scope: 'tareas',
        icon: def.icon,
        color: def.color,
      },
      select: { id: true, name: true },
    });
    categoryIdByDomain.set(domain, cat.id);
    console.log(`🗂️  Categoría lista: ${cat.name}`);
  }

  // mapa título -> goalId
  const goals = await prisma.goal.findMany({
    where: { userId: USER_ID, isActive: true },
    select: { id: true, title: true },
  });
  const goalIdByTitle = new Map(goals.map((g) => [g.title, g.id]));

  // títulos de tareas ya existentes para no duplicar
  const existingTasks = await prisma.task.findMany({
    where: { userId: USER_ID },
    select: { title: true },
  });
  const existingTitles = new Set(existingTasks.map((t) => t.title));

  let created = 0;
  let skipped = 0;
  let missingGoals = 0;

  for (const group of groups) {
    const goalId = goalIdByTitle.get(group.goalTitle);
    if (!goalId) {
      console.log(`⚠️  No encontré la meta: ${group.goalTitle} (salto sus tareas)`);
      missingGoals++;
      continue;
    }

    console.log(`\n🎯 ${group.goalTitle}`);
    for (const t of group.tasks) {
      if (existingTitles.has(t.title)) {
        console.log(`   ⏭️  Ya existe: ${t.title}`);
        skipped++;
        continue;
      }

      const task = await prisma.task.create({
        data: {
          userId: USER_ID,
          categoryId: categoryIdByDomain.get(group.domain)!,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: 'pendiente',
          dueDate: inDays(t.dueInDays),
          goalTasks: { create: { goalId } },
        },
      });
      existingTitles.add(task.title);
      console.log(
        `   ✅ ${task.title}  [${t.priority}, vence ${inDays(t.dueInDays).toISOString().slice(0, 10)}]`
      );
      created++;
    }
  }

  console.log(
    `\n📊 Resumen: ${created} tareas creadas, ${skipped} salteadas, ${missingGoals} metas no encontradas.`
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
