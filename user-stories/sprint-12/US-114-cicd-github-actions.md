# Technical Task #1: CI/CD Completo con GitHub Actions

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** TECH-001
**Título:** CI/CD Completo con GitHub Actions
**Tipo:** Infrastructure

## Descripción

Pipeline de CI/CD completo que ejecute lint, type-check, tests, E2E, y deployment automático.

## Razón

Un pipeline de CI/CD robusto previene bugs en producción, automatiza el testing, y permite deployments rápidos y confiables.

## Criterios de Aceptación

### 1. Workflow .github/workflows/ci.yml

- [ ] Lint y type-check:
  - ESLint en backend, mobile, web
  - TypeScript type-check
- [ ] Unit tests:
  - Backend tests con Jest
  - Mobile tests
  - Web tests
- [ ] E2E tests:
  - Detox para mobile (Android emulator)
  - Playwright para web (Chrome, Firefox)
- [ ] Lighthouse CI:
  - Ejecutar auditoría
  - Fallar si score < 90
- [ ] Deploy a staging:
  - Automático on push to develop
  - Backend a Railway/Render
  - Web a Vercel

### 2. Configurar Secrets en GitHub

- [ ] DATABASE_URL (staging)
- [ ] JWT_SECRET
- [ ] FIREBASE\_\* credentials
- [ ] VAPID\_\* keys
- [ ] Deploy tokens (Railway, Vercel)

### 3. Branch Protection en Main

- [ ] Require PR reviews
- [ ] Require status checks to pass
- [ ] No direct push to main

### 4. Notificaciones de CI

- [ ] Integración con Slack/Discord (opcional)
- [ ] Notificar en fallos de CI

## Tareas Técnicas

- [ ] Crear workflow ci.yml - [2h]
- [ ] Configurar jobs de lint y tests - [1h]
- [ ] Configurar E2E tests en CI - [2h]
- [ ] Configurar Lighthouse CI - [1h]
- [ ] Configurar deploy automático - [1.5h]
- [ ] Agregar secrets en GitHub - [0.5h]
- [ ] Configurar branch protection - [0.5h]
- [ ] Documentar - [0.5h]

## Componentes Afectados

- **infra:** GitHub Actions, CI/CD pipeline, deployment

## Dependencias

- Ninguna

## Prioridad

high

## Esfuerzo Estimado

2 Story Points
