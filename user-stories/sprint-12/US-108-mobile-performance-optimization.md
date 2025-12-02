# US-108: Optimización de Performance en Mobile (React Native)

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** US-108
**Título:** Optimización de Performance en Mobile (React Native)
**Tipo:** Mobile

## Descripción

Como usuario de la app móvil, quiero que la app sea rápida y fluida, para tener una experiencia de uso agradable sin lag ni delays.

## Razón

Un app lenta genera frustración y abandono. El performance es crítico para la satisfacción del usuario y la retención a largo plazo.

## Criterios de Aceptación

### 1. Lazy Loading de Pantallas

- [ ] Pantallas no críticas cargadas con `React.lazy()`
- [ ] Eager loading para pantallas críticas (Home, HabitsOfDay)
- [ ] `Suspense` con skeleton screens mientras carga
- [ ] Preload de pantallas críticas al abrir app

### 2. Optimización de Imágenes

- [ ] Imágenes comprimidas (WebP cuando sea posible)
- [ ] Lazy loading de imágenes con placeholder
- [ ] Cache de imágenes con `expo-image`
- [ ] Uso de blurhash para placeholders

### 3. Bundle Size Reduction

- [ ] Tree shaking de librerías no usadas
- [ ] Análisis de bundle con `npx react-native-bundle-visualizer`
- [ ] Remover dependencias innecesarias
- [ ] Bundle < 50MB para release (objetivo)
- [ ] Metro config con minification y drop_console en producción

### 4. Performance Profiling

- [ ] Usar React DevTools Profiler para identificar re-renders innecesarios
- [ ] Usar Flipper para detectar memory leaks
- [ ] Optimizar componentes pesados con `React.memo()`
- [ ] `useMemo()` y `useCallback()` en funciones costosas

### 5. Animaciones Optimizadas

- [ ] Usar `react-native-reanimated` v3 para animaciones
- [ ] Animaciones corriendo en UI thread (no JS thread)
- [ ] Evitar animaciones en JS thread que bloquean
- [ ] Target: 60fps en todas las animaciones

### 6. Reducir Tiempo de Inicio

- [ ] Splash screen optimizado
- [ ] Cargar datos críticos primero (auth check)
- [ ] Diferir cargas no críticas
- [ ] Objetivo: App startup < 2s

### 7. List Optimization

- [ ] FlatList con `windowSize` optimizado
- [ ] `getItemLayout` para performance predecible
- [ ] `removeClippedSubviews`, `maxToRenderPerBatch`, `updateCellsBatchingPeriod`

### 8. Network Optimization

- [ ] Reducir cantidad de requests (batch cuando sea posible)
- [ ] Cache con React Query (staleTime, cacheTime)
- [ ] Cancelar requests al desmontar componente

## Tareas Técnicas

- [ ] Implementar lazy loading de pantallas - [1.5h]
- [ ] Optimizar imágenes y agregar lazy loading - [1h]
- [ ] Análisis y reducción de bundle size - [1.5h]
- [ ] Performance profiling con DevTools y Flipper - [2h]
- [ ] Optimizar animaciones con reanimated - [1.5h]
- [ ] Optimizar tiempo de inicio - [1h]
- [ ] Optimizar FlatLists - [1h]
- [ ] Documentar optimizaciones realizadas - [0.5h]

## Componentes Afectados

- **mobile:** Todas las pantallas, componentes de listas, animaciones, configuración de Metro

## Dependencias

- Ninguna (mejoras incrementales)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
