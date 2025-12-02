# US-112: Tests E2E en Web con Playwright

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** US-112
**Título:** Tests E2E en Web con Playwright
**Tipo:** Frontend Web Testing

## Descripción

Como desarrollador, quiero tests E2E en web, para garantizar flujos críticos en navegador.

## Razón

Playwright permite tests cross-browser automatizados que detectan bugs antes de producción y garantizan compatibilidad en Chrome, Firefox y Safari.

## Criterios de Aceptación

### 1. Playwright Configurado

- [ ] `@playwright/test` instalado
- [ ] playwright.config.ts configurado
- [ ] Scripts: `test:e2e:web`

### 2. Tests de Flujos

#### Auth flow:

- [ ] Registro
- [ ] Login
- [ ] Logout

#### Hábitos flow:

- [ ] Crear hábito
- [ ] Marcar completado
- [ ] Ver estadísticas

#### Tareas flow:

- [ ] Crear tarea con checklist
- [ ] Completar tarea
- [ ] Filtrar por prioridad

#### Keyboard shortcuts:

- [ ] j/k (navegación)
- [ ] Space (marcar completado)
- [ ] n (nuevo item)

### 3. Múltiples Navegadores

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari/WebKit

### 4. CI/CD

- [ ] Tests en GitHub Actions
- [ ] Screenshots de fallos
- [ ] Videos de tests fallidos (opcional)

## Tareas Técnicas

- [ ] Configurar Playwright - [1h]
- [ ] Test auth flow - [1h]
- [ ] Test hábitos - [1.5h]
- [ ] Test tareas - [1h]
- [ ] Test keyboard shortcuts - [1h]
- [ ] Múltiples navegadores - [0.5h]
- [ ] CI/CD - [1.5h]
- [ ] Documentar - [0.5h]

## Componentes Afectados

- **web:** Tests E2E, CI/CD pipeline

## Dependencias

- Sprint 11 (web)

## Prioridad

medium

## Esfuerzo Estimado

4 Story Points
