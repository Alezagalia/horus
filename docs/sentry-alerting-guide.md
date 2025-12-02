# Sentry Alerting Configuration Guide

## US-115: Monitoring y Logging en Producción

Este documento describe cómo configurar las alertas en Sentry para el proyecto Horus.

## Alertas Requeridas

### 1. Error Rate Alert (Tasa de Errores >1%)

**Configuración en Sentry Dashboard:**

1. Ir a **Alerts** → **Create Alert Rule**
2. Seleccionar proyecto: `horus-backend` / `horus-web` / `horus-mobile`
3. Tipo: **Issues**
4. Condición:
   - **When**: `The issue is seen more than [X] times in [1 hour]`
   - Calcular X = (requests_per_hour \* 0.01)
   - Ejemplo: 1000 requests/hour → X = 10 errors

**Alert Settings:**

```yaml
name: 'High Error Rate (>1%)'
environment: production
conditions:
  - metric: error_count
    threshold: 10
    window: 1h
actions:
  - email: team@horus.app
  - slack: #alerts-production
```

---

### 2. Performance Alert (P95 Response Time >1s)

**Configuración en Sentry Dashboard:**

1. Ir a **Alerts** → **Create Alert Rule**
2. Seleccionar proyecto: `horus-backend`
3. Tipo: **Metric Alert**
4. Condición:
   - **Metric**: `p95(transaction.duration)`
   - **Threshold**: `> 1000ms`
   - **Time Window**: `5 minutes`

**Alert Settings:**

```yaml
name: 'Slow API Response Time (P95 >1s)'
environment: production
conditions:
  - metric: p95(transaction.duration)
    threshold: 1000
    unit: ms
    window: 5m
actions:
  - email: backend-team@horus.app
  - pagerduty: on-call-backend
```

---

### 3. Database Connection Pool Alert

**Configuración en Sentry Dashboard:**

1. Ir a **Alerts** → **Create Alert Rule**
2. Seleccionar proyecto: `horus-backend`
3. Tipo: **Issues**
4. Condición:
   - **When**: `The issue's tags match [ALL] of these filters`
   - **Filter**: `error.type = "Pool exhausted"`

**Alert Settings:**

```yaml
name: 'Database Connection Pool Exhausted'
environment: production
conditions:
  - tags:
      error.type: 'Pool exhausted'
      logger: 'prisma'
actions:
  - email: devops@horus.app
  - pagerduty: on-call-devops
  - slack: #critical-alerts
```

---

## Dashboard de Métricas en Sentry

### Widgets Recomendados

#### 1. Error Rate Over Time

```yaml
widget: Line Chart
metric: count()
groupBy: environment
timeRange: 24h
```

#### 2. P95 Response Time by Endpoint

```yaml
widget: Table
metric: p95(transaction.duration)
groupBy: transaction
limit: 10
sortBy: p95 DESC
```

#### 3. User Sessions

```yaml
widget: Big Number
metric: count_unique(user)
timeRange: 24h
```

#### 4. Crash-Free Rate (Mobile)

```yaml
widget: Big Number
metric: crash_free_rate()
project: horus-mobile
timeRange: 7d
```

#### 5. Top Errors by Volume

```yaml
widget: Table
metric: count()
groupBy: issue
limit: 5
sortBy: count DESC
```

---

## Integrations

### Slack Integration

1. Ir a **Settings** → **Integrations** → **Slack**
2. Conectar workspace de Slack
3. Configurar canales:
   - `#alerts-production` - Alertas de producción
   - `#alerts-staging` - Alertas de staging
   - `#dev-notifications` - Notificaciones de desarrollo

### Email Notifications

1. Ir a **Settings** → **Notifications**
2. Configurar reglas por equipo:
   - **Backend Team**: Errores en `horus-backend`
   - **Frontend Team**: Errores en `horus-web`
   - **Mobile Team**: Crashes en `horus-mobile`

### PagerDuty (Opcional)

1. Ir a **Settings** → **Integrations** → **PagerDuty**
2. Conectar cuenta de PagerDuty
3. Asignar servicios:
   - Backend API → `backend-on-call`
   - Critical Errors → `platform-on-call`

---

## Variables de Entorno

### Backend (.env)

```bash
SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_ENVIRONMENT="production"
SENTRY_TRACES_SAMPLE_RATE="0.1"
LOG_LEVEL="info"
```

### Web (.env)

```bash
VITE_SENTRY_DSN="https://xxx@sentry.io/xxx"
VITE_SENTRY_ENVIRONMENT="production"
VITE_SENTRY_TRACES_SAMPLE_RATE="0.1"
```

### Mobile (app.json)

```json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://xxx@sentry.io/xxx",
      "sentryEnvironment": "production"
    }
  }
}
```

---

## Verificación

### Test de Alertas

#### 1. Backend - Generar error de prueba

```bash
curl -X POST http://localhost:3000/api/test/sentry-error
```

#### 2. Web - Generar error en consola

```javascript
import { captureException } from './lib/sentry';
captureException(new Error('Test error from web'));
```

#### 3. Mobile - Generar crash de prueba

```typescript
import { captureException } from './src/lib/sentry';
captureException(new Error('Test crash from mobile'));
```

---

## Monitoreo de Logs

### Backend - Winston Logs

Los logs se guardan en:

- `apps/backend/logs/error-YYYY-MM-DD.log` - Solo errores
- `apps/backend/logs/combined-YYYY-MM-DD.log` - Todos los logs

**Formato JSON:**

```json
{
  "timestamp": "2025-11-29 10:30:45",
  "level": "error",
  "message": "Database query failed",
  "service": "horus-backend",
  "environment": "production",
  "metadata": {
    "userId": "123",
    "operation": "getUserById",
    "duration_ms": 1250
  }
}
```

**Rotación:**

- Tamaño máximo: 20MB
- Retención errores: 30 días
- Retención combined: 14 días

---

## Mejores Prácticas

1. **Revisar alertas diariamente** en horario laboral
2. **Ajustar thresholds** basado en métricas reales
3. **Silenciar alertas** durante deploys planificados
4. **Documentar incidentes** en Sentry Issues
5. **Revisar dashboard** semanalmente en retrospectivas
6. **Limpiar errores antiguos** mensualmente

---

## Recursos

- [Sentry Documentation](https://docs.sentry.io/)
- [Alerting Best Practices](https://docs.sentry.io/product/alerts/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Error Tracking](https://docs.sentry.io/product/issues/)
