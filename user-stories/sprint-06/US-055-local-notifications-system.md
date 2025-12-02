# US-055: Sistema de Notificaciones Locales con Expo

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-055
**Título:** Sistema de Notificaciones Locales con Expo

## Descripción

Como usuario, quiero recibir notificaciones en mi dispositivo a la hora configurada, para recordar completar mis hábitos diarios.

## Criterios de Aceptación

- [ ] Configurar expo-notifications en la app
- [ ] Al programar notificación:
  - Crear notificación local diaria recurrente
  - Título: "🔔 Recordatorio de hábito"
  - Body: "[Nombre del hábito] - ¡No olvides completarlo hoy!"
  - Hora: según configuración del usuario
  - Recurrencia: diaria (se repite cada día)
- [ ] Notificación solo se envía si hábito NO completado ese día:
  - Verificar estado del hábito antes de mostrar notificación
  - Si ya completado: cancelar notificación del día
  - Implementar con notification handler de expo
- [ ] Al recibir notificación:
  - Tocar notificación abre la app en HabitosDiariosScreen
  - Deep link al hábito específico si es posible
- [ ] Al desactivar notificación o eliminar hábito:
  - Cancelar todas las notificaciones programadas de ese hábito
- [ ] Iconos y categorías de notificación configurados (Android)
- [ ] Sonido y vibración por defecto
- [ ] Funciona en foreground, background, y app cerrada

## Tareas Técnicas

- [ ] Instalar y configurar expo-notifications - [1h]
- [ ] Configurar permisos en app.json (iOS/Android) - [0.5h]
- [ ] Implementar función scheduleHabitNotification(habitId, time) - [2h]
- [ ] Implementar recurrencia diaria con trigger - [1h]
- [ ] Implementar notification handler para verificar si hábito completado - [2h]
- [ ] Implementar deep linking al tocar notificación - [2h]
- [ ] Implementar función cancelHabitNotification(habitId) - [1h]
- [ ] Configurar categorías e iconos (Android) - [1h]
- [ ] Tests de programación de notificaciones - [2h]
- [ ] Tests de deep linking - [1.5h]
- [ ] Tests manuales en dispositivo físico (iOS y Android) - [2h]

## Componentes Afectados

- **mobile:** Notification system, Deep linking, App configuration

## Dependencias

- US-054 debe estar en progreso (configuración en UI)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
