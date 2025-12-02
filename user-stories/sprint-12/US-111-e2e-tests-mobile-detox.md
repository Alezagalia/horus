# US-111: Tests E2E en Mobile con Detox

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** US-111
**Título:** Tests E2E en Mobile con Detox
**Tipo:** Mobile Testing

## Descripción

Como desarrollador, quiero tests E2E automatizados en mobile, para garantizar flujos críticos funcionan.

## Razón

Los tests E2E previenen regresiones en flujos críticos y dan confianza para iterar rápido sin romper funcionalidades existentes.

## Criterios de Aceptación

### 1. Detox Configurado

- [ ] Detox instalado para iOS y Android
- [ ] Scripts: `test:e2e:ios`, `test:e2e:android`
- [ ] Configuración en package.json y .detoxrc.json

### 2. Tests de Flujos Críticos

#### Auth flow:

- [ ] Registro de usuario
- [ ] Login con credenciales
- [ ] Logout

#### Hábitos flow:

- [ ] Crear hábito CHECK
- [ ] Crear hábito NUMERIC
- [ ] Ver hábitos del día
- [ ] Marcar completado
- [ ] Ver estadísticas

#### Tareas flow:

- [ ] Crear tarea con checklist
- [ ] Completar tarea
- [ ] Filtrar por prioridad

#### Notificaciones flow:

- [ ] Configurar notificación
- [ ] Simular recepción
- [ ] Verificar deep linking

### 3. Test Setup

- [ ] Mock de backend o usar staging
- [ ] Reset BD antes de tests
- [ ] Usuarios de prueba

### 4. CI/CD

- [ ] Tests E2E en GitHub Actions
- [ ] Emulador Android en CI

## Tareas Técnicas

- [ ] Configurar Detox - [2h]
- [ ] Test auth flow - [1.5h]
- [ ] Test hábitos flow - [2h]
- [ ] Test tareas flow - [1.5h]
- [ ] Test notificaciones - [1.5h]
- [ ] CI/CD con Detox - [2h]
- [ ] Documentar - [0.5h]

## Componentes Afectados

- **mobile:** Tests E2E, CI/CD pipeline

## Dependencias

- Todas las funcionalidades MVP

## Prioridad

medium

## Esfuerzo Estimado

5 Story Points
