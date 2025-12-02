# ADR-001: Configuración completa de React Native con Expo

## Metadata

- **Estado:** Aceptado
- **Fecha:** 2025-11-20
- **Autor:** Claude Code
- **Componentes:** apps/mobile, @horus/shared, monorepo-config

---

## 1. Contexto y Problema

### Situación

El proyecto requería una aplicación móvil nativa para complementar el backend existente. React Native con Expo fue seleccionado por: 1) Desarrollo multiplataforma con un solo código base, 2) Ecosistema maduro con amplio soporte de bibliotecas, 3) Expo proporciona tooling moderno y simplificado, 4) React Native Reanimated ofrece animaciones de alto rendimiento, 5) Compatibilidad con la arquitectura TypeScript del monorepo.

### Problema

Antes de esta implementación, no existía infraestructura para desarrollo móvil. El proyecto solo tenía backend (Express + Prisma) y configuración básica de monorepo. Esta implementación resuelve: 1) Falta de cliente móvil, 2) Necesidad de arquitectura de navegación, 3) Gestión de estado asíncrono y caching, 4) Integración con workspace packages, 5) Configuración de bundler para monorepo.

---

## 2. Decisión

### Usar Expo en lugar de React Native CLI

Expo proporciona mejor developer experience con configuración simplificada, hot reload superior, y acceso a APIs nativas sin necesidad de código nativo personalizado. Para MVP es ideal.

### TanStack Query en lugar de Redux/MobX/Zustand

TanStack Query está especializado en server state (API calls), proporciona caching automático, sincronización background, y stale-while-revalidate. Reduce boilerplate comparado con Redux.

### Metro bundler con workspaceRoot watching

Metro debe poder resolver @horus/shared desde packages/ en el monorepo. Configurar watchFolders al workspace root permite symlinks de pnpm.

### React Navigation 7.x en lugar de Expo Router

React Navigation es más maduro, con mejor soporte de TypeScript y más control sobre navegación. Expo Router (basado en file-routing) es más opinionado.

---

## 3. Alternativas Consideradas

### Para: Usar Expo en lugar de React Native CLI

1. React Native CLI (bare workflow)
2. Flutter
3. Ionic

### Para: TanStack Query en lugar de Redux/MobX/Zustand

1. Redux Toolkit + RTK Query
2. MobX
3. Zustand + SWR

### Para: Metro bundler con workspaceRoot watching

1. Esbuild
2. Webpack
3. Vite

### Para: React Navigation 7.x en lugar de Expo Router

1. Expo Router
2. React Native Navigation (Wix)

---

## 4. Consecuencias

### Positivas

- Resuelve: Antes de esta implementación, no existía infraestructura para desarrollo móvil. El proyecto solo tenía backend (Express + Prisma) y configuración básica de monorepo. Esta implementación resuelve: 1) Falta de cliente móvil, 2) Necesidad de arquitectura de navegación, 3) Gestión de estado asíncrono y caching, 4) Integración con workspace packages, 5) Configuración de bundler para monorepo.
- Componentes mejorados: apps/mobile, @horus/shared, monorepo-config

### Trade-offs

- Expo añade overhead de tamaño de bundle (~50MB base) pero elimina complejidad de configuración nativa. Para futuras necesidades de módulos nativos custom, se puede ejectar a bare workflow.
- Solo maneja server state, no client state global complejo. Para state local se usa useState/useReducer, lo cual es suficiente para US-015.
- Metro es el bundler oficial de React Native y tiene mejor compatibilidad, aunque es más lento que alternativas modernas. Para producción, bundle size es optimizado automáticamente.
- React Navigation es más verboso (requiere definir Stack.Navigator explícitamente) pero ofrece más flexibilidad y tipado estricto con TypeScript.

---

## 5. Implementación

**Fecha:** 2025-11-20
**Sprint:** sprint-02
**Archivos:** apps/mobile/package.json, apps/mobile/App.tsx, apps/mobile/app.json, apps/mobile/babel.config.js, apps/mobile/metro.config.js

### Dependencias

- expo v^54.0.25: Framework y tooling para React Native
- react-native v^0.82.1: Framework móvil multiplataforma
- @react-navigation/native v^7.1.20: Sistema de navegación
- @react-navigation/native-stack v^7.6.3: Stack navigator nativo
- @react-navigation/material-top-tabs v^7.4.3: Tab navigator estilo Material
- @tanstack/react-query v^5.90.10: State management asíncrono y caching
- axios v^1.13.2: Cliente HTTP
- @gorhom/bottom-sheet v^5.2.6: Componente bottom sheet
- react-native-gesture-handler v^2.29.1: Sistema de gestos nativo
- react-native-reanimated v^4.1.5: Librería de animaciones

---

## 6. Referencias

N/A

---

**Generado automáticamente por MCP Document Change System**
