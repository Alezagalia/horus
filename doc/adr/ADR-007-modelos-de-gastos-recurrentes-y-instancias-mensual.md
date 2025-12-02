# ADR-007: Modelos de gastos recurrentes y instancias mensuales

## Metadata

- **Estado:** Aceptado
- **Fecha:** 2025-11-23
- **Autor:** Claude Code
- **Componentes:** apps/backend/prisma

---

## 1. Contexto y Problema

### Situación

Los usuarios necesitan gestionar gastos recurrentes mensuales (alquiler, servicios, suscripciones) de forma eficiente sin tener que crear manualmente la misma transacción cada mes. Se requiere un sistema que permita definir plantillas de gastos y generar automáticamente instancias mensuales que el usuario pueda editar, marcar como pagadas, y asociar a cuentas específicas.

### Problema

Antes no existía forma de gestionar gastos recurrentes automáticamente. Los usuarios debían recordar y crear manualmente cada gasto mensual, sin historial de montos anteriores ni tracking de estado de pago. Ahora se puede definir plantillas y generar instancias automáticamente cada mes.

---

## 2. Decisión

### Separar plantilla (RecurringExpense) de instancias (MonthlyExpenseInstance)

Permite modificar plantilla sin afectar instancias ya generadas, mantener historial de montos anteriores, y tener flexibilidad para ajustar montos mes a mes

### MonthlyExpenseInstance almacena concept y categoryId propios

Permitir que el usuario modifique concepto o categoría de una instancia específica sin afectar la plantilla ni otras instancias

### previousAmount nullable para tracking de cambios

Permitir comparar monto actual con monto del mes anterior para detectar aumentos/disminuciones de servicios

### accountId nullable hasta que se pague

El gasto puede estar pendiente sin cuenta asignada, solo al marcarlo como pagado se asocia a cuenta específica

### Unique constraint en recurringExpenseId + month + year

Prevenir duplicados: solo una instancia por gasto recurrente por mes

### Índice compuesto en userId + month + year + status

Query frecuente: obtener gastos pendientes o pagados de un mes específico para un usuario

### onDelete: Cascade para RecurringExpense

Al eliminar plantilla, eliminar automáticamente todas las instancias generadas (limpieza completa)

### onDelete: SetNull para Account en MonthlyExpenseInstance

Si se elimina cuenta, no perder el registro de gasto, solo desvincular la cuenta

---

## 3. Alternativas Consideradas

### Para: Separar plantilla (RecurringExpense) de instancias (MonthlyExpenseInstance)

1. Modelo único con flag isTemplate
2. Almacenar solo instancias sin plantilla

### Para: MonthlyExpenseInstance almacena concept y categoryId propios

1. Referenciar solo a RecurringExpense
2. Computed fields desde plantilla

### Para: previousAmount nullable para tracking de cambios

1. Calcular dinámicamente desde instancia anterior
2. No almacenar

### Para: accountId nullable hasta que se pague

1. accountId requerido siempre
2. Cuenta default por usuario

### Para: Unique constraint en recurringExpenseId + month + year

1. Permitir múltiples instancias
2. Constraint en userId + concept + month + year

### Para: Índice compuesto en userId + month + year + status

1. Índices separados
2. Solo índice en userId

### Para: onDelete: Cascade para RecurringExpense

1. SetNull
2. Restrict

### Para: onDelete: SetNull para Account en MonthlyExpenseInstance

1. Restrict (prevenir eliminación)
2. Cascade (eliminar gasto)

---

## 4. Consecuencias

### Positivas

- Resuelve: Antes no existía forma de gestionar gastos recurrentes automáticamente. Los usuarios debían recordar y crear manualmente cada gasto mensual, sin historial de montos anteriores ni tracking de estado de pago. Ahora se puede definir plantillas y generar instancias automáticamente cada mes.
- Componentes mejorados: apps/backend/prisma

### Trade-offs

- Dos modelos pero mayor flexibilidad y claridad
- Duplicación de datos pero flexibilidad total
- Campo adicional pero query más eficiente
- Null handling pero workflow más flexible
- Rigidez pero garantía de consistencia
- Índice más grande pero query optimizada
- Pérdida de historial pero limpieza automática
- Gastos huérfanos pero preservación de historial

---

## 5. Implementación

**Fecha:** 2025-11-23
**Sprint:** Sprint 10
**Archivos:** apps/backend/prisma/schema.prisma (modificado - agregados 2 modelos + 1 enum)

---

## 6. Referencias

N/A

- Sprint 9 - Modelos Account, Transaction, Category (dependencias)
- US-084 - Endpoints CRUD de gastos recurrentes (siguiente)
- US-085 - Generación automática de instancias mensuales (siguiente)

---

**Generado automáticamente por MCP Document Change System**
