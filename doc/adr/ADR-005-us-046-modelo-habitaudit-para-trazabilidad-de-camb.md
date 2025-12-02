# ADR-005: US-046: Modelo HabitAudit para Trazabilidad de Cambios

## Metadata

- **Estado:** Aceptado
- **Fecha:** 2025-11-21
- **Autor:** Claude Code
- **Componentes:** apps/backend/prisma/schema.prisma, apps/backend/prisma/migrations/20250121_add_habit_audit_model/migration.sql, Prisma Client (auto-generado)

---

## 1. Contexto y Problema

### Situación

Necesidad de tener un registro histórico completo de todos los cambios realizados a los hábitos para auditoría, depuración y análisis de patrones de uso. Permite responder preguntas como: ¿Cuándo se modificó este hábito? ¿Qué valores tenía antes? ¿Quién realizó el cambio? ¿Por qué se eliminó/reactivó?

### Problema

Antes de esta implementación no existía forma de rastrear el historial de cambios en los hábitos. Solo se podía ver el estado actual, pero no se sabía cuándo ni cómo había llegado a ese estado. Esta implementación resuelve completamente el problema de trazabilidad y auditoría de cambios en hábitos.

---

## 2. Decisión

### Usar enum ChangeType con valores CREATED, UPDATED, DELETED, REACTIVATED

Permite type-safety a nivel de TypeScript y PostgreSQL. Los valores están claramente definidos y no pueden ser arbitrarios. Facilita queries y filtros por tipo de cambio.

### Almacenar oldValue y newValue como TEXT (JSON string) en lugar de JSONB

Flexibilidad máxima para almacenar cualquier tipo de dato sin necesidad de esquema fijo. Los valores se serializan como JSON strings antes de guardarse. Esto permite registrar cambios en campos de diferentes tipos (string, number, array, object) de forma uniforme.

### Índice compuesto en (habitId, createdAt DESC)

Optimiza la consulta más común: obtener el historial de cambios de un hábito específico ordenado por fecha descendente. El índice permite usar covering index scan para esta query.

### ON DELETE CASCADE para relaciones con Habit y User

Si se elimina físicamente un hábito o usuario (caso excepcional), se eliminan automáticamente sus registros de auditoría. Esto mantiene la integridad referencial sin dejar registros huérfanos.

### Campo reason opcional (VARCHAR 500)

Permite registrar contexto adicional para cambios importantes como eliminaciones o reactivaciones. No es obligatorio para no sobrecargar el flujo de actualización automática, pero está disponible cuando se necesita.

---

## 3. Alternativas Consideradas

### Para: Usar enum ChangeType con valores CREATED, UPDATED, DELETED, REACTIVATED

1. String libre (rechazado por falta de validación)
2. Códigos numéricos (rechazado por menor legibilidad)

### Para: Almacenar oldValue y newValue como TEXT (JSON string) en lugar de JSONB

1. JSONB (rechazado por mayor complejidad sin beneficio claro en este caso de uso)
2. Columnas específicas por tipo (rechazado por falta de flexibilidad)

### Para: Índice compuesto en (habitId, createdAt DESC)

1. Índice simple en habitId (rechazado por requerir sort adicional)
2. Índice simple en createdAt (rechazado por no optimizar filtro por habitId)

### Para: ON DELETE CASCADE para relaciones con Habit y User

1. ON DELETE RESTRICT (rechazado porque impediría eliminar hábitos/usuarios)
2. ON DELETE SET NULL (rechazado porque perdería el contexto del audit)

### Para: Campo reason opcional (VARCHAR 500)

1. Campo obligatorio (rechazado por dificultar auditoría automática)
2. Sin campo reason (rechazado porque elimina contexto valioso para ciertos cambios)

---

## 4. Consecuencias

### Positivas

- Resuelve: Antes de esta implementación no existía forma de rastrear el historial de cambios en los hábitos. Solo se podía ver el estado actual, pero no se sabía cuándo ni cómo había llegado a ese estado. Esta implementación resuelve completamente el problema de trazabilidad y auditoría de cambios en hábitos.
- Componentes mejorados: apps/backend/prisma/schema.prisma, apps/backend/prisma/migrations/20250121_add_habit_audit_model/migration.sql, Prisma Client (auto-generado)

### Trade-offs

- Si en el futuro se necesitan nuevos tipos de cambio, se requiere una migración para agregar valores al enum. Sin embargo, esto es preferible a tener valores inconsistentes en la base de datos.
- Queries sobre los valores almacenados requieren deserialización. Sin embargo, el caso de uso principal es consultar el historial completo de un hábito, no filtrar por valores específicos dentro del JSON.
- El índice consume espacio adicional en disco, pero el beneficio en performance para la query principal justifica el costo.
- Si se elimina físicamente un hábito, se pierde su historial de auditoría. Sin embargo, esto es consistente con el soft delete pattern usado en Habit (isActive=false), donde la eliminación física es excepcional.
- Al ser opcional, algunos registros pueden carecer de contexto. Sin embargo, esto permite flexibilidad en la implementación.

---

## 5. Implementación

**Fecha:** 2025-11-21
**Sprint:** sprint-06
**Archivos:** apps/backend/prisma/schema.prisma, apps/backend/prisma/migrations/20250121_add_habit_audit_model/migration.sql

---

## 6. Referencias

N/A

- US-046

---

**Generado automáticamente por MCP Document Change System**
