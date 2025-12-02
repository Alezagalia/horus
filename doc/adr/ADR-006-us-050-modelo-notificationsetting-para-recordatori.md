# ADR-006: US-050: Modelo NotificationSetting para Recordatorios

## Metadata

- **Estado:** Aceptado
- **Fecha:** 2025-11-21
- **Autor:** Claude Code
- **Componentes:** apps/backend/prisma/schema.prisma, apps/backend/prisma/migrations/20250122_add_notification_settings/migration.sql, Prisma Client (auto-generado)

---

## 1. Contexto y Problema

### Situación

Necesidad de almacenar configuración de recordatorios personalizada por hábito para implementar sistema de notificaciones push. Cada hábito puede tener un horario específico de recordatorio diferente al resto, y los usuarios deben poder habilitar/deshabilitar notificaciones individualmente. El modelo permite queries eficientes para cron jobs que envían notificaciones en batch.

### Problema

Antes de esta implementación, aunque el modelo Habit tenía campo reminderTime, no existía forma de almacenar configuración completa de notificaciones (enabled/disabled, relación explícita). Esta implementación crea la infraestructura de datos necesaria para un sistema robusto de notificaciones con control granular por hábito.

---

## 2. Decisión

### Relación 1:1 con Habit mediante UNIQUE constraint en habitId

Un hábito solo debe tener una configuración de notificación. El UNIQUE constraint a nivel de DB previene duplicados y garantiza integridad. En Prisma se modela como NotificationSetting? (opcional) en Habit.

### Campo time como VARCHAR(5) para formato HH:mm

Formato string simple y legible (ej: '08:00', '20:30'). Fácil de validar con regex, portable entre zonas horarias (se interpreta como hora local), y suficiente para casos de uso actuales.

### Campo enabled como Boolean con default true

Permite habilitar/deshabilitar notificaciones sin eliminar la configuración. Default true asume que si existe NotificationSetting, el usuario quiere notificaciones.

### Índice compuesto en (userId, enabled)

Optimiza query principal del cron job: 'obtener todas las notificaciones habilitadas de un usuario'. El índice permite usar covering index scan para esta query frecuente.

### ON DELETE CASCADE para relaciones con Habit y User

Si se elimina un hábito o usuario, la configuración de notificaciones queda huérfana y sin utilidad. CASCADE elimina automáticamente estos registros manteniendo integridad.

### Incluir userId redundante además de habitId

Permite queries rápidas en cron jobs sin JOIN a tabla habits. La redundancia mejora performance drásticamente para consultas frecuentes del scheduler.

---

## 3. Alternativas Consideradas

### Para: Relación 1:1 con Habit mediante UNIQUE constraint en habitId

1. Relación 1:N permitiendo múltiples horarios por hábito (rechazado por over-engineering para MVP)
2. Embeber configuración en modelo Habit (rechazado por mezclar concerns)

### Para: Campo time como VARCHAR(5) para formato HH:mm

1. Tipo TIME de PostgreSQL (rechazado por complejidad innecesaria)
2. Timestamp completo (rechazado porque solo necesitamos hora del día)
3. Minutos desde medianoche como integer (rechazado por menor legibilidad)

### Para: Campo enabled como Boolean con default true

1. Sin campo enabled, eliminar registro para deshabilitar (rechazado porque se pierde configuración de hora)
2. Tres estados (enabled/disabled/snoozed) (rechazado por over-engineering)

### Para: Índice compuesto en (userId, enabled)

1. Índice simple en enabled (rechazado porque no filtra por usuario eficientemente)
2. Índice en time para ordenar (rechazado como menos prioritario que filtro por usuario)

### Para: ON DELETE CASCADE para relaciones con Habit y User

1. ON DELETE RESTRICT (rechazado porque impediría eliminar hábitos)
2. ON DELETE SET NULL (rechazado porque NotificationSetting sin hábito no tiene sentido)

### Para: Incluir userId redundante además de habitId

1. Solo habitId, hacer JOIN a habits para obtener userId (rechazado por overhead de JOIN en cada ejecución de cron)

---

## 4. Consecuencias

### Positivas

- Resuelve: Antes de esta implementación, aunque el modelo Habit tenía campo reminderTime, no existía forma de almacenar configuración completa de notificaciones (enabled/disabled, relación explícita). Esta implementación crea la infraestructura de datos necesaria para un sistema robusto de notificaciones con control granular por hábito.
- Componentes mejorados: apps/backend/prisma/schema.prisma, apps/backend/prisma/migrations/20250122_add_notification_settings/migration.sql, Prisma Client (auto-generado)

### Trade-offs

- Si en el futuro se necesitan múltiples horarios por hábito, requerirá refactoring, pero esto es improbable y la simplicidad actual es preferible.
- Requiere validación en aplicación del formato HH:mm, pero la simplicidad y legibilidad lo justifican.
- Requiere query adicional para filtrar por enabled=true, pero el índice (userId, enabled) lo optimiza.
- El índice consume espacio, pero el beneficio en performance para cron jobs justifica ampliamente el costo.
- Si se elimina hábito accidentalmente, se pierde configuración de notificación, pero esto es consistente con soft delete pattern de Habit (isActive=false).
- Requiere mantener consistencia (userId debe coincidir con habit.userId), pero Prisma lo garantiza en creación.

---

## 5. Implementación

**Fecha:** 2025-11-21
**Sprint:** sprint-06
**Archivos:** apps/backend/prisma/schema.prisma

---

## 6. Referencias

N/A

- US-050

---

**Generado automáticamente por MCP Document Change System**
