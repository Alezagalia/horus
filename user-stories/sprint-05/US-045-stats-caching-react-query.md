# Technical Task #2: Cacheo de Estadísticas con React Query

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** TECH-002
**Título:** Cacheo de Estadísticas con React Query

## Descripción

Implementar estrategia de cacheo inteligente para estadísticas con TanStack Query (React Query) para evitar requests innecesarios y mejorar UX con datos instantáneos.

## Razón

Las estadísticas no cambian constantemente (solo cuando usuario marca hábitos). Cachear los datos mejora performance, reduce latencia percibida, y permite funcionamiento offline parcial.

## Estrategia

- `GET /api/habits/stats`: staleTime 5 minutos, cacheTime 30 minutos
- `GET /api/habits/:id/stats`: staleTime 5 minutos, cacheTime 30 minutos
- Invalidar cache al marcar hábito (mutación de HabitRecord)
- Background refetch automático al volver a la pantalla

## Tareas Técnicas

- [ ] Configurar queryClient con opciones de cache por defecto - [0.5h]
- [ ] Crear custom hooks: useHabitsStats(), useHabitStats(id) - [1h]
- [ ] Implementar invalidación de cache en mutations de marcado - [1h]
- [ ] Implementar refetch on focus con useFocusEffect - [0.5h]
- [ ] Configurar retry strategy (3 reintentos con backoff) - [0.5h]
- [ ] Tests de lógica de cacheo - [1.5h]
- [ ] Documentar estrategia de cacheo - [0.5h]

## Componentes Afectados

- **mobile:** React Query configuration, Custom hooks

## Dependencias

- US-037 y US-038 (endpoints de estadísticas)

## Prioridad

medium

## Esfuerzo Estimado

2 Story Points
