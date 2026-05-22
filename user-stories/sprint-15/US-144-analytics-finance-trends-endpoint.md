# US-144: Endpoint de Tendencias de Finanzas con Proyección

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 15
**Story Points:** 6
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** ver mi gasto mensual por categoría a lo largo del tiempo, con una proyección del mes en curso
**Para** detectar tendencias, comparar evolución entre categorías y anticipar el cierre del mes

---

## Criterios de Aceptación

### 1. Endpoint

`GET /api/analytics/finance/trends?months=6`

- Requiere `authMiddleware`.
- Valida query con `financeTrendsQuerySchema` (US-141): `months` entre 1 y 24, default 6.
- El rango incluye al mes en curso (parcial) y los `months - 1` meses anteriores completos.

### 2. Response 200

```json
{
  "months": ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05"],
  "series": [
    {
      "categoryId": "cat_comida",
      "categoryName": "Comida",
      "color": "#F97316",
      "points": [
        { "month": "2025-12", "amount": 45200 },
        { "month": "2026-01", "amount": 48700 },
        { "month": "2026-02", "amount": 43100 },
        { "month": "2026-03", "amount": 51000 },
        { "month": "2026-04", "amount": 47800 },
        { "month": "2026-05", "amount": 28400 }
      ]
    },
    {
      "categoryId": "cat_transporte",
      "categoryName": "Transporte",
      "color": "#3B82F6",
      "points": [
        { "month": "2025-12", "amount": 18000 },
        { "month": "2026-01", "amount": 19500 },
        { "month": "2026-02", "amount": 17200 },
        { "month": "2026-03", "amount": 20000 },
        { "month": "2026-04", "amount": 18900 },
        { "month": "2026-05", "amount": 11200 }
      ]
    }
  ],
  "projection": {
    "month": "2026-05",
    "projectedTotal": 91400,
    "daysElapsed": 21,
    "daysInMonth": 31
  }
}
```

### 3. Reglas de cálculo

**Series**

- Una serie por cada `Category` con `scope='expense'` (o equivalente) que tenga al menos 1 transacción en el rango.
- Si una categoría tiene 0 transacciones en un mes específico → `amount: 0` (no omitir el punto).
- `amount` = suma de `Transaction.amount` con `type='EXPENSE'` agrupado por `categoryId` y mes.
- Ordenar series desc por `total acumulado del rango`.
- Si una categoría está eliminada pero tuvo movimientos → mostrarla con `categoryName` archivado y `color: null`.

**Proyección**

- Solo aplica al mes en curso. `projection: null` si el rango no incluye el mes actual.
- `projectedTotal` = `(gastoTotalDelMesHastaHoy / diasTranscurridosDelMes) * diasDelMes`.
- Considerar `daysElapsed = día actual del mes` (1-indexed, incluyendo hoy).
- Considerar `daysInMonth` correctamente para febrero y meses de 30/31 días.
- `projectedTotal` redondeado a 2 decimales.

**Incluye también gastos recurrentes (`MonthlyExpenseInstance`)**

- Cuentan como `EXPENSE` si están marcadas como pagadas en ese mes.
- Se imputan a la categoría de la `RecurringExpense` original.

### 4. Performance

- p95 < 700ms con 24 meses de datos.
- Query única agrupada por `(categoryId, mes)` — usar `Prisma.$queryRaw` con `date_trunc` si es necesario para PostgreSQL.

### 5. Errores

- `401`, `400` (validación Zod), `500` con Sentry.

---

## Tareas Técnicas

1. **Helper `monthRange(months)` para construir lista de YYYY-MM** — [0.5h]
2. **Query agrupada por categoría y mes con Prisma** — [2h]
3. **Merge de transacciones + instancias de gastos recurrentes** — [1.5h]
4. **Cálculo de proyección lineal del mes en curso** — [1h]
5. **Handler y ruta en `analytics.controller.ts` / `analytics.routes.ts`** — [0.5h]
6. **Tests unitarios de proyección (cubrir meses 28, 30, 31 días)** — [1.5h]
7. **Test de integración** — [1.5h]

---

## Definition of Done

- [ ] Endpoint en `/api/analytics/finance/trends`
- [ ] Proyección correcta para mes en curso, ausente para meses pasados
- [ ] Categorías eliminadas con transacciones aparecen con color null
- [ ] Tests > 80% cobertura
- [ ] p95 < 700ms en staging
- [ ] Deploy a staging
- [ ] Code review aprobado

---

**Estimación:** 6 SP | 8.5h
**Bloqueada por:** US-141
**Bloqueante de:** US-149
