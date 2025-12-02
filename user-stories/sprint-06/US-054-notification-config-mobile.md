# US-054: Configuración de Notificaciones en EditHabitScreen

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-054
**Título:** Configuración de Notificaciones en EditHabitScreen

## Descripción

Como usuario, quiero configurar recordatorios para mis hábitos desde la pantalla de edición, para recibir notificaciones que me ayuden a no olvidar completarlos.

## Criterios de Aceptación

- [ ] En `EditHabitScreen`, agregar sección "Recordatorio" con:
  - Toggle switch: "Activar recordatorio"
  - Time picker: "Hora de recordatorio" (visible solo si toggle activado)
  - Texto informativo: "Recibirás una notificación si no completaste este hábito"
- [ ] Al activar toggle por primera vez:
  - Solicitar permisos de notificaciones con expo-notifications
  - Si usuario niega permisos: mostrar alert explicando cómo habilitarlos en configuración
  - Si usuario acepta: mostrar time picker
- [ ] Time picker con:
  - Formato 24h o 12h según configuración del dispositivo
  - Default: hora actual o 8:00 AM si es la primera vez
  - Selector nativo (iOS: wheel picker, Android: dialog picker)
- [ ] Al guardar hábito:
  - Llamar a endpoint PUT /api/habits/:id/notifications
  - Guardar configuración en backend
  - Programar notificación local con expo-notifications
  - Mostrar toast de éxito: "Recordatorio configurado para las [hora]"
- [ ] Si notificaciones deshabilitadas por sistema:
  - Mostrar badge en toggle indicando que permisos están negados
  - Al tap: abrir configuración del sistema (Linking.openSettings)
- [ ] Validaciones:
  - Hora no puede ser vacía si toggle está activado
  - Mostrar error si falla la configuración

## Tareas Técnicas

- [ ] Agregar sección "Recordatorio" en EditHabitScreen - [1h]
- [ ] Implementar toggle switch con estado - [0.5h]
- [ ] Implementar time picker nativo (DateTimePicker de @react-native-community) - [2h]
- [ ] Solicitar permisos de notificaciones con expo-notifications - [1.5h]
- [ ] Integrar con endpoint PUT /api/habits/:id/notifications (US-051) - [1h]
- [ ] Programar notificación local con expo-notifications - [2h]
- [ ] Manejo de permisos negados (alert + link a settings) - [1.5h]
- [ ] Validaciones de hora - [1h]
- [ ] Tests de componente - [2h]
- [ ] Tests de lógica de permisos - [1.5h]

## Componentes Afectados

- **mobile:** EditHabitScreen, Notification components

## Dependencias

- US-051 debe estar completa (endpoint de configuración)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
