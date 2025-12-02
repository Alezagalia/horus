# US-051: Endpoint de Configuración de Notificaciones

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-051
**Título:** Endpoint de Configuración de Notificaciones

## Descripción

Como usuario, quiero configurar a qué hora recibir recordatorios para cada hábito, para personalizar cuándo me llegan las notificaciones.

## Criterios de Aceptación

- [ ] Endpoint `PUT /api/habits/:id/notifications` crea/actualiza configuración de notificación
- [ ] Body: `{ enabled: boolean, time: string }` (time en formato "HH:mm")
- [ ] Valida formato de time (HH:mm con valores válidos), devuelve 400 si incorrecto
- [ ] Si enabled = true: crea o actualiza NotificationSetting
- [ ] Si enabled = false: desactiva o elimina NotificationSetting
- [ ] Devuelve 404 si hábito no existe o no pertenece al usuario autenticado
- [ ] Respuesta incluye configuración actualizada
- [ ] Endpoint es idempotente (múltiples llamadas con mismo valor no generan errores)

## Tareas Técnicas

- [ ] Crear endpoint PUT /api/habits/:id/notifications - [1h]
- [ ] Validación de formato de hora con Zod (HH:mm, 00:00-23:59) - [1h]
- [ ] Implementar lógica de create/update/delete de NotificationSetting - [1.5h]
- [ ] Validación de ownership del hábito - [0.5h]
- [ ] Tests unitarios del endpoint - [2h]
- [ ] Tests de validación de formato de hora - [1h]
- [ ] Documentación de API - [0.5h]

## Componentes Afectados

- **backend:** NotificationController, NotificationService

## Dependencias

- US-050 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
