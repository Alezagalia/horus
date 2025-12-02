# Technical Task #1: Cron Job de Generación Automática de Instancias Mensuales

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** TECH-001
**Título:** Cron Job de Generación Automática de Instancias Mensuales
**Tipo:** Infrastructure

## Descripción

Implementar un cron job que se ejecute automáticamente el día 1 de cada mes a las 00:01 para generar las instancias mensuales (MonthlyExpenseInstance) de todos los gastos recurrentes activos de todos los usuarios.

## Razón

Este es el componente central del sistema de gastos recurrentes. La generación automática mensual elimina la necesidad de que los usuarios creen manualmente sus gastos cada mes, proporcionando una experiencia fluida y sin fricción.

## Criterios de Aceptación

- [ ] Configurar librería de cron jobs (node-cron, bull, o agenda)
- [ ] Crear función `generateMonthlyExpenses(month, year)`:
  - Obtener todos los RecurringExpense con isActive = true
  - Para cada RecurringExpense:
    - Verificar si ya existe MonthlyExpenseInstance para ese mes/año (skip si existe)
    - Buscar instancia del mes anterior para obtener previousAmount
    - Crear MonthlyExpenseInstance:
      - recurringExpenseId
      - month, year
      - concept = RecurringExpense.concept
      - categoryId = RecurringExpense.categoryId
      - amount = 0
      - previousAmount = monto del mes anterior (si existe)
      - status = "pendiente"
      - userId
  - Logging de cada instancia creada
  - Manejo de errores por usuario (si falla uno, continuar con siguiente)
- [ ] Configurar cron schedule: `'1 0 1 * *'` (minuto 1, hora 0, día 1 de cada mes)
- [ ] Implementar endpoint manual `POST /api/admin/generate-monthly-expenses` para testing
  - Protegido con rol admin o token especial
  - Permite especificar mes/año
  - Útil para regenerar si hubo error
- [ ] Tests:
  - Test unitario de función generateMonthlyExpenses
  - Test de duplicados (no crear si ya existe)
  - Test de previousAmount correcto
  - Mock de date para simular cambio de mes
- [ ] Logging y monitoreo:
  - Log de inicio y fin de job
  - Log de cantidad de instancias creadas
  - Log de errores
  - Opcional: integración con Sentry para alertas

## Tareas Técnicas

- [ ] Configurar librería de cron jobs (node-cron, bull, o agenda) - [1h]
- [ ] Implementar función generateMonthlyExpenses - [3h]
- [ ] Crear endpoint admin para ejecución manual - [1h]
- [ ] Configurar schedule y logging - [1h]
- [ ] Escribir tests (unitarios y mocks de fecha) - [3h]
- [ ] Implementar alertas y monitoreo - [1h]

## Algoritmo Detallado

```javascript
async function generateMonthlyExpenses(month: number, year: number) {
  console.log(`[CRON] Iniciando generación de gastos mensuales para ${month}/${year}`);

  // 1. Obtener todos los gastos recurrentes activos
  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { isActive: true }
  });

  console.log(`[CRON] Encontrados ${recurringExpenses.length} gastos recurrentes activos`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const expense of recurringExpenses) {
    try {
      // 2. Verificar si ya existe instancia para este mes
      const existing = await prisma.monthlyExpenseInstance.findFirst({
        where: {
          recurringExpenseId: expense.id,
          month,
          year
        }
      });

      if (existing) {
        skipped++;
        continue; // Ya existe, skip
      }

      // 3. Buscar instancia del mes anterior para previousAmount
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;

      const previousInstance = await prisma.monthlyExpenseInstance.findFirst({
        where: {
          recurringExpenseId: expense.id,
          month: previousMonth,
          year: previousYear,
          status: 'pagado' // Solo considerar si fue pagado
        }
      });

      const previousAmount = previousInstance?.amount || 0;

      // 4. Crear nueva instancia
      await prisma.monthlyExpenseInstance.create({
        data: {
          recurringExpenseId: expense.id,
          userId: expense.userId,
          month,
          year,
          concept: expense.concept,
          categoryId: expense.categoryId,
          amount: 0, // Siempre 0 hasta que se pague
          previousAmount,
          status: 'pendiente'
        }
      });

      created++;
    } catch (error) {
      console.error(`[CRON] Error procesando gasto ${expense.id}:`, error);
      errors++;
      // Continuar con el siguiente
    }
  }

  console.log(`[CRON] Finalizado: ${created} creados, ${skipped} omitidos, ${errors} errores`);
}

// Configurar cron
cron.schedule('1 0 1 * *', async () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  await generateMonthlyExpenses(month, year);
});
```

## Componentes Afectados

- **backend:** Cron jobs, Monthly expense generation service, Admin endpoints

## Dependencias

- US-083 (modelos de base de datos)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
