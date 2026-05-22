# US-154: Pantalla de Timeline (Mobile)

**Tipo:** user-story
**Prioridad:** medium
**Sprint:** 16
**Story Points:** 5
**Asignado a:** Developer 3
**Estado:** DIFERIDA

---

> ⚠️ **Estado**: diferida junto con US-150 (Reports mobile) por decisión del usuario el 2026-05-21.
> El equipo mobile retomará ambas en una tanda posterior, una vez validados los flujos web.

---

## Descripción

**Como** usuario mobile
**Quiero** acceder a mi línea de tiempo desde la app
**Para** ver mis hitos y aniversarios sobre la marcha

---

## Criterios de Aceptación

### 1. Ruta y navegación

- Nueva pantalla `TimelineScreen` registrada en el stack principal.
- Entrada en tab bar / menú lateral (ver convención del proyecto).
- Icono: `Clock` o equivalente.

### 2. Estructura

- Header con botón de filtros (`Sheet` modal abajo).
- Banner de "Aniversarios de hoy" si aplica.
- `FlatList` de eventos agrupados por año (sticky headers por año).
- Pull-to-refresh.

### 3. Card de evento

- Misma información que web: icono módulo + título + descripción + categoría.
- Tap en card → detalle de la entidad correspondiente cuando `entity` está presente.

### 4. Filtros

- Sheet inferior con checkboxes por módulo y por categoría.
- Estado persistido en `AsyncStorage` (no en URL, por convención mobile).

### 5. Paginación

- Infinite scroll en el `FlatList` con `onEndReached`.

### 6. API client

- `apps/mobile/src/api/timeline.api.ts` con `getTimeline(params)`.
- Hook React Query `useInfiniteTimeline` en `apps/mobile/src/hooks/timeline/`.

### 7. Tests

- Detox E2E del flujo principal.

---

## Tareas Técnicas

1. `TimelineScreen.tsx` con FlatList y agrupación por año — [3h]
2. `TimelineEventCard` mobile — [1.5h]
3. `TimelineFiltersSheet` — [2h]
4. API client + hook React Query infinito — [1.5h]
5. AsyncStorage para filtros persistentes — [1h]
6. Tests Detox E2E — [2h]

---

## Definition of Done

- [ ] Pantalla accesible desde navegación principal
- [ ] Feed agrupado por año con sticky headers
- [ ] Filtros funcionan y persisten entre sesiones
- [ ] Pull-to-refresh y infinite scroll
- [ ] E2E test en CI
- [ ] Code review aprobado

---

**Estimación:** 5 SP | 11h
**Bloqueada por:** US-151, US-152
