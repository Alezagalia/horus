# US-138: Página de Ejecutar Rutina (Web)

**Tipo:** user-story
**Prioridad:** medium
**Sprint:** 14
**Story Points:** 7
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario web
**Quiero** ejecutar rutinas y registrar series desde el navegador
**Para** entrenar con la pantalla más grande

---

## Criterios de Aceptación

### ExecuteRoutinePage (`/workouts/execute/:routineId`)

- [x] Layout 3 columnas (desktop) o 1 columna (mobile):
  - Izquierda: Lista de ejercicios (sidebar)
  - Centro: Ejercicio actual con historial y registro
  - Derecha: Resumen del workout (opcional)
- [x] Header: nombre rutina, cronómetro, botón "Finalizar"
- [x] Navegación: click en sidebar, botones Anterior/Siguiente
- [x] Vista ejercicio actual:
  - Nombre, grupo muscular
  - Sección "ÚLTIMA VEZ" (collapsible)
  - Sección "SERIES DE HOY" (tabla)
  - Botón "Agregar Serie"
  - Modal agregar serie
  - RPE slider, notas
- [x] Timer de descanso (toast o modal pequeño)
- [x] Finalizar: modal con resumen y notas
- [x] Responsive: funciona en desktop y tablet

---

## Tareas Técnicas

1. ExecuteRoutinePage - [2.5h]
2. Layout 3 columnas responsive - [1.5h]
3. Cronómetro - [0.5h]
4. Componente ejercicio actual - [2h]
5. Tabla de series con acciones inline - [1.5h]
6. Modal agregar serie - [1.5h]
7. Timer de descanso (toast) - [1h]
8. Integración API - [1.5h]
9. Styling - [1.5h]
10. Tests - [2h]

---

**Estimación:** 7 SP | 15.5h
