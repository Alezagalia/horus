# Horus — Especificaciones Funcionales y Técnicas

> Estado general: **Draft** | Generado desde código existente | Fecha: 2026-05-08

## Índice de Specs

### Módulos de negocio

| #   | Spec                                                    | Tipo   | Estado |
| --- | ------------------------------------------------------- | ------ | ------ |
| 01  | [Autenticación](./MODULE-01-auth.md)                    | module | draft  |
| 02  | [Categorías](./MODULE-02-categories.md)                 | module | draft  |
| 03  | [Hábitos](./MODULE-03-habits.md)                        | module | draft  |
| 04  | [Tareas](./MODULE-04-tasks.md)                          | module | draft  |
| 05  | [Eventos y Calendario](./MODULE-05-events.md)           | module | draft  |
| 06  | [Finanzas](./MODULE-06-finance.md)                      | module | draft  |
| 07  | [Gastos Recurrentes](./MODULE-07-recurring-expenses.md) | module | draft  |
| 08  | [Fitness](./MODULE-08-fitness.md)                       | module | draft  |
| 09  | [Base de Conocimiento](./MODULE-09-resources.md)        | module | draft  |
| 10  | [Notificaciones Push](./MODULE-10-notifications.md)     | module | draft  |

### Integraciones

| #    | Spec                                                                  | Tipo        | Estado |
| ---- | --------------------------------------------------------------------- | ----------- | ------ |
| I-01 | [Google Calendar](./INTEGRATION-01-google-calendar.md)                | integration | draft  |
| I-02 | [Microsoft Calendar](./INTEGRATION-02-microsoft-calendar.md)          | integration | draft  |
| I-03 | [Firebase Push Notifications](./INTEGRATION-03-push-notifications.md) | integration | draft  |

---

## Patrones globales del sistema

### Soft Delete

Todos los modelos principales usan `isActive: boolean` en lugar de eliminación física. Las queries filtran por `isActive = true` por defecto.

### Autenticación

Todas las rutas (excepto `/api/auth/register` y `/api/auth/login`) requieren JWT Bearer token en el header `Authorization`.

### Categorías polimórficas

El modelo `Category` tiene un campo `scope` que determina a qué dominio pertenece:
`habitos | tareas | eventos | gastos | knowledge`

### Transferencias financieras

Una transferencia entre cuentas crea **2 transacciones** vinculadas por `transferPairId`: una egreso en la cuenta origen y un ingreso en la cuenta destino.

### Eventos recurrentes

Se usan reglas rrule (RFC 5545) para definir la recurrencia. Los eventos recurrentes tienen una `self-relation` para vincular instancias con su evento padre.

### Stack técnico

- **Backend**: Express 5 + TypeScript ESM + Prisma 7 + PostgreSQL
- **Web**: React 18 + Vite + TailwindCSS 4 + TanStack Query 5
- **Mobile**: React Native 0.76.5 + Expo SDK 53 + React Navigation 7
