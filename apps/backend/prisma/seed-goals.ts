/**
 * Seed de metas personales (corto / mediano / largo plazo)
 * 3 dominios: Salud-Fitness, Finanzas, Conocimiento-Carrera (Horus)
 * Cada meta incluye Key Results medibles (currentValue crece hacia targetValue).
 * Ejecutar: cd apps/backend && npx tsx prisma/seed-goals.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

const USER_ID = '2691c4f2-e94c-4d97-993a-0efc24b90899'; // alezagalia@gmail.com

type Priority = 'alta' | 'media' | 'baja';

interface KR {
  title: string;
  targetValue: number;
  currentValue?: number;
  unit?: string;
}

interface GoalSeed {
  title: string;
  description: string;
  priority: Priority;
  targetDate: string; // ISO
  isFeatured?: boolean;
  keyResults: KR[];
}

// Hoy: 2026-06-16 — Corto ~3m, Mediano ~9-12m, Largo ~3-5a
const goals: GoalSeed[] = [
  // ───────────────── SALUD / FITNESS ─────────────────
  {
    title: '💪 Construir el hábito de entrenar 3x por semana',
    description:
      'CORTO PLAZO (Salud). El objetivo no es rendimiento sino consistencia: instalar el entrenamiento como rutina innegociable. Tres sesiones semanales, sin importar la intensidad. La métrica que manda es la adherencia, no el peso levantado. Si fallo una semana, retomo sin culpa al siguiente bloque. Vinculá tus hábitos de "Ir al gym / Entrenar" a esta meta para que el progreso se actualice solo.',
    priority: 'alta',
    targetDate: '2026-09-15',
    keyResults: [
      { title: 'Semanas consecutivas entrenando 3x', targetValue: 8, unit: 'semanas' },
      { title: 'Sesiones de entrenamiento completadas', targetValue: 24, unit: 'sesiones' },
      { title: 'Adherencia al plan semanal', targetValue: 90, unit: '%' },
    ],
  },
  {
    title: '🏃 Correr 10 km sin parar',
    description:
      'MEDIANO PLAZO (Salud). Una vez instalado el hábito base, sumo un objetivo de resistencia concreto y motivador. Plan progresivo tipo "couch to 10k": empezar con intervalos caminar/correr y subir distancia continua semana a semana. El hito es cruzar los 10 km de corrido en una sola sesión.',
    priority: 'media',
    targetDate: '2027-03-15',
    keyResults: [
      { title: 'Distancia continua máxima alcanzada', targetValue: 10, unit: 'km' },
      { title: 'Plan de entrenamiento completado', targetValue: 100, unit: '%' },
      { title: 'Carreras de práctica realizadas', targetValue: 20, unit: 'carreras' },
    ],
  },
  {
    title: '🧗 Hacer del ejercicio parte de mi identidad',
    description:
      'LARGO PLAZO (Salud). El cambio definitivo: pasar de "tengo que entrenar" a "soy alguien que entrena". Se mide por permanencia en el tiempo, no por picos. Dos años sostenidos con un piso mínimo mensual y rachas largas sin abandonar consolidan el hábito como rasgo, no como esfuerzo.',
    priority: 'media',
    targetDate: '2029-06-15',
    keyResults: [
      { title: 'Meses con 12 o más entrenamientos', targetValue: 24, unit: 'meses' },
      { title: 'Racha más larga sin abandonar', targetValue: 52, unit: 'semanas' },
    ],
  },

  // ───────────────── FINANZAS ─────────────────
  {
    title: '💵 Armar un fondo de emergencia de 1 mes de gastos',
    description:
      'CORTO PLAZO (Finanzas). El primer ladrillo de cualquier salud financiera: un colchón líquido equivalente a un mes completo de gastos fijos. Se construye con aportes mensuales automáticos apenas entra el ingreso ("pagarme a mí primero"). Usá tus cuentas y transacciones de Horus para medir el avance real.',
    priority: 'alta',
    targetDate: '2026-09-15',
    keyResults: [
      { title: 'Meses de gastos cubiertos por el fondo', targetValue: 1, unit: 'meses' },
      { title: 'Aportes mensuales realizados', targetValue: 3, unit: 'aportes' },
      { title: 'Avance hacia el monto objetivo', targetValue: 100, unit: '%' },
    ],
  },
  {
    title: '📈 Ahorrar automáticamente el 20% de mis ingresos',
    description:
      'MEDIANO PLAZO (Finanzas). Convertir el ahorro en un sistema, no en una decisión mensual. Configurar una transferencia automática del 20% del ingreso a una cuenta de ahorro/inversión el mismo día del cobro. La meta se cumple cuando el 20% es sostenido y el fondo de emergencia escala a 3 meses de gastos.',
    priority: 'alta',
    targetDate: '2027-06-15',
    keyResults: [
      { title: 'Tasa de ahorro mensual lograda', targetValue: 20, unit: '%' },
      { title: 'Meses cumpliendo la meta de ahorro', targetValue: 9, unit: 'meses' },
      { title: 'Fondo de emergencia ampliado', targetValue: 3, unit: 'meses de gastos' },
    ],
  },
  {
    title: '🏆 Encaminar mi libertad financiera',
    description:
      'LARGO PLAZO (Finanzas). El horizonte mayor: que mis ingresos pasivos cubran una porción creciente de mis gastos, sostenidos por inversiones diversificadas. No es "ser rico" sino comprar opcionalidad y tranquilidad. Definí tu número concreto de patrimonio objetivo y medí el avance contra él año a año.',
    priority: 'media',
    targetDate: '2031-06-15',
    keyResults: [
      { title: 'Avance hacia el patrimonio neto objetivo', targetValue: 100, unit: '%' },
      { title: 'Cobertura de gastos por ingresos pasivos', targetValue: 100, unit: '%' },
      { title: 'Vehículos de inversión diversificados activos', targetValue: 3, unit: 'vehículos' },
    ],
  },

  // ───────────────── CONOCIMIENTO / CARRERA (HORUS) ─────────────────
  {
    title: '🚀 Dejar Horus usable a diario por mí',
    description:
      'CORTO PLAZO (Carrera). El mejor producto es el que su autor usa. El objetivo es pulir Horus hasta que sea mi herramienta diaria real, sin fricciones ni bugs bloqueantes, con paridad entre web y mobile en las features clave (hábitos, tareas, finanzas, metas). Dogfooding total: si yo no lo uso todos los días, no está listo.',
    priority: 'alta',
    targetDate: '2026-09-15',
    isFeatured: true,
    keyResults: [
      { title: 'Features core sin bugs bloqueantes', targetValue: 100, unit: '%' },
      { title: 'Días consecutivos usando la app', targetValue: 30, unit: 'días' },
      { title: 'Paridad web/mobile en features clave', targetValue: 100, unit: '%' },
    ],
  },
  {
    title: '🌱 Lanzar Horus a sus primeros usuarios',
    description:
      'MEDIANO PLAZO (Carrera). Sacar Horus de "proyecto personal" a "producto con usuarios". Despliegue productivo estable, onboarding básico, e invitar a un primer grupo reducido para recoger feedback real e iterar. El éxito se mide en usuarios activos y en ciclos de feedback procesados, no en features agregadas.',
    priority: 'media',
    targetDate: '2027-06-15',
    keyResults: [
      { title: 'Usuarios activos invitados', targetValue: 10, unit: 'usuarios' },
      { title: 'Uptime del despliegue productivo', targetValue: 99, unit: '%' },
      { title: 'Items de feedback recogidos e iterados', targetValue: 20, unit: 'items' },
    ],
  },
  {
    title: '🎯 Dominar arquitectura full-stack de producto',
    description:
      'LARGO PLAZO (Carrera). Consolidar un dominio técnico que me posicione: diseñar, construir y operar productos completos de punta a punta (backend, web, mobile, infra, datos). Horus es el primer caso; la meta es acumular proyectos end-to-end y profundidad que se traduzcan en autoridad y oportunidades.',
    priority: 'media',
    targetDate: '2029-06-15',
    keyResults: [
      { title: 'Proyectos completos end-to-end construidos', targetValue: 3, unit: 'proyectos' },
      {
        title: 'Áreas técnicas dominadas (back/front/mobile/infra/datos)',
        targetValue: 5,
        unit: 'áreas',
      },
      { title: 'Avance del plan de aprendizaje', targetValue: 100, unit: '%' },
    ],
  },
];

async function main() {
  // metas ya existentes del usuario para no duplicar
  const existing = await prisma.goal.findMany({
    where: { userId: USER_ID },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((g) => g.title));

  let created = 0;
  let skipped = 0;

  for (const g of goals) {
    if (existingTitles.has(g.title)) {
      console.log(`⏭️  Ya existe, salto: ${g.title}`);
      skipped++;
      continue;
    }

    const goal = await prisma.goal.create({
      data: {
        userId: USER_ID,
        title: g.title,
        description: g.description,
        priority: g.priority,
        status: 'en_progreso',
        targetDate: new Date(g.targetDate),
        isFeatured: g.isFeatured ?? false,
        keyResults: {
          create: g.keyResults.map((kr) => ({
            title: kr.title,
            targetValue: kr.targetValue,
            currentValue: kr.currentValue ?? 0,
            unit: kr.unit,
          })),
        },
      },
      include: { keyResults: true },
    });

    console.log(`✅ Creada: ${goal.title}  (${goal.keyResults.length} KRs)`);
    created++;
  }

  console.log(`\n📊 Resumen: ${created} creadas, ${skipped} salteadas, ${goals.length} totales.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
