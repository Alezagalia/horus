# US-094: Setup de Proyecto Web (Vite + React + TypeScript + Librerías Core)

**Sprint:** 11 - Frontend Web Base
**ID:** US-094
**Título:** Setup de Proyecto Web (Vite + React + TypeScript + Librerías Core)

## Descripción

Como desarrollador frontend, quiero configurar el proyecto web con Vite, React, TypeScript y todas las librerías necesarias, para tener una base sólida y moderna para desarrollar la aplicación web.

## Criterios de Aceptación

- [ ] Proyecto `packages/web` creado en monorepo con estructura completa de carpetas
- [ ] Vite 6.0+ configurado con:
  - Hot Module Replacement (HMR) funcionando
  - Alias `@/` para imports desde `src/`
  - Build optimization (tree-shaking, minification)
  - Environment variables (.env.local)
- [ ] React 18.3+ con TypeScript 5.6+
- [ ] React Router 7.0+ configurado con rutas:
  - Rutas públicas: `/login`, `/register`
  - Rutas protegidas: `/`, `/habits`, `/habits/:id`, `/tasks`, `/categories`
  - Redirect a `/login` si no autenticado
- [ ] TanStack Query (React Query) 5.0+ configurado:
  - QueryClientProvider en root
  - DevTools habilitados en desarrollo
  - Configuración de staleTime, cacheTime defaults
- [ ] Zustand 4.0+ para state management global
- [ ] Shadcn/ui configurado:
  - CLI de shadcn instalado
  - Components base instalados: Button, Input, Card, Dialog, DropdownMenu, Select, Checkbox, Textarea
  - Tema configurado en `tailwind.config.js`
- [ ] Tailwind CSS 4.0+ configurado:
  - Colores del design system
  - Breakpoints responsive
  - Typography plugin
- [ ] ESLint + Prettier configurados
- [ ] Scripts en package.json:
  - `pnpm dev` - Desarrollo con HMR
  - `pnpm build` - Build de producción
  - `pnpm preview` - Preview del build
  - `pnpm lint` - Linting
  - `pnpm type-check` - Type checking
- [ ] `.env.example` con variables necesarias
- [ ] README.md con instrucciones de setup

## Tareas Técnicas

- [ ] Crear proyecto con `pnpm create vite@latest packages/web --template react-ts` - [0.5h]
- [ ] Configurar Vite (alias, env vars, optimizaciones) - [1h]
- [ ] Instalar y configurar React Router - [1h]
- [ ] Instalar y configurar TanStack Query - [0.5h]
- [ ] Instalar y configurar Zustand - [0.5h]
- [ ] Instalar y configurar Shadcn/ui + Tailwind - [1.5h]
- [ ] Configurar ESLint + Prettier - [0.5h]
- [ ] Configurar path aliases y TypeScript - [0.5h]
- [ ] Crear estructura de carpetas base - [0.5h]
- [ ] Escribir README con instrucciones - [0.5h]

## Componentes Afectados

- **web:** Proyecto completo, configuración base

## Dependencias

- Monorepo ya existente (Sprint 0)
- Package `shared` con types y schemas

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
