# ADR-008: Migración de @horus/shared de CommonJS a ESM

## Metadata

- **Estado:** Aceptado
- **Fecha:** 2025-11-26
- **Autor:** Claude Code
- **Componentes:** packages/shared, apps/web, apps/backend

---

## 1. Contexto y Problema

### Situación

Durante la implementación de US-102, el build de Vite falló al intentar importar el enum Scope desde @horus/shared. El error indicaba que Vite no podía importar exports nombrados desde módulos CommonJS generados por TypeScript. Esta incompatibilidad bloqueaba completamente el build de producción de la aplicación web.

### Problema

Resuelve la incompatibilidad entre el sistema de módulos del paquete compartido y los requisitos de Vite. Permite que apps/web importe correctamente tipos, enums y constantes desde @horus/shared sin errores de build. Garantiza que el monorepo funcione correctamente con bundlers modernos que esperan ESM.

---

## 2. Decisión

### Usar moduleResolution: Bundler en tsconfig

Bundler es la opción recomendada para librerías que se consumen mediante bundlers modernos como Vite, esbuild, Rollup. Permite mejor tree-shaking y compatibilidad.

### Agregar exports field con tipos explícitos

El campo exports en package.json es el estándar moderno para declarar puntos de entrada. Especifica explícitamente types, import y require paths.

---

## 3. Alternativas Consideradas

### Para: Usar moduleResolution: Bundler en tsconfig

1. Node16
2. NodeNext

### Para: Agregar exports field con tipos explícitos

1. Solo main field
2. Dual CommonJS/ESM builds

---

## 4. Consecuencias

### Positivas

- Resuelve: Resuelve la incompatibilidad entre el sistema de módulos del paquete compartido y los requisitos de Vite. Permite que apps/web importe correctamente tipos, enums y constantes desde @horus/shared sin errores de build. Garantiza que el monorepo funcione correctamente con bundlers modernos que esperan ESM.
- Componentes mejorados: packages/shared, apps/web, apps/backend

### Trade-offs

- Bundler es específico para uso con bundlers, no para ejecución directa con Node.js. Pero dado que @horus/shared solo se usa en contextos bundleados (web con Vite, backend con tsx), es la opción correcta.
- Exports field requiere Node 12.7+, pero todos nuestros entornos lo soportan. Provee mejor control sobre qué se exporta del paquete.

⚠️ **Breaking Changes:** Requiere migración

---

## 5. Implementación

**Fecha:** 2025-11-26
**Sprint:** sprint-11
**Archivos:** packages/shared/package.json, packages/shared/tsconfig.json

---

## 6. Referencias

N/A

- US-102

---

**Generado automáticamente por MCP Document Change System**
