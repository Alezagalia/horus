# US-073: Modelos Account y Transaction en Base de Datos

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-073
**Título:** Modelos Account y Transaction en Base de Datos

## Descripción

Como desarrollador del sistema, quiero modelos de base de datos para cuentas y transacciones, para almacenar información financiera del usuario.

## Criterios de Aceptación

- [ ] Modelo `Account` creado en schema de Prisma con campos:
  - id, name (string, max 100)
  - type (enum: 'efectivo', 'banco', 'billetera_digital', 'tarjeta')
  - currency (string, código ISO 4217: 'ARS', 'USD', 'EUR', etc.)
  - initialBalance (decimal, 2 decimales)
  - currentBalance (decimal, 2 decimales - calculado)
  - color (string, hex color para UI)
  - icon (string, emoji para UI)
  - isActive (boolean, default: true - soft delete)
  - userId (relación con User)
  - createdAt, updatedAt
- [ ] Modelo `Transaction` creado con campos:
  - id, accountId (relación con Account)
  - categoryId (relación con Category de scope 'gastos')
  - userId (para queries rápidas)
  - type (enum: 'ingreso', 'egreso')
  - amount (decimal, 2 decimales, positivo)
  - concept (string, max 200)
  - date (datetime)
  - notes (text, nullable)
  - isTransfer (boolean, default: false)
  - targetAccountId (string, nullable - cuenta destino si es transferencia)
  - transferPairId (string, nullable - ID de transacción vinculada)
  - createdAt, updatedAt
- [ ] Relaciones configuradas:
  - Account → User (ON DELETE CASCADE)
  - Transaction → Account (ON DELETE RESTRICT - no eliminar cuenta con transacciones)
  - Transaction → Category (ON DELETE RESTRICT)
  - Transaction → User (ON DELETE CASCADE)
- [ ] Índices creados:
  - (userId, isActive) para cuentas activas
  - (accountId, date) para transacciones por cuenta
  - (userId, date) para transacciones por usuario
  - (transferPairId) para buscar transacción vinculada
- [ ] Constraint: amount debe ser positivo (> 0)
- [ ] Migración de Prisma ejecutada exitosamente

## Tareas Técnicas

- [ ] Crear modelo Account en `prisma/schema.prisma` - [1.5h]
- [ ] Crear modelo Transaction - [1.5h]
- [ ] Crear enums AccountType y TransactionType - [0.5h]
- [ ] Agregar índices y relaciones - [1h]
- [ ] Agregar constraints (amount > 0) - [0.5h]
- [ ] Crear migración de Prisma - [0.5h]
- [ ] Ejecutar migración en BD local y staging - [0.5h]
- [ ] Documentar modelos en comentarios - [0.5h]

## Componentes Afectados

- **backend:** Prisma schema, Database migrations

## Dependencias

- Modelo Category del Sprint 2 (scope 'gastos')

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
