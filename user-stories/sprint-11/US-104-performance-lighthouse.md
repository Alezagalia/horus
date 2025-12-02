# Technical Task #2: Configuración de Performance y Lighthouse

**Sprint:** 11 - Frontend Web Base
**ID:** TECH-002
**Título:** Configuración de Performance y Lighthouse
**Tipo:** Infrastructure

## Descripción

Configurar optimizaciones de performance en Vite y garantizar que la aplicación cumple con los estándares de Lighthouse (score > 90 en Performance, Best Practices, Accessibility).

## Razón

El performance es crítico para la experiencia de usuario. Un sitio lento genera frustración y abandono. Lighthouse es el estándar de la industria para medir web performance.

## Criterios de Aceptación

- [ ] Configurar code splitting en Vite:
  - Lazy loading de rutas con `React.lazy()` y `Suspense`
  - Chunks separados por rutas
  - Preloading de rutas críticas
- [ ] Configurar tree shaking
- [ ] Optimización de imágenes:
  - Formato WebP cuando sea posible
  - Lazy loading con `loading="lazy"`
  - Placeholder mientras carga
- [ ] Optimización de fonts:
  - `font-display: swap` en Tailwind
  - Preload de fonts críticos
- [ ] Configurar Service Worker (opcional):
  - Caching de assets estáticos
  - Offline fallback básico
- [ ] Lighthouse CI:
  - Configurar en GitHub Actions
  - Thresholds: Performance > 90, Accessibility > 90, Best Practices > 90
  - Fallo en CI si no cumple
- [ ] Monitoreo de bundle size:
  - Alertar si bundle supera 300KB (gzipped)
- [ ] Tests de performance:
  - FCP < 1.5s
  - LCP < 2.5s
  - TTI < 3.5s

## Tareas Técnicas

- [ ] Configurar code splitting (lazy routes) - [1.5h]
- [ ] Configurar tree shaking en vite.config.ts - [0.5h]
- [ ] Configurar optimización de imágenes - [1h]
- [ ] Configurar optimización de fonts - [0.5h]
- [ ] Configurar Service Worker (opcional) - [1.5h]
- [ ] Configurar Lighthouse CI en GitHub Actions - [1.5h]
- [ ] Configurar monitoreo de bundle size - [0.5h]
- [ ] Tests de performance - [1h]
- [ ] Documentación de optimizaciones - [0.5h]

## Componentes Afectados

- **web:** Vite configuration, build process, CI/CD

## Dependencias

- US-094 (Setup del proyecto)

## Prioridad

high

## Esfuerzo Estimado

2 Story Points
