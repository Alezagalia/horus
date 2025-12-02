# ADR-002: US-020: Shared package con schemas Zod para categorías

## Metadata

- **Estado:** Aceptado
- **Fecha:** 2025-11-20
- **Autor:** Claude Code
- **Componentes:** packages/shared/src/schemas, apps/backend/src/validations, packages/shared/package.json, apps/backend/package.json

---

## 1. Contexto y Problema

### Situación

Cumplir con US-020 y establecer patrón DRY (Don't Repeat Yourself) para validaciones compartidas, eliminando duplicación entre backend y frontend, y garantizando validaciones idénticas en todas las apps.

### Problema

Antes de US-020: Backend tenía schemas Zod duplicados en category.validation.ts, mobile usaba tipos TS sin validación Zod. Esto generaba riesgo de inconsistencias, duplicación de lógica, y dificultad de mantenimiento. Ahora: única fuente de verdad en @horus/shared.

---

## 2. Decisión

### Schemas Zod en shared con tipos inferidos

Zod permite definir schemas que sirven tanto para validación runtime como para inferencia de tipos TypeScript. Patrón estándar en monorepos modernos.

### Backend re-exporta desde shared en validation layer

Mantiene API interna del backend consistente (controllers siguen importando desde ./validations/) pero elimina duplicación

### Workspace protocol para dependencia shared

pnpm workspace:\* garantiza que siempre se use la versión local de shared, no una versión publicada en npm

---

## 3. Alternativas Consideradas

### Para: Schemas Zod en shared con tipos inferidos

1. Solo tipos TS sin validación
2. Schemas duplicados en cada app
3. Usar otra librería de validación (Yup, Joi)

### Para: Backend re-exporta desde shared en validation layer

1. Importar directamente desde @horus/shared en controllers
2. Eliminar capa de validations/

### Para: Workspace protocol para dependencia shared

1. file: protocol
2. Versión fija tipo 0.0.1
3. Path mapping en tsconfig

---

## 4. Consecuencias

### Positivas

- Resuelve: Antes de US-020: Backend tenía schemas Zod duplicados en category.validation.ts, mobile usaba tipos TS sin validación Zod. Esto generaba riesgo de inconsistencias, duplicación de lógica, y dificultad de mantenimiento. Ahora: única fuente de verdad en @horus/shared.
- Componentes mejorados: packages/shared/src/schemas, apps/backend/src/validations, packages/shared/package.json, apps/backend/package.json

### Trade-offs

- Zod agrega ~20KB al bundle, pero es la librería más TypeScript-friendly y con mejor DX. Vale la pena el peso por type-safety + runtime validation.
- Capa adicional de indirección, pero facilita refactoring futuro y mantiene arquitectura limpia.
- Requiere pnpm (no funciona con npm/yarn), pero es el estándar de facto para monorepos pnpm.

---

## 5. Implementación

**Fecha:** 2025-11-20
**Sprint:** Sprint 2
**Archivos:** packages/shared/src/index.ts, apps/backend/src/validations/category.validation.ts, packages/shared/package.json, apps/backend/package.json

### Dependencias

- zod v^4.1.12: Runtime validation con inferencia de tipos TypeScript

---

## 6. Referencias

- [ADR-001](./ADR-001.md)
- US-014
- US-015
- US-001
- US-002

---

**Generado automáticamente por MCP Document Change System**
