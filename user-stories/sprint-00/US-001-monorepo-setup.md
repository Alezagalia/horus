# US-001: Monorepo Setup con pnpm workspaces

**Sprint:** 00 - Infrastructure and Foundation
**ID:** US-001
**Título:** Monorepo Setup con pnpm workspaces

## Descripción

Como desarrollador del equipo, quiero configurar un monorepo con pnpm workspaces para que podamos compartir código de forma eficiente entre backend, mobile y web desde el inicio del proyecto.

## Criterios de Aceptación

- [ ] Repositorio de Git inicializado con estructura de monorepo
- [ ] pnpm instalado y configurado (versión 8.x o superior)
- [ ] Workspace configurado en pnpm-workspace.yaml con 4 packages: backend, mobile, web, shared
- [ ] Cada package tiene su propio package.json con nombre y versión
- [ ] Package shared contiene types y schemas comunes (inicialmente vacío pero con estructura)
- [ ] Script raíz "pnpm install" funciona correctamente
- [ ] Scripts globales funcionan: pnpm --filter backend dev, pnpm --filter mobile dev, pnpm --filter web dev
- [ ] .gitignore configurado correctamente (node_modules, dist, build, .env)
- [ ] README.md en raíz con instrucciones de setup
- [ ] Estructura de carpetas creada con subcarpetas básicas (src, tests, etc.)

## Tareas Técnicas

- [ ] Inicializar repo Git - [0.5h]
- [ ] Instalar pnpm globalmente - [0.5h]
- [ ] Crear pnpm-workspace.yaml - [0.5h]
- [ ] Crear estructura de carpetas para 4 packages - [1h]
- [ ] Crear package.json en cada package - [1h]
- [ ] Configurar scripts en package.json raíz - [1h]
- [ ] Crear .gitignore - [0.5h]
- [ ] Escribir README.md con instrucciones - [1h]
- [ ] Verificar que todo funciona (pnpm install, scripts) - [0.5h]

## Componentes Afectados

- **infrastructure:** monorepo root, pnpm-workspace.yaml
- **packages:** backend, mobile, web, shared

## Dependencias

Ninguna (es el primer US del proyecto)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points

## Notas Adicionales

Este es el foundation del proyecto. Debe completarse antes de cualquier otro desarrollo.
