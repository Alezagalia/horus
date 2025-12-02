# Technical Task #2: Monitoring y Logging en Producción

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** TECH-002
**Título:** Monitoring y Logging en Producción
**Tipo:** Infrastructure

## Descripción

Configurar monitoreo con Sentry, logging estructurado, y alertas.

## Razón

El monitoring es esencial para detectar errores en producción, diagnosticar problemas rápidamente, y mantener la salud del sistema.

## Criterios de Aceptación

### 1. Sentry en Backend, Mobile, Web

- [ ] Sentry instalado en backend:
  - Captura de excepciones
  - Context (userId, requestId)
  - Performance monitoring
- [ ] Sentry en mobile (Expo):
  - Crash reporting
  - Breadcrumbs
  - Release tracking
- [ ] Sentry en web:
  - Error boundary
  - Source maps
  - Performance monitoring

### 2. Logging Estructurado

- [ ] Librería: Winston o Pino
- [ ] Log levels: error, warn, info, debug
- [ ] Formato JSON para parsing
- [ ] Contexto: timestamp, level, message, metadata
- [ ] Rotación de logs

### 3. Alertas

- [ ] Alerta si error rate > 1%
- [ ] Alerta si p95 response time > 1s
- [ ] Alerta si DB connection pool exhausted
- [ ] Canal: Email o Slack

### 4. Dashboard de Métricas

- [ ] Dashboard en Sentry:
  - Error rate
  - Performance metrics
  - User sessions
- [ ] Grafana o alternativa (opcional)

### 5. Analytics Opcional

- [ ] Mixpanel o Amplitude:
  - Tracking de eventos clave
  - Funnels de conversión
  - Retención cohorts

## Tareas Técnicas

- [ ] Configurar Sentry en backend - [1h]
- [ ] Configurar Sentry en mobile - [1h]
- [ ] Configurar Sentry en web - [1h]
- [ ] Implementar logging estructurado - [1.5h]
- [ ] Configurar alertas - [1h]
- [ ] Dashboard de métricas - [1h]
- [ ] Analytics opcional - [1.5h]
- [ ] Documentar - [0.5h]

## Componentes Afectados

- **backend:** Sentry, logging, alertas
- **mobile:** Sentry, analytics
- **web:** Sentry, error boundary
- **infra:** Monitoring dashboard

## Dependencias

- Ninguna

## Prioridad

high

## Esfuerzo Estimado

2 Story Points
