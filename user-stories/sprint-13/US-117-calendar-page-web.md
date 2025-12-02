# US-117: Página de Calendario Mensual (Web)

**Sprint:** 13 - Frontend Web Completo
**ID:** US-117
**Título:** Página de Calendario Mensual (Web)
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero ver mi calendario mensual con todos mis eventos, para visualizar y gestionar mi agenda desde el navegador.

## Razón

El calendario es una herramienta esencial de productividad. Los usuarios web necesitan poder ver y gestionar sus eventos sin depender de la app móvil.

## Criterios de Aceptación

### 1. Página CalendarPage

- [ ] Accesible desde `/calendar`
- [ ] Header: "Calendario" con selector de mes/año
- [ ] Flechas ← → para navegar entre meses
- [ ] Botón "Hoy" para volver al mes actual
- [ ] Botón "Nuevo Evento"

### 2. Vista de Calendario Mensual

- [ ] Grid de 7x6 (días de la semana)
- [ ] Días del mes actual
- [ ] Días del mes anterior/siguiente (grises, no clickeables)
- [ ] Día actual destacado

### 3. Eventos en el Calendario

- [ ] Cada día muestra sus eventos (max 3 visibles)
- [ ] Badge de evento mostrando:
  - Hora (si no es all-day)
  - Título (truncado)
  - Color de categoría
- [ ] Click en evento → abre modal de detalles
- [ ] Click en día → abre modal de crear evento

### 4. Modal de Ver Evento

- [ ] Título, descripción, fecha y hora
- [ ] Categoría (icono + nombre)
- [ ] Ubicación (si tiene)
- [ ] Origen: "Horus" o "Google Calendar"
- [ ] Botones: "Editar", "Eliminar", "Cerrar"

### 5. Modal de Crear/Editar Evento

- [ ] Campo título (obligatorio, max 100)
- [ ] Campo descripción (opcional)
- [ ] Date picker para fecha
- [ ] Time picker para hora
- [ ] Checkbox "Todo el día"
- [ ] Selector de categoría
- [ ] Campo ubicación
- [ ] Botones: "Cancelar", "Guardar"

### 6. Confirmación de Eliminación

- [ ] Dialog: "¿Eliminar evento '{título}'?"
- [ ] Si es de Google Calendar: advertencia

### 7. Integración con Endpoints

- [ ] GET /api/calendar-events?from={date}&to={date}
- [ ] POST /api/calendar-events
- [ ] PUT /api/calendar-events/:id
- [ ] DELETE /api/calendar-events/:id

### 8. Librería de Calendario

- [ ] Usar react-big-calendar o full-calendar
- [ ] Customizar estilos

### 9. Estados

- [ ] Loading: skeleton del calendario
- [ ] Empty state en día
- [ ] Error state

### 10. Responsive

- [ ] Desktop: vista mensual completa
- [ ] Tablet/Mobile: vista simplificada

### 11. Actualizar Layout

- [ ] Mover "Calendario" de "Próximamente" a "Productividad"
- [ ] Activar link `/calendar`

## Tareas Técnicas

- [ ] Evaluar y configurar librería de calendario - [2h]
- [ ] Crear página CalendarPage.tsx - [2h]
- [ ] Implementar selector de mes/año - [1.5h]
- [ ] Integrar librería y customizar estilos - [4h]
- [ ] Crear componente EventModal - [2h]
- [ ] Crear componente EventFormModal - [3h]
- [ ] Implementar date/time pickers - [2h]
- [ ] Integrar con API - [2.5h]
- [ ] Implementar lógica all-day events - [1h]
- [ ] Implementar confirmación de eliminación - [1h]
- [ ] Styling - [3h]
- [ ] Tests de componentes - [3h]
- [ ] Tests E2E - [2h]
- [ ] Actualizar Layout.tsx - [0.5h]

## Componentes Afectados

- **web:** CalendarPage, EventModal, EventFormModal, Calendar library integration

## Dependencias

- Sprint 8 completado (endpoints de calendario en backend)
- TanStack Query configurado

## Prioridad

high

## Esfuerzo Estimado

12 Story Points
