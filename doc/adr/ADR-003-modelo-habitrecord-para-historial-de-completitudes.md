# ADR-003: Modelo HabitRecord para Historial de Completitudes (US-028)

## Metadata

- **Estado:** Aceptado
- **Fecha:** 2025-11-21
- **Autor:** Claude Code
- **Componentes:** apps/backend/prisma/schema.prisma, apps/backend/prisma/migrations/20250121000000_add_habit_records/migration.sql, @prisma/client (generated types)

---

## 1. Contexto y Problema

### Situación

Fundamentar sistema de rachas, estad\u00edsticas y progreso hist\u00f3rico. Sin este modelo es imposible calcular rachas actuales, r\u00e9cords, tasas de completitud, o generar gr\u00e1ficos de progreso temporal.

### Problema

Resuelve almacenamiento de datos temporales de h\u00e1bitos. Permite queries eficientes para: historial de un h\u00e1bito espec\u00edfico, h\u00e1bitos completados por d\u00eda, c\u00e1lculo de rachas consecutivas, estad\u00edsticas agregadas (promedio, total, tasa), gr\u00e1ficos de progreso mensual/anual.

---

## 2. Decisión

### Float para campo value (DOUBLE PRECISION)

Suficiente precisión para valores típicos de hábitos (peso, distancia, cantidad). Más performante que Decimal.

### Índice único compuesto (habitId, userId, date)

Previene duplicados críticos para integridad de rachas. Un hábito solo puede registrarse una vez por día.

### Índices en (userId, date) y (habitId, date)

Optimizan queries más comunes: dashboard diario por usuario, historial de hábito específico.

### ON DELETE CASCADE para ambas FKs

Eliminar usuario/hábito debe eliminar sus records automáticamente (integridad referencial).

### Campo date como DATE (no TIMESTAMP)

Hábitos se registran por día completo, no por hora específica. DATE reduce espacio y simplifica queries de rango.

---

## 3. Alternativas Consideradas

### Para: Float para campo value (DOUBLE PRECISION)

1. Decimal
2. Int

### Para: Índice único compuesto (habitId, userId, date)

1. Sin constraint
2. Índice no único

### Para: Índices en (userId, date) y (habitId, date)

1. Sin índices
2. Solo índice en date

### Para: ON DELETE CASCADE para ambas FKs

1. RESTRICT
2. SET NULL

### Para: Campo date como DATE (no TIMESTAMP)

1. TIMESTAMP
2. VARCHAR

---

## 4. Consecuencias

### Positivas

- Resuelve: Resuelve almacenamiento de datos temporales de h\u00e1bitos. Permite queries eficientes para: historial de un h\u00e1bito espec\u00edfico, h\u00e1bitos completados por d\u00eda, c\u00e1lculo de rachas consecutivas, estad\u00edsticas agregadas (promedio, total, tasa), gr\u00e1ficos de progreso mensual/anual.
- Componentes mejorados: apps/backend/prisma/schema.prisma, apps/backend/prisma/migrations/20250121000000_add_habit_records/migration.sql, @prisma/client (generated types)

### Trade-offs

- Float: performance vs Decimal: máxima precisión. Para tracking de hábitos Float es suficiente.
- Requiere upsert pattern en application pero garantiza integridad de datos.
- Espacio vs velocidad. Con >10k records los índices dan 10-100x mejora.
- CASCADE simplifica cleanup pero elimina histórico. Soft delete de hábitos mitiga esto.
- DATE: solo día vs TIMESTAMP: precisión temporal. Para hábitos DATE es semánticamente correcto.

---

## 5. Implementación

**Fecha:** 2025-11-21
**Sprint:** sprint-04
**Archivos:** apps/backend/prisma/schema.prisma

---

## 6. Referencias

N/A

- US-028

---

**Generado automáticamente por MCP Document Change System**
