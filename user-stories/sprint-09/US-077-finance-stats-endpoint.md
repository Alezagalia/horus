# US-077: Endpoint de Estadísticas Financieras

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-077
**Título:** Endpoint de Estadísticas Financieras

## Descripción

Como usuario, quiero ver estadísticas de mis finanzas (ingresos, egresos, balance), para entender mi situación financiera actual.

## Criterios de Aceptación

- [ ] Endpoint `GET /api/finance/stats` devuelve estadísticas:
  - Query params: month (1-12), year (YYYY) - default: mes actual
  - Respuesta incluye:
    - totalIngresos: suma de ingresos del mes
    - totalEgresos: suma de egresos del mes
    - balance: totalIngresos - totalEgresos
    - porCategoria: array de {categoryId, categoryName, totalAmount, percentage}
    - evolucionMensual: array de últimos 6 meses con {month, year, ingresos, egresos, balance}
    - cuentasResumen: array de {accountId, accountName, currentBalance, currency}
  - Todos los montos en la moneda de cada cuenta (no conversión para MVP)
- [ ] Cálculos correctos considerando solo transacciones del rango de fechas
- [ ] Porcentajes calculados correctamente (% del total de egresos)
- [ ] Response time < 500ms (puede ser query compleja)

## Tareas Técnicas

- [ ] Crear service `financeStats.service.ts` - [2h]
- [ ] Implementar cálculo de totales por mes - [1.5h]
- [ ] Implementar agrupación por categoría con percentages - [2h]
- [ ] Implementar evolución mensual (últimos 6 meses) - [2h]
- [ ] Implementar resumen de cuentas - [1h]
- [ ] Crear controller y route - [0.5h]
- [ ] Tests unitarios del service - [2.5h]
- [ ] Tests con diferentes rangos de fechas - [1.5h]
- [ ] Optimización de queries (usar aggregations de Prisma) - [1h]
- [ ] Documentación de API - [0.5h]

## Componentes Afectados

- **backend:** Finance stats service, controller, aggregation queries

## Dependencias

- US-075 debe estar completa

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
