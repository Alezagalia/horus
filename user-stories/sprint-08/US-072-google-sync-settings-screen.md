# US-072: Pantalla de Configuración de Sincronización con Google

**Sprint:** 08 - Eventos de Calendario + Sincronización con Google
**ID:** US-072
**Título:** Pantalla de Configuración de Sincronización con Google

## Descripción

Como usuario, quiero conectar/desconectar mi cuenta de Google y ver el estado de sincronización, para gestionar la integración con Google Calendar.

## Criterios de Aceptación

- [ ] Nueva pantalla `CalendarSyncScreen` accesible desde:
  - Menú de configuración → "Sincronización de Calendario"
  - Banner en CalendarScreen si no está conectado
- [ ] Secciones de la pantalla:
  1. **Estado de Conexión:**
     - Si NO conectado:
       - Texto: "Conecta tu cuenta de Google para sincronizar eventos"
       - Botón "Conectar con Google" (estilo de Google)
     - Si conectado:
       - Badge verde "Conectado"
       - Email de cuenta de Google
       - Última sincronización (relativa: "Hace 5 minutos")
       - Botón "Desconectar"
  2. **Opciones de Sincronización:**
     - Toggle "Sincronizar automáticamente" (habilitar/deshabilitar cron)
     - Botón "Sincronizar ahora" (solo si conectado)
     - Loading indicator mientras sincroniza
     - Resultado: "X eventos importados, Y actualizados"
  3. **Información:**
     - Texto explicativo de qué se sincroniza
     - Link a documentación o FAQs
- [ ] Al tap en "Conectar con Google":
  - Llamar a POST /api/sync/google-calendar/connect
  - Recibir URL de autorización
  - Abrir browser con expo-auth-session o expo-web-browser
  - Completar OAuth flow
  - Recibir callback con código
  - Llamar a GET /api/sync/google-calendar/callback con código
  - Mostrar toast "Conectado exitosamente"
  - Ejecutar primera sincronización automáticamente
- [ ] Al tap en "Desconectar":
  - Mostrar dialog de confirmación: "¿Desconectar Google Calendar? Los eventos sincronizados se mantendrán pero no se actualizarán."
  - Llamar a POST /api/sync/google-calendar/disconnect
  - Actualizar UI a estado desconectado
- [ ] Al tap en "Sincronizar ahora":
  - Loading indicator
  - Llamar a POST /api/sync/google-calendar/sync
  - Mostrar resultado en toast
  - Actualizar CalendarScreen con nuevos eventos
- [ ] Manejo de errores:
  - Si OAuth falla: mostrar error específico
  - Si sincronización falla: mostrar detalles del error
  - Si token expirado: intentar refresh, sino pedir reconectar

## Tareas Técnicas

- [ ] Crear pantalla CalendarSyncScreen - [1.5h]
- [ ] Implementar botón "Conectar con Google" con OAuth flow - [2.5h]
- [ ] Configurar expo-auth-session para manejar callback - [2h]
- [ ] Integrar con endpoints de US-067 (connect, disconnect, status) - [1.5h]
- [ ] Implementar botón "Sincronizar ahora" con loading - [1h]
- [ ] Implementar dialog de confirmación de desconexión - [1h]
- [ ] Manejo de errores y estados (conectando, sincronizando, error) - [1.5h]
- [ ] Tests de componente - [2.5h]

## Componentes Afectados

- **mobile:** CalendarSyncScreen, OAuth flow components

## Dependencias

- US-067 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
