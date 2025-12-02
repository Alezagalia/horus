# US-003: Linting y Formateo (ESLint + Prettier)

**Sprint:** 00 - Infrastructure and Foundation
**ID:** US-003
**Título:** Linting y Formateo (ESLint + Prettier)

## Descripción

Como desarrollador del equipo, quiero tener linting y formateo automático configurado para mantener un código limpio y consistente en todo el proyecto.

## Criterios de Aceptación

- [ ] ESLint instalado con config para TypeScript (versión 9+)
- [ ] Prettier instalado (versión 3+)
- [ ] Archivo .eslintrc.js en root con reglas base
- [ ] Archivo .prettierrc en root con configuración de formato
- [ ] ESLint configurado en cada package extendiendo config del root
- [ ] Prettier integrado con ESLint (sin conflictos)
- [ ] Script "lint" funciona en cada package y en root
- [ ] Script "format" funciona en cada package
- [ ] Pre-commit hook opcional con husky y lint-staged
- [ ] VSCode settings.json con format on save
- [ ] Reglas configuradas: no console.log sin prefijo, no any, max line length 100

## Tareas Técnicas

- [ ] Instalar ESLint y plugins TypeScript - [1h]
- [ ] Instalar Prettier - [0.5h]
- [ ] Crear .eslintrc.js con reglas base - [1h]
- [ ] Crear .prettierrc - [0.5h]
- [ ] Configurar en cada package - [1h]
- [ ] Integrar ESLint con Prettier - [0.5h]
- [ ] Agregar scripts lint y format - [0.5h]
- [ ] Configurar husky y lint-staged (opcional) - [1h]
- [ ] Crear .vscode/settings.json - [0.5h]
- [ ] Verificar funcionamiento - [0.5h]
- [ ] Documentar en README - [0.5h]

## Componentes Afectados

- **infrastructure:** ESLint, Prettier configs
- **backend:** linting rules
- **mobile:** linting rules
- **web:** linting rules
- **shared:** linting rules

## Dependencias

- US-001 (Monorepo)
- US-002 (TypeScript)

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
