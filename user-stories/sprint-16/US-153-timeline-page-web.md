# US-153: Página de Timeline en Web

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 16
**Story Points:** 6
**Asignado a:** Developer 2
**Estado:** todo

---

## Descripción

**Como** usuario web
**Quiero** una página dedicada con mi línea de tiempo personal
**Para** ver mi historia con Horus como narrativa cronológica y motivarme con aniversarios y hitos

---

## Criterios de Aceptación

### 1. Ruta y navegación

- Nueva ruta `/timeline` registrada en `AppRouter`.
- Entrada en sidebar bajo "Principal", con icono `Clock` o emoji `📜`.
- Atajo de teclado: `g` luego `t` (en línea con convención US-103).

### 2. Layout

```
┌──────────────────────────────────────────────────────────┐
│ Mi Historia                       [Filtros ▼]            │
├──────────────────────────────────────────────────────────┤
│ ┌─────┐                                                  │
│ │ 🎂 │ HOY · Aniversarios                                │
│ └─────┘                                                  │
│ ┌──────────────────────────────────────────┐             │
│ │ Hace 1 año empezaste el hábito Correr    │             │
│ │ Hace 6 meses cumpliste tu primera meta…  │             │
│ └──────────────────────────────────────────┘             │
│                                                          │
│ 2026                                                     │
│  ●─ 12 May — Tu workout #50                              │
│  │                                                       │
│  ●─ 03 Feb — Primera meta completada: "Maratón"          │
│                                                          │
│ 2025                                                     │
│  ●─ 30 Ago — 100 tareas completadas                      │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

- Header con título y botón de filtros colapsable.
- Sección "Aniversarios de hoy" destacada en card especial al tope (solo si hay eventos `anniversary.*` con fecha = hoy).
- Resto del feed: vertical, agrupado por **año** descendente. Dentro de cada año, eventos ordenados desc por fecha.
- Conector visual: línea vertical con puntos por evento.

### 3. Card de evento

```
┌─────────────────────────────────────────────────────────┐
│ [icon]  TÍTULO PRINCIPAL                                │
│         Descripción opcional · Hace 1 año · Hábitos     │
└─────────────────────────────────────────────────────────┘
```

- Icono por módulo: hábitos 🎯, tareas ✅, workouts 💪, metas 🏆, finanzas 💸, recursos 📚.
- Color de borde por categoría: `first` indigo, `completed` emerald, `anniversary` amber, `milestone` violet.
- Click en card: si tiene `entity`, navega a esa entidad (`/habits/{id}`, `/goals/{id}`, etc.).

### 4. Filtros

- Panel desplegable con:
  - Checkboxes por módulo (hábitos, tareas, workouts, metas, finanzas, recursos)
  - Checkboxes por categoría (first, completed, anniversary, milestone)
  - Rango de fechas (opcional)
- Estado de filtros en URL query string (`?modules=habits,tasks&categories=anniversary`).

### 5. Paginación

- Infinite scroll: cargar 100 eventos por página.
- Loader al final del feed mientras carga la siguiente página.
- Indicador "Has llegado al inicio de tu historia" cuando `hasMore: false`.

### 6. Estados

- **Loading inicial**: skeleton de 5 cards.
- **Empty**: ilustración + "Tu historia recién empieza. Volvé pronto."
- **Error**: card con retry.

### 7. Responsividad

- Desktop: layout con sidebar.
- Mobile (≥ 640px): card de aniversarios y feed ocupan full width.

---

## Tareas Técnicas

1. **`services/api/timelineApi.ts`** — [0.5h]
2. **`hooks/useTimeline.ts` con `useInfiniteQuery`** — [1.5h]
3. **`pages/TimelinePage.tsx` con layout principal** — [2h]
4. **`components/timeline/TimelineEventCard.tsx`** — [1.5h]
5. **`components/timeline/TimelineFiltersPanel.tsx`** — [2h]
6. **`components/timeline/AnniversariesToday.tsx`** — [1h]
7. **Agrupación por año + conector visual** — [1.5h]
8. **Manejo de URL query string para filtros** — [1h]
9. **Registrar ruta y entrada sidebar** — [0.5h]
10. **Tests Playwright del flujo principal** — [1.5h]

---

## Definition of Done

- [ ] `/timeline` accesible desde sidebar
- [ ] Feed muestra eventos agrupados por año
- [ ] Filtros funcionan y se reflejan en URL
- [ ] Infinite scroll cargando páginas siguientes
- [ ] Loading/empty/error states implementados
- [ ] Lighthouse score ≥ 90 en performance y accessibility
- [ ] E2E test cubre filtrar + scroll
- [ ] Code review aprobado

---

**Estimación:** 6 SP | 12h
**Bloqueada por:** US-151, US-152
