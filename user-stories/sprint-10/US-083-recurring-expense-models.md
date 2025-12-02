# US-083: Modelos de Gastos Recurrentes y Instancias Mensuales en Base de Datos

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-083
**Título:** Modelos de Gastos Recurrentes y Instancias Mensuales en Base de Datos

## Descripción

Como desarrollador backend, quiero definir los modelos de base de datos para RecurringExpense y MonthlyExpenseInstance, para almacenar plantillas de gastos recurrentes y las instancias mensuales generadas.

## Criterios de Aceptación

- [ ] Modelo `RecurringExpense` creado con campos: id, concept, categoryId, amount (siempre 0 en plantilla), currency, isActive, userId, createdAt, updatedAt
- [ ] Modelo `MonthlyExpenseInstance` creado con campos: id, recurringExpenseId, month, year, concept, categoryId, amount, previousAmount, accountId, paidDate, status, notes, userId, createdAt, updatedAt
- [ ] Enum `ExpenseStatus` con valores: `pendiente`, `pagado`
- [ ] Relaciones configuradas correctamente:
  - RecurringExpense ↔ MonthlyExpenseInstance (1:N)
  - MonthlyExpenseInstance → Category (N:1)
  - MonthlyExpenseInstance → Account (N:1, nullable hasta que se pague)
  - MonthlyExpenseInstance → User (N:1)
- [ ] Índices creados para queries frecuentes:
  - `@@index([userId, isActive])` en RecurringExpense
  - `@@index([userId, month, year, status])` en MonthlyExpenseInstance
  - `@@index([recurringExpenseId])` en MonthlyExpenseInstance
- [ ] Migración de Prisma ejecutada exitosamente en desarrollo y staging
- [ ] Seed opcional: Categorías de tipo "gastos" si no existen (Servicios, Alquiler, Suscripciones)

## Tareas Técnicas

- [ ] Definir schema de Prisma para RecurringExpense y MonthlyExpenseInstance - [2h]
- [ ] Configurar relaciones con Category, Account, User - [1h]
- [ ] Crear y ejecutar migración - [1h]
- [ ] Validar estructura de tablas en PostgreSQL - [0.5h]
- [ ] Seed de categorías de gastos - [0.5h]

## Componentes Afectados

- **backend:** Prisma schema, Database migrations, Seeds

## Dependencias

- Sprint 9 completado (modelos Account, Transaction, Category)

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
