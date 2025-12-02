# US-109: Optimización de Performance en Web (Next.js)

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** US-109
**Título:** Optimización de Performance en Web (Next.js)
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero que la aplicación cargue rápido y sea responsive, para tener una experiencia fluida en navegador.

## Razón

El performance web es medido por Google y afecta SEO, conversión y satisfacción del usuario. Un sitio lento = usuarios que abandonan antes de ver el contenido.

## Criterios de Aceptación

### 1. Lighthouse Score > 90

- [ ] Performance: > 90
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] SEO: > 90

### 2. Core Web Vitals

- [ ] FCP (First Contentful Paint): < 1.5s
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] TTI (Time to Interactive): < 3.5s
- [ ] CLS (Cumulative Layout Shift): < 0.1
- [ ] FID (First Input Delay): < 100ms

### 3. Code Splitting Avanzado

- [ ] Ya implementado en Sprint 11, verificar funcionamiento
- [ ] Chunks separados por rutas
- [ ] Vendor chunks: react, query, ui libraries

### 4. Image Optimization

- [ ] Usar formato WebP
- [ ] Lazy loading con `loading="lazy"`
- [ ] Placeholder images (blur-up)
- [ ] Next.js Image component con sizes optimizados

### 5. Font Optimization

- [ ] Fonts con `font-display: swap`
- [ ] Preload de fonts críticos
- [ ] Subset de fonts (solo caracteres usados)

### 6. Bundle Analysis

- [ ] Bundle total < 300KB gzipped
- [ ] Tree shaking verificado
- [ ] Identificar y optimizar librerías grandes

### 7. Caching Strategy

- [ ] Cache busting con hashes en filenames
- [ ] HTTP caching headers correctos
- [ ] Static assets con max-age largo

### 8. Lighthouse CI

- [ ] Configurado en GitHub Actions
- [ ] Falla build si score < 90

## Tareas Técnicas

- [ ] Auditoría con Lighthouse - [0.5h]
- [ ] Optimizar imágenes (WebP, lazy) - [1h]
- [ ] Optimizar fonts - [0.5h]
- [ ] Bundle analysis - [1.5h]
- [ ] Configurar Lighthouse CI - [1h]
- [ ] Verificar Core Web Vitals - [1.5h]
- [ ] Documentar optimizaciones - [0.5h]

## Componentes Afectados

- **web:** Vite configuration, build process, images, fonts, caching

## Dependencias

- Sprint 11 (web implementado)

## Prioridad

high

## Esfuerzo Estimado

4 Story Points
