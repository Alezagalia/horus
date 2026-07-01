# Offline-first (Nivel 2) con WatermelonDB — Plan

> Estado: **Fase 0 (spike) en curso**. Se avanza al plan completo solo si persisten
> los errores de red / se decide invertir en offline-first. Guardado el 2026-07-01.

## Objetivo

La app mobile funciona 100% offline (leer + escribir); una base local SQLite es la
fuente de verdad de la UI; un motor de sync reconcilia con Postgres al reconectar.

## Por qué WatermelonDB

- SQLite vía JSI (rápido, síncrono), modelo reactivo (`withObservables`) → escritura
  optimista natural.
- Trae motor de sync incluido: `synchronize({ pullChanges, pushChanges })`. No hay que
  construir el diff local (Watermelon lleva `_status`/`_changed`/`last_pulled_at`).

## Riesgos duros a validar (por eso el spike primero)

1. **New Arch OFF (Paper)**: Watermelon usa JSI (existe en old arch) → debería andar,
   pero hay que confirmarlo en la tablet Samsung (DeX). **Riesgo #1.**
2. **Setup nativo en el `android/` custom** (parches de flavor `play` + `strip-sonatype`).
   `android/` es generado/gitignored → o autolinking, o wiring manual (evitar
   `expo prebuild --clean` que borra los parches).
3. **Invariantes de dominio en el push** (transferencia = 2 tx, pago = tx+estado+saldo).
4. **Reescritura de la capa de datos** (hooks TanStack Query → observables Watermelon).

## Fase 0 — Spike (objetivo: validar riesgos 1 y 2)

1. Instalar `@nozbe/watermelondb` + babel decorators + config nativa; buildear y
   **confirmar que arranca en la tablet con Paper**.
2. Modelar 1 entidad (`accounts`): schema + Model + observable en una pantalla.
3. Endpoints `sync/pull` y `sync/push` mínimos para `accounts` + **idempotency keys**.
4. Probar: crear cuenta offline → reconectar → aparece en el server sin duplicar.

## Contrato de `synchronize()` (backend)

- `GET /api/sync/pull?lastPulledAt&schemaVersion` →
  `{ changes: { <tabla>: { created[], updated[], deleted[ids] } }, timestamp }`
  (filas del `userId` con `updatedAt > lastPulledAt`, formato raw snake_case; deleted =
  tombstones desde lastPulledAt; timestamps en **ms**).
- `POST /api/sync/push` → `{ changes, lastPulledAt }`: en una transacción Prisma, upsert
  por `id` (idempotente), aplicar deletes, validar invariantes de dominio, recomputar
  saldos, detectar conflictos (updatedAt server > lastPulledAt).

## Mapeo de datos

- **IDs**: UUID generados en el cliente = id final en server (backend acepta el id en el
  create). Configurar el generador de Watermelon para emitir UUID.
- **snake_case ↔ camelCase**: capa de (de)serialización en el backend.
- **Timestamps en ms** (Watermelon) ↔ `DateTime` Prisma.
- **Borrados**: tombstones (`deletedAt` o tabla de deletions); `isActive` viaja como
  campo normal.
- **Doble esquema/migraciones**: Watermelon (`schemaVersion` + migrations) y Prisma;
  mantener alineados.

## Saldos derivados (decisión clave)

- **(a) Recomendado para Fase 1**: `currentBalance` read-only sincronizado desde el
  server + ajuste optimista local; el server corrige en el pull.
- **(b)**: saldo computado local desde transactions (exige que el server también derive).

## Reescritura de hooks/UI

- `useTransactions/useAccounts/...` pasan de `TanStack Query → axios` a observables de
  Watermelon. Migración **por dominio** (Dinero primero; el resto convive con TanStack
  Query hasta migrarlo). No escribir a tablas sincronizadas por fuera de Watermelon.

## Otros

- Cifrado: Watermelon no cifra por defecto → evaluar SQLCipher (datos financieros).
- Auth offline: tolerar token vencido; no desloguear por 401 sin red; refrescar al
  reconectar.

## Estimación (1 dev)

| Fase                              |                                                  | Tiempo       |
| --------------------------------- | ------------------------------------------------ | ------------ |
| 0 — Spike accounts + idempotencia | valida Paper + setup + sync                      | ~1 sem       |
| 1 — Dominio Dinero completo       | schema+models+hooks+endpoints+saldos+estado sync | ~2.5–3.5 sem |
| 2 — Resto de dominios             | hábitos/tareas/eventos/metas/fitness/recursos    | ~2.5–3.5 sem |
| 3 — Pulido                        | conflictos, tombstones, cifrado, tests, rollout  | ~1–1.5 sem   |
| **Total**                         |                                                  | **~7–9 sem** |

## Alternativa evaluada

- **PowerSync / ElectricSQL**: motores de sync gestionados sobre Postgres. Ahorran
  construir el sync engine (menos código) a cambio de un servicio externo + costo.
  Evaluar antes de construir el sync a mano si se va al plan completo.
