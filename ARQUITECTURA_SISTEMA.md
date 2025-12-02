# Arquitectura del Sistema - Horus

**Última Actualización:** 2025-11-19

## Resumen

Documento de arquitectura generado automáticamente por el sistema MCP.

## Funcionalidades

### US-133: Pantalla de Gestión de Rutinas (Mobile) - Versión Base

Implementación de la funcionalidad base de gestión de rutinas para React Native. Incluye: lista de rutinas con estadísticas (veces ejecutada, última ejecución), vista detallada con ejercicios configurados, formulario de creación/edición (nombre y descripción), acciones de duplicar/eliminar con confirmación, integración con React Query, y componente RoutineCard reutilizable. NOTA: Gestión avanzada de ejercicios (drag-to-reorder, modal selector) queda pendiente para iteración futura debido a complejidad y limitaciones de tiempo.

**Componentes:** apps/mobile/src/api/routines.api.ts, apps/mobile/src/components/routines/RoutineCard.tsx, apps/mobile/src/screens/RoutinesScreen.tsx, apps/mobile/src/screens/RoutineDetailScreen.tsx, apps/mobile/src/screens/RoutineFormScreen.tsx

### US-132: Pantalla de Gestión de Ejercicios (Mobile)

Implementación completa de la pantalla de gestión de ejercicios para React Native. Incluye lista con filtros por grupo muscular, búsqueda por nombre, formulario modal para crear/editar, confirmación de eliminación, estados de carga/vacío/error, y pull-to-refresh. Siguiendo los patrones arquitectónicos del proyecto con React Query, componentes reutilizables y diseño consistente con el resto de la app.

**Componentes:** apps/mobile/src/api/exercises.api.ts, apps/mobile/src/components/exercises/ExerciseCard.tsx, apps/mobile/src/components/exercises/ExerciseFormModal.tsx, apps/mobile/src/screens/ExercisesScreen.tsx

### US-131: Endpoints de Estadísticas de Progreso

Implementación completa de endpoints para estadísticas de progreso de entrenamientos. Incluye estadísticas por ejercicio (evolución de carga, volumen, gráficos) y estadísticas generales (frecuencia, distribución muscular, top ejercicios). Sistema de análisis temporal con períodos configurables y cálculos de métricas avanzadas como mejora porcentual, volumen total, y frecuencia semanal.

**Componentes:** packages/shared/src/types/workout.types.ts, apps/backend/src/services/workoutStats.service.ts, apps/backend/src/controllers/workoutStats.controller.ts, apps/backend/src/routes/exercise.routes.ts, apps/backend/src/routes/stats.routes.ts, apps/backend/src/routes/index.ts

### US-130: Endpoints para Finalizar Entrenamiento y Calcular Estadísticas

Implementación completa de los endpoints para finalizar entrenamientos y consultar historial. Se desarrollaron 3 endpoints RESTful: PUT /workouts/:id/finish (finaliza workout y calcula estadísticas completas incluyendo detección automática de PRs), GET /workouts/:id (obtiene detalle completo de un workout con todos sus ejercicios y sets), y GET /workouts (lista workouts con filtros de fecha, rutina y paginación). El sistema calcula automáticamente duration, volume, avgWeight y detecta Personal Records comparando con el historial del usuario por ejercicio.

**Componentes:** apps/backend/src/services/workout.service.ts, apps/backend/src/controllers/workout.controller.ts, apps/backend/src/routes/workout.routes.ts, apps/backend/src/validations/workout.validation.ts, packages/shared/src/schemas/workout.schemas.ts, packages/shared/src/types/workout.types.ts

### US-129: Endpoints para Registrar Series de Entrenamiento

Implementación completa de los endpoints para registrar y gestionar series (sets) durante un entrenamiento activo. Se desarrollaron 4 endpoints RESTful que permiten añadir, actualizar, eliminar sets y actualizar metadatos de ejercicios. Se implementó lógica de auto-incremento de setNumber y recálculo automático tras eliminaciones. Todos los endpoints validan que el entrenamiento esté activo (no finalizado) y que pertenezca al usuario autenticado.

**Componentes:** apps/backend/src/services/workout.service.ts, apps/backend/src/controllers/workout.controller.ts, apps/backend/src/routes/workout.routes.ts, apps/backend/src/validations/workout.validation.ts, packages/shared/src/schemas/workout.schemas.ts

### US-122: Recurring Expenses Page Web

Implemented complete recurring expenses management functionality for the web application. Created a full CRUD interface with RecurringExpensesPage, RecurringExpenseCard, and RecurringExpenseFormModal components. Users can create expense templates (concept, category, currency), edit them, and toggle active/inactive status. Templates sorted alphabetically with filter to show/hide inactive ones. Integrated with existing backend endpoints from Sprint 10. Visual design includes card-based layout with hover actions, status badges, and confirmation modals for deactivation.

**Componentes:** packages/shared/src/types/recurringExpense.types.ts, apps/web/src/services/api/recurringExpenseApi.ts, apps/web/src/hooks/useRecurringExpenses.ts, apps/web/src/components/recurringExpenses/RecurringExpenseCard.tsx, apps/web/src/components/recurringExpenses/RecurringExpenseFormModal.tsx, apps/web/src/pages/RecurringExpensesPage.tsx, apps/web/src/App.tsx

### US-121: Transfer Modal Component and Integration

Implemented comprehensive transfer functionality in the web application with a visually appealing two-card modal design. The TransferModal component provides real-time validation, auto-filtering of destination accounts, and contextual pre-selection from multiple entry points (AccountsPage header, AccountDetailPage header, and AccountCard hover button). The implementation reuses existing backend infrastructure from US-120 and follows established patterns for form handling, validation, and state management.

**Componentes:** apps/web/src/components/transfers/TransferModal.tsx, apps/web/src/pages/AccountsPage.tsx, apps/web/src/pages/AccountDetailPage.tsx, apps/web/src/components/accounts/AccountCard.tsx

### Integración de Google Calendar en Web

Implementación completa de la integración con Google Calendar para la aplicación web de Horus. Los usuarios pueden conectar su cuenta de Google mediante OAuth2, sincronizar eventos automáticamente, y visualizar eventos de Google Calendar junto con eventos locales en una vista unificada. La funcionalidad incluye: modal de gestión de integración con estados (conectado/desconectado), flujo OAuth con popup, página de callback, sincronización manual bajo demanda, distinción visual de eventos de Google (color azul distintivo con borde), restricción de edición en eventos de Google, y manejo completo de errores (token expirado, permisos insuficientes, errores de sincronización). La implementación reutiliza endpoints existentes del backend del Sprint 8.

**Componentes:** apps/web/src/services/api/googleCalendarApi.ts, apps/web/src/hooks/useGoogleCalendar.ts, apps/web/src/components/calendar/GoogleCalendarSyncModal.tsx, apps/web/src/pages/GoogleCallbackPage.tsx, apps/web/src/pages/CalendarPage.tsx, apps/web/src/components/calendar/EventModal.tsx, apps/web/src/App.tsx

### Implementación de Página de Calendario Mensual (Web)

Implementación completa de la funcionalidad de calendario mensual para la aplicación web de Horus. Se creó una página interactiva con vista mensual que permite visualizar, crear, editar y eliminar eventos del calendario. La implementación incluye integración con react-big-calendar, gestión de estado con React Query, validación de formularios con Zod, y transformación de datos entre el modelo del backend (Event con startDateTime/endDateTime) y el modelo simplificado del frontend (CalendarEvent con date). Se añadió soporte para eventos de todo el día, categorización de eventos, ubicación, y recordatorios.

**Componentes:** apps/web/src/pages/CalendarPage.tsx, apps/web/src/components/calendar/EventModal.tsx, apps/web/src/components/calendar/EventFormModal.tsx, apps/web/src/services/api/calendarEventApi.ts, apps/web/src/hooks/useCalendarEvents.ts, packages/shared/src/types/event.types.ts, apps/web/src/App.tsx, apps/web/src/components/Sidebar.tsx, packages/shared/src/types/index.ts

### US-115: Monitoring y Logging en Producción con Sentry y Winston

Implementación completa de sistema de monitoring y logging para backend, web y mobile. Incluye Sentry para error tracking y performance monitoring, Winston para logging estructurado en backend, Error Boundary en web, y guía de configuración de alertas. Los errores se capturan automáticamente con contexto completo, los logs se guardan en formato JSON con rotación diaria, y se proporciona documentación para configurar alertas críticas (error rate >1%, p95 >1s, DB pool exhausted).

**Componentes:** apps/backend/src/lib/sentry.ts, apps/backend/src/lib/logger.ts, apps/backend/src/middlewares/request-logger.middleware.ts, apps/backend/src/index.ts, apps/web/src/lib/sentry.ts, apps/web/src/components/ErrorBoundary.tsx, apps/web/src/main.tsx, apps/mobile/src/lib/sentry.ts, apps/mobile/App.tsx, apps/mobile/app.json, apps/backend/.env.example, apps/web/.env.example, docs/sentry-alerting-guide.md

### CI/CD Completo con GitHub Actions (TECH-001)

Implementación de pipeline CI/CD completo con GitHub Actions que automatiza lint, type-check, tests unitarios, builds, E2E tests, Lighthouse CI, y deployments automáticos a staging/producción. El pipeline garantiza calidad de código antes de merges, ejecuta validaciones exhaustivas en cada PR, y despliega automáticamente a Vercel (web) cuando se pushea a develop/main. Incluye configuración de Lighthouse CI para auditorías de performance automáticas.

**Componentes:** ci-cd, github-actions, deployment, web-app, backend, shared

### Tests E2E en Web con Playwright (US-112)

Implementación completa de tests End-to-End (E2E) para la aplicación web usando Playwright. Se configuró Playwright para testing cross-browser (Chrome, Firefox, Safari), se crearon 59 test cases cubriendo flujos críticos (autenticación, hábitos, tareas) y keyboard shortcuts, se implementó integración con CI/CD en GitHub Actions con matrix builds, y se documentó el proceso completo. Los tests garantizan compatibilidad en todos los navegadores principales y verifican que los atajos de teclado funcionen correctamente.

**Componentes:** web, ci-cd, testing-infrastructure

### Tests E2E en Mobile con Detox (US-111)

Implementación completa de tests End-to-End (E2E) para la aplicación mobile usando Detox. Se configuró el framework de testing Detox para iOS y Android, se crearon suites de tests para flujos críticos (autenticación, hábitos, tareas, notificaciones), se implementó integración con CI/CD en GitHub Actions, y se documentó el proceso completo. Los tests cubren los principales user journeys de la aplicación y garantizan que las funcionalidades críticas funcionan correctamente en ambas plataformas.

**Componentes:** mobile, ci-cd, testing-infrastructure

### US-110: Backend Performance Optimization

Implementadas múltiples optimizaciones de rendimiento en el backend de la aplicación:

1. Database Indexes: Agregados 13 nuevos índices en Prisma schema para optimizar queries frecuentes en User (email), Habit (lastCompletedDate, createdAt), Task (createdAt, categoryId), Transaction (userId+type+date, categoryId), Event (startDateTime+notificationSent, categoryId)
2. Slow Query Logging: Implementado sistema de logging automático de queries lentas (>100ms) en desarrollo para identificar cuellos de botella
3. Connection Management: Configurado graceful shutdown con $disconnect en beforeExit para liberar conexiones correctamente
4. Query Event Logging: Mejorado sistema de logs de Prisma con emit: 'event' para capturar duración de queries en desarrollo

Los índices agregados mejoran significativamente el rendimiento de operaciones comunes como: filtrar hábitos por fecha de completitud, listar tareas por categoría, buscar transacciones por tipo, y encontrar eventos pendientes de notificación.

**Componentes:** apps/backend/prisma/schema.prisma, apps/backend/src/lib/prisma.ts, apps/backend/.env.example

### US-109: Web Performance Optimization

Implementadas múltiples optimizaciones de rendimiento en la aplicación web:

1. Vite Build Optimization: Configurado terser con compresión agresiva (passes: 2, pure_funcs, mangle), deshabilitado sourcemaps en producción, reducido chunkSizeWarningLimit a 400KB, habilitado cssCodeSplit
2. React Query Cache: Optimizada configuración con staleTime 10min (antes 5min), gcTime 60min, refetchOnMount: false, networkMode: online para minimizar llamadas de red
3. HTML Performance Hints: Agregado modulepreload para recursos críticos, crossorigin en preconnect, antialiased en body
4. CSS Optimizations: Agregado GPU acceleration con transform: translateZ(0) y backface-visibility: hidden, optimizaciones para reducir layout shifts en imágenes, respeto a prefers-reduced-motion

Resultado: Bundle total ~1.1MB con code splitting óptimo, lazy loading de rutas ya implementado en Sprint 11, chunks separados por biblioteca (react-core: 226KB, ui-libs: 268KB, charts: 349KB, validation: 107KB).

**Componentes:** apps/web/vite.config.ts, apps/web/src/main.tsx, apps/web/index.html, apps/web/src/index.css

### US-108: Mobile Performance Optimization

Implementadas múltiples optimizaciones de rendimiento en la aplicación móvil React Native:

1. Metro Bundler: Configurado minificación y compresión para producción con drop_console, tree shaking y optimización de bundle size
2. FlatList Performance: Agregados props de optimización (windowSize, maxToRenderPerBatch, removeClippedSubviews) a TareasScreen, HabitsListScreen y AccountsScreen
3. React.memo: Implementado memoization en componentes pesados (TaskCard, HabitCard, AccountCard) para prevenir re-renders innecesarios
4. React Query Cache: Optimizada configuración de cache con staleTime aumentado a 10min, gcTime a 60min, reducidos retries y deshabilitado refetchOnWindowFocus para minimizar llamadas de red

Estas optimizaciones mejoran significativamente el rendimiento de la app reduciendo renders, optimizando listas largas y minimizando el tamaño del bundle en producción.

**Componentes:** apps/mobile/metro.config.js, apps/mobile/App.tsx, apps/mobile/src/screens/TareasScreen.tsx, apps/mobile/src/screens/HabitsListScreen.tsx, apps/mobile/src/screens/AccountsScreen.tsx, apps/mobile/src/components/TaskCard.tsx, apps/mobile/src/components/habits/HabitCard.tsx, apps/mobile/src/components/accounts/AccountCard.tsx

### US-107: Web Push Notifications con Service Worker

Implementación completa de notificaciones push para la aplicación web usando Service Workers y Web Push API con VAPID. Incluye service worker para manejo de eventos push y notificationclick, hook React useWebPushNotifications para gestión de permisos y subscriptions, componente UI NotificationPermissionPrompt como card flotante, endpoint backend para VAPID public key, configuración de variables de entorno para VAPID keys, y deep linking desde notificaciones a rutas específicas. El sistema verifica soporte del navegador, solicita permisos granularmente, registra service worker, suscribe al push service con VAPID, envía subscription al backend como token WEB, y maneja eventos de notificación con navegación contextual. Incluye guía completa de setup en WEB_PUSH_SETUP.md con generación de keys, troubleshooting y checklist.

**Componentes:** apps/web/public/service-worker.js, apps/web/src/hooks/useWebPushNotifications.ts, apps/web/src/components/NotificationPermissionPrompt.tsx, apps/backend/src/controllers/push.controller.ts, apps/backend/src/routes/push.routes.ts, apps/backend/src/config/env.ts, WEB_PUSH_SETUP.md

### US-106: Push Notifications en Mobile con Expo Notifications

Implementación completa de notificaciones push en la aplicación móvil usando expo-notifications. Incluye configuración del plugin en app.json, servicio completo de gestión de notificaciones con registro de tokens y permisos, hook React para inicialización automática y manejo de notificaciones, deep linking para navegación desde notificaciones, componente UI de configuración de notificaciones, hook para gestión de badge count basado en items pendientes, y cliente API para comunicación con backend. El sistema soporta iOS y Android, maneja permisos granularmente, configura canal Android personalizado, y proporciona graceful degradation en emuladores/web. Incluye guía completa de integración en PUSH_NOTIFICATIONS_INTEGRATION.md.

**Componentes:** apps/mobile/app.json, apps/mobile/src/services/push-notifications.ts, apps/mobile/src/api/push.api.ts, apps/mobile/src/hooks/usePushNotifications.ts, apps/mobile/src/hooks/useBadgeCount.ts, apps/mobile/src/components/NotificationSettings.tsx, apps/mobile/src/hooks/index.ts, apps/mobile/src/services/index.ts

### US-105: Firebase Cloud Messaging Setup - Backend Infrastructure

Implementación completa de la infraestructura backend para Firebase Cloud Messaging (FCM). Se creó todo el sistema de gestión de tokens de dispositivos, envío de notificaciones push, y almacenamiento de historial de notificaciones. La implementación incluye inicialización de Firebase Admin SDK con manejo gracioso cuando no hay credenciales, servicios para registro/desregistro de tokens, envío de notificaciones a usuarios y tokens específicos, validaciones Zod, controladores HTTP, y rutas REST API. El sistema soporta múltiples plataformas (IOS, ANDROID, WEB), maneja automáticamente tokens inválidos desactivándolos, actualiza timestamps de uso, y guarda el historial de notificaciones en base de datos. Se implementó soft delete para tokens y un endpoint de prueba solo para desarrollo.

**Componentes:** apps/backend/src/lib/firebase-admin.ts, apps/backend/src/services/push/push-notification.service.ts, apps/backend/src/validations/push.validation.ts, apps/backend/src/controllers/push.controller.ts, apps/backend/src/routes/push.routes.ts, apps/backend/src/routes/index.ts, apps/backend/src/index.ts, apps/backend/prisma/schema.prisma

### Optimizaciones de Performance y PWA para Lighthouse

Se implementaron múltiples optimizaciones de performance para mejorar el score de Lighthouse: lazy loading de rutas con React.lazy y Suspense, code splitting granular por librerías (react-core, react-query, forms, validation, ui-libs, charts, utils, state), configuración de PWA con service worker (precache, runtime caching), optimización de fonts (font-display: swap), meta tags SEO/PWA, y configuración de minificación con terser. El bundle se dividió en 22 chunks con precache de 1140KB, mejorando significativamente el tiempo de carga inicial.

**Componentes:** apps/web

### Sistema de Atajos de Teclado Global para Web

Se implementó un sistema completo de atajos de teclado (keyboard shortcuts) para la aplicación web usando react-hotkeys-hook. Incluye navegación global (g+h, g+t, g+m, g+k, g+c), navegación en listas (j/k), acciones (space, n, e, d, enter), atajos de formulario (Ctrl+Enter, Esc) y un modal de ayuda (Shift+?). El sistema mejora significativamente la productividad de power users permitiendo navegación y acciones sin mouse.

**Componentes:** apps/web

### Integración de US-101 con backend API - Sistema de tareas completo

Se integró el sistema de gestión de tareas (US-101) con el backend API existente del Sprint 7. La integración incluye: capa de servicios API con axios para comunicación HTTP, mappers bidireccionales para transformar tipos entre frontend y backend, hooks de React Query con optimistic updates para mejor UX, manejo de estados de carga y error, y sincronización completa de checklist dinámico. El sistema ahora persiste datos en PostgreSQL vía Prisma, soporta filtrado server-side por status/prioridad/categoría, y mantiene cache inteligente con invalidación automática. Bundle size aumentó ~14KB (+2.2%) para 630KB total, aceptable para funcionalidad completa con persistencia real.

**Componentes:** apps/web/src/services/api/taskApi.ts, apps/web/src/hooks/useTasks.ts, apps/web/src/pages/TasksPage.tsx

### Implementación completa del sistema de gestión de tareas (US-101)

Se implementó el sistema completo de gestión de tareas con interfaz visual avanzada, incluyendo CRUD completo, sistema de filtros multicapa (estado, prioridad, categoría), ordenamiento flexible, checklist dinámica, cálculo automático de estados de vencimiento, y UI consistente con el resto de la aplicación. La implementación incluye 6 componentes React con TypeScript, validación con Zod, optimización con useMemo, y mock data comprehensivo que demuestra todos los casos de uso. El sistema permite crear, editar, eliminar, completar y filtrar tareas con feedback visual inmediato mediante colores, badges y estados calculados automáticamente.

**Componentes:** apps/web/src/types/tasks.ts, apps/web/src/schemas/taskSchema.ts, apps/web/src/components/tasks/TaskCard.tsx, apps/web/src/components/tasks/TaskFilters.tsx, apps/web/src/components/tasks/TaskFormModal.tsx, apps/web/src/components/tasks/TaskDetailsModal.tsx, apps/web/src/pages/TasksPage.tsx

### Página de Estadísticas Detalladas de Hábitos con Visualizaciones

Implementación completa de la página de estadísticas individuales de hábitos (US-100) con visualizaciones interactivas usando Recharts. Incluye 4 secciones principales: (1) Rachas con comparación visual entre racha actual y récord personal, (2) Tasas de cumplimiento con progress bars para diferentes períodos (general, 30 días, 7 días) e insights automáticos, (3) Gráfico de evolución temporal con BarChart para hábitos CHECK y LineChart con target line para hábitos NUMERIC, (4) Calendario mensual interactivo con tooltips mostrando status de cada día. La página es completamente responsive y soporta datos mock realistas generados aleatoriamente para desarrollo sin backend.

**Componentes:** apps/web/src/pages/HabitStatsPage.tsx, apps/web/src/components/habitStats/StreakCard.tsx, apps/web/src/components/habitStats/CompletionRateCard.tsx, apps/web/src/components/habitStats/EvolutionChart.tsx, apps/web/src/components/habitStats/HabitCalendar.tsx, apps/web/src/types/habitStats.ts, apps/web/src/App.tsx, apps/web/src/components/habits/HabitListItem.tsx

### Página de Gestión Completa de Hábitos con CRUD

Implementación completa de la página de gestión de hábitos (US-099) que permite listar, crear, editar y desactivar hábitos. Incluye búsqueda, filtros por categoría, ordenamiento múltiple, y un formulario modal completo con validaciones Zod. Los hábitos soportan dos tipos (CHECK/NUMERIC), múltiples periodicidades (DAILY/WEEKLY/MONTHLY/CUSTOM), y configuración de días de la semana para hábitos semanales. La interfaz muestra badges informativos con tipo, periodicidad, momento del día, categoría y rachas. Los hábitos inactivos se muestran con opacidad reducida al final de la lista.

**Componentes:** apps/web/src/pages/HabitsPage.tsx, apps/web/src/components/habits/HabitListItem.tsx, apps/web/src/components/habits/HabitFormModal.tsx, apps/web/src/components/habits/SearchBar.tsx, apps/web/src/components/habits/CategoryFilter.tsx, apps/web/src/types/habits.ts, apps/web/src/schemas/habitSchema.ts

### Endpoints para Editar y Deshacer Pagos de Gastos Mensuales - US-087

Implementación de endpoints PUT /api/monthly-expenses/:id (editar) y PUT /api/monthly-expenses/:id/undo (deshacer) para corregir o revertir pagos de gastos mensuales. Ambos endpoints usan transacciones atómicas Prisma que: 1) Revierten saldo de cuenta original, 2) Eliminan transacción asociada, 3) Crean nueva transacción (solo edit), 4) Actualizan saldo de cuenta nueva (solo edit), 5) Actualizan MonthlyExpenseInstance. El endpoint de edición permite cambiar amount, accountId, paidDate, notes; detecta qué cambió y solo actualiza transacción si es necesario. El endpoint undo cambia status a 'pendiente', revierte saldo, elimina transacción, y limpia campos de pago.

**Componentes:** Backend API, MonthlyExpense Service Layer, MonthlyExpense Controllers, Transaction Model, Account Model, Atomic Transactions, Zod Validations

### Endpoint para Marcar Gasto Mensual como Pagado con Transacción Atómica - US-086

Implementación de endpoint PUT /api/monthly-expenses/:id/pay para marcar gastos mensuales como pagados mediante transacción atómica. El proceso actualiza el MonthlyExpenseInstance a status 'pagado', crea una Transaction tipo 'egreso' con concepto generado automáticamente, y actualiza el saldo de la cuenta seleccionada. Todo se ejecuta en una transacción Prisma para garantizar atomicidad (todo o nada). Incluye validaciones de ownership, status, saldo suficiente, y manejo robusto de errores con códigos HTTP específicos.

**Componentes:** Backend API, MonthlyExpense Service Layer, MonthlyExpense Controllers, Transaction Model, Account Model, Atomic Transactions, Zod Validations

### Endpoints para Obtener Instancias Mensuales de Gastos - US-085

Implementación de endpoints REST API para consultar instancias mensuales de gastos recurrentes (MonthlyExpenseInstance). Se crearon 2 endpoints GET: uno para obtener instancias de un mes/año específico y otro shortcut para el mes actual. Ambos endpoints incluyen filtro opcional por status (pendiente/pagado), validación de parámetros con Zod, y respuestas con includes de RecurringExpense, Category y Account relacionados. Las instancias se ordenan por status (pendientes primero) y luego alfabéticamente por concepto.

**Componentes:** Backend API, MonthlyExpense Service Layer, MonthlyExpense Controllers, API Routes, Zod Validations

### Endpoints CRUD de Plantillas de Gastos Recurrentes - US-084

Implementación completa de endpoints REST API para gestionar plantillas de gastos recurrentes (RecurringExpense). Se crearon 5 endpoints CRUD con validación Zod, autenticación JWT y lógica de negocio que valida categorías scope 'gastos'. Los endpoints permiten crear, listar, obtener por ID, actualizar y eliminar (soft delete) plantillas de gastos recurrentes. Se incluyeron filtros opcionales y manejo robusto de errores con códigos HTTP adecuados.

**Componentes:** Backend API, RecurringExpense Service Layer, RecurringExpense Controllers, API Routes, Zod Validations

### Pantalla TransferScreen para transferencias entre cuentas

Implementación completa de la pantalla para transferir dinero entre cuentas del usuario en la aplicación móvil. Incluye selectores de cuenta origen y destino con filtros inteligentes (solo cuentas activas con saldo para origen, misma moneda para destino), indicador visual de dirección con flecha, input de monto con validación de saldo disponible, display de saldo disponible con estado de alerta si es insuficiente, campo de concepto con default 'Transferencia', date picker, campo de notas opcional, y validaciones exhaustivas (cuentas diferentes, misma moneda, saldo suficiente). Se integra con el endpoint POST /api/transactions/transfer e invalida múltiples caches para mantener datos actualizados.

**Componentes:** apps/mobile/src/components/transfers, apps/mobile/src/screens, apps/mobile/src/api

### Pantalla CreateTransactionScreen para ingresos y egresos

Implementación completa de la pantalla para crear transacciones (ingresos y egresos) en la aplicación móvil. Incluye toggle visual para seleccionar tipo de transacción con colores distintivos (verde para ingresos, rojo para egresos), selectores modales para cuenta y categoría, input de monto con teclado numérico, campo de concepto con validación, date picker para seleccionar fecha, campo opcional de notas multilinea, y validaciones en tiempo real. La pantalla se integra con el endpoint POST /api/transactions e invalida los caches de React Query para refrescar datos automáticamente.

**Componentes:** apps/mobile/src/components/transactions, apps/mobile/src/screens, apps/mobile/src/api

### Pantalla AccountDetailScreen con transacciones

Implementación completa de la pantalla de detalle de cuenta en la aplicación móvil. Incluye header visual con estadísticas de cuenta, lista agrupada de transacciones por mes con filtros, componentes reutilizables para items de transacción, utilidades de formateo de fechas en español, y sistema completo de API client para transacciones con soporte para CRUD, transferencias, filtros y paginación. La pantalla permite visualizar el historial completo de movimientos de una cuenta con información detallada de cada transacción.

**Componentes:** apps/mobile/src/api, apps/mobile/src/components/accounts, apps/mobile/src/components/transactions, apps/mobile/src/screens, apps/mobile/src/utils

### Implementación de Pantalla CreateAccountScreen con Formulario Completo y Pickers Personalizados

Se implementó pantalla completa para creación de cuentas en React Native con formulario validado que incluye: input de nombre, selector de tipo de cuenta (4 opciones con emojis), selector de moneda (ARS/USD/EUR/BRL), input de saldo inicial, color picker con paleta de 12 colores y icon picker horizontal con 16 iconos. Incluye validaciones en tiempo real, defaults inteligentes según tipo seleccionado, loading state en botón submit, integración con endpoint POST /api/accounts y manejo de errores. Componentes reutilizables: AccountTypePicker, CurrencyPicker, ColorPicker, IconPicker.

**Componentes:** mobile/screens, mobile/components/accounts

### Implementación de Pantalla AccountsScreen con Dashboard Financiero Completo

Se implementó pantalla completa de gestión de cuentas en React Native con dashboard financiero que incluye: resumen de saldo total agrupado por moneda, lista de cuentas con cards personalizadas por tipo, estadísticas del mes (ingresos/egresos/balance), integración con endpoints backend (accounts y finance stats), pull-to-refresh, loading states, empty state con ilustración y FAB para crear cuentas. Incluye componentes reutilizables (AccountCard, TotalBalanceCard, MonthStatsCard), API services tipados y utilidades de formateo de moneda con soporte multi-moneda.

**Componentes:** mobile/screens, mobile/components/accounts, mobile/api, mobile/utils

### Implementación de Endpoint de Estadísticas Financieras con Agregaciones y Evolución Mensual

Se implementó endpoint completo de estadísticas financieras que proporciona análisis exhaustivo de ingresos, egresos, balance mensual, desglose por categoría con porcentajes, evolución de últimos 6 meses y resumen de cuentas. Utiliza agregaciones de Prisma para cálculos eficientes. Incluye validaciones de rango de fechas (mes 1-12, año 2000-2100) y defaults al mes actual. Todas las estadísticas calculadas dinámicamente por período solicitado.

**Componentes:** backend/services, backend/controllers, backend/routes

### Implementación de Endpoint de Transferencias entre Cuentas con Transacciones Vinculadas

Se implementó endpoint completo para transferencias entre cuentas del mismo usuario con creación atómica de dos transacciones vinculadas (egreso e ingreso). Incluye validaciones robustas (misma moneda, cuentas diferentes, saldo suficiente), actualización sincronizada de balances, y funcionalidad completa de CRUD para transferencias. Se creó automáticamente categoría "Transferencias" si no existe. Implementado patrón de sincronización de pares para mantener coherencia en ediciones y eliminaciones.

**Componentes:** backend/validations, backend/services, backend/controllers, backend/routes

### Implementación de Endpoints CRUD de Transacciones con Actualizaciones Atómicas de Balance

Se implementaron endpoints REST completos para gestión de transacciones financieras (ingresos y egresos) con actualización atómica de balances de cuentas. Incluye validaciones Zod robustas, filtros avanzados, paginación, agregaciones de totales y manejo especial de transferencias. Todas las operaciones que afectan balances utilizan transacciones Prisma ($transaction) para garantizar integridad de datos. Implementado patrón de cálculo delta para actualizaciones eficientes de montos.

**Componentes:** backend/validations, backend/services, backend/controllers, backend/routes, backend/database

### Endpoints CRUD de transacciones con actualización atómica de balances

Implementación completa de endpoints REST para gestión de transacciones financieras (ingresos y egresos) con actualización atómica de balances de cuentas mediante Prisma transactions. Se crearon validaciones Zod con límites temporales (no más de 1 año futuro) y validación de monto positivo, servicio con transacciones atómicas que garantizan consistencia entre Transaction y Account.currentBalance, soporte completo para filtros (accountId, categoryId, type, rango fechas), paginación configurable (limit/offset), cálculo de totales agregados por rango, y manejo especial de transferencias (eliminación en cascada de par vinculado). El sistema usa prisma.$transaction para operaciones atómicas críticas: crear/actualizar/eliminar transacción + actualizar balance en un solo bloque, garantizando integridad de datos financieros.

**Componentes:** apps/backend/src/validations/transaction.validation.ts, apps/backend/src/services/transaction.service.ts, apps/backend/src/controllers/transaction.controller.ts, apps/backend/src/routes/transaction.routes.ts, apps/backend/src/routes/index.ts

### Endpoints CRUD completos para gestión de cuentas financieras

Implementación completa de los endpoints REST para gestión de cuentas financieras (Account). Se crearon validaciones Zod con soporte para tipos de cuenta (efectivo, banco, billetera_digital, tarjeta) y códigos de moneda ISO 4217, servicio con lógica CRUD optimizada incluyendo cálculo de balances totales por moneda y estadísticas por cuenta, controlador REST con 5 endpoints (GET all, GET by id, POST create, PUT update, PUT deactivate), y rutas protegidas con autenticación. El sistema incluye defaults inteligentes de color e ícono según tipo de cuenta, soft delete para preservar historial, y validaciones que previenen desactivación de cuentas con transacciones.

**Componentes:** apps/backend/src/validations/account.validation.ts, apps/backend/src/services/account.service.ts, apps/backend/src/controllers/account.controller.ts, apps/backend/src/routes/account.routes.ts, apps/backend/src/routes/index.ts

### Modelos Account y Transaction para gestión financiera

Implementación completa de los modelos de base de datos Account y Transaction en Prisma para el sistema de gestión financiera. Se crearon dos nuevos enums (AccountType y TransactionType), el modelo Account para gestionar cuentas bancarias/efectivo/billeteras/tarjetas con balances inicial y actual, y el modelo Transaction para registrar ingresos, egresos y transferencias entre cuentas. Incluye documentación exhaustiva en comentarios, relaciones bien definidas con ON DELETE RESTRICT para integridad referencial, índices optimizados para queries comunes, y soporte completo para transferencias bidireccionales mediante el campo transferPairId.

**Componentes:** apps/backend/prisma/schema.prisma

### Pantalla de Configuración de Sincronización con Google Calendar

Implementación completa de la pantalla CalendarSyncScreen que permite a los usuarios conectar/desconectar su cuenta de Google Calendar, gestionar la sincronización automática, y realizar sincronizaciones manuales. Incluye integración con OAuth2 mediante expo-auth-session, manejo de estados de conexión, y banners informativos en CalendarScreen para promover la conexión. La pantalla proporciona una experiencia de usuario completa con estados de carga, manejo de errores, y feedback visual mediante badges, alertas y banners de resultado.

**Componentes:** apps/mobile/src/screens/CalendarSyncScreen.tsx, apps/mobile/src/screens/CalendarScreen.tsx, apps/mobile/src/services/googleSyncService.ts, apps/mobile/package.json

### Pantallas CreateEventScreen y EditEventScreen - US-071

Implementación completa de formularios para crear y editar eventos de calendario en mobile. CreateEventScreen permite crear nuevos eventos con título, descripción, ubicación, fechas/horas inicio/fin, toggle all-day, y toggle sync Google. EditEventScreen permite editar eventos existentes con campos adicionales de estado y botón de eliminación con confirmación. Usan DateTimePicker nativo, validación Zod, loading states, y navegación apropiada.

**Componentes:** apps/mobile/src/screens/CreateEventScreen.tsx, apps/mobile/src/screens/EditEventScreen.tsx, apps/mobile/src/utils/eventValidation.ts

### Pantalla CalendarScreen con Vista Mensual - US-070

Implementación completa de CalendarScreen con vista mensual interactiva usando react-native-calendars. Incluye componente EventListItem para mostrar eventos del día seleccionado, marcado visual de días con eventos (dots multi-color), navegación entre meses, destacado del día actual, lista ordenada de eventos al seleccionar día, soporte para filtros (categoría/fuente/estado), pull-to-refresh para sincronización, FAB para crear eventos, loading states, y empty state. La pantalla muestra eventos con hora/ubicación/categoría/badge de Google sync, ordenados por startDateTime con all-day events primero.

**Componentes:** apps/mobile/src/screens/CalendarScreen.tsx, apps/mobile/src/components/EventListItem.tsx, apps/mobile/package.json

### Sincronización Google → Local (Importar) - US-069

Implementación completa de sincronización unidireccional desde Google Calendar hacia eventos locales de Horus. Incluye fetch de eventos desde Google Calendar, conversión automática de formato Google→Local, detección y resolución de conflictos con estrategia last-write-wins, manejo de eventos cancelados, y endpoint manual de sincronización. El sistema compara timestamps (googleEvent.updated vs event.updatedAt) para determinar cuál versión es más reciente y actualiza en consecuencia. Soporta all-day events, eventos recurrentes, reminders, y mantiene trazabilidad completa de operaciones (created, updated, deleted, conflicts).

**Componentes:** apps/backend/src/services/googleCalendarSync.service.ts, apps/backend/src/controllers/sync.controller.ts, apps/backend/src/routes/sync.routes.ts

### Sincronización Local → Google Calendar (Exportar) - US-068

Implementación completa de sincronización unidireccional desde eventos locales de Horus hacia Google Calendar. Incluye conversión automática de formato, manejo inteligente de errores con exponential backoff, soporte para eventos recurrentes, y sistema de reintentos automáticos. La sincronización se ejecuta automáticamente al crear, actualizar o eliminar eventos locales que tengan syncWithGoogle=true. Maneja casos especiales como rate limiting (429), errores de autenticación (401), eventos no encontrados (404), y deshabilitación de sync.

**Componentes:** apps/backend/prisma/schema.prisma, apps/backend/src/services/googleCalendarSync.service.ts, apps/backend/src/services/event.service.ts

### Implementación de OAuth2 Flow con Google Calendar (US-067)

Implementación completa del flujo OAuth2 para autenticación con Google Calendar API, incluyendo generación de URLs de autorización, intercambio de códigos por tokens, refresh automático de tokens expirados, y desconexión segura. Los tokens se almacenan encriptados en la base de datos usando AES-256-GCM. Se exponen 4 endpoints REST para gestionar la conexión: connect (POST), callback (GET), disconnect (POST) y status (GET).

**Componentes:** apps/backend/src/services/googleAuth.service.ts, apps/backend/src/controllers/sync.controller.ts, apps/backend/src/routes/sync.routes.ts, apps/backend/src/routes/index.ts, apps/backend/src/config/env.ts

### US-061: Pantalla TareasScreen con Listado y Filtros

Implementación completa de la pantalla principal de gestión de tareas en React Native. Incluye lista de tareas con TaskCard mostrando sistema de color semáforo basado en vencimiento, barra de filtros con chips (estado, prioridad, fecha), toggle rápido con checkbox, pull-to-refresh, FAB para crear tarea, empty state y loading states. Sistema de color semáforo implementado con 6 variantes según urgencia. Todos los componentes creados siguiendo patrones del proyecto móvil existente.

**Componentes:** apps/mobile/src/screens/TareasScreen.tsx, apps/mobile/src/components/TaskCard.tsx, apps/mobile/src/components/TaskFilterBar.tsx, apps/mobile/src/api/tasks.api.ts, apps/mobile/src/utils/taskColors.ts, apps/mobile/INTEGRACION_TAREAS_SCREEN.md

### US-060: Endpoint de Toggle de Estado de Tarea

Implementación de endpoint POST /api/tasks/:id/toggle que permite cambiar rápidamente el estado de una tarea entre completada y pendiente con un solo llamado. El endpoint implementa lógica inteligente: pendiente/en_progreso→completada (set completedAt), completada→pendiente (clear completedAt y archivedAt), y rechaza tareas canceladas con error 400. Es idempotente, valida ownership del usuario, y optimizado para response time <150ms.

**Componentes:** apps/backend/src/services/task.service.ts, apps/backend/src/controllers/task.controller.ts, apps/backend/src/routes/task.routes.ts

### US-059: Cron Job de Archivado Automático

Implementación de cron job que se ejecuta diariamente a las 00:01 para archivar automáticamente tareas completadas hace más de 24 horas. El job utiliza node-cron para scheduling, consulta optimizada con índices existentes en Prisma, logging detallado de operaciones, y manejo robusto de errores que permite continuar el proceso aunque falle el archivado de una tarea individual. Sigue el mismo patrón establecido en US-036 (auto-complete-habits.job.ts).

**Componentes:** apps/backend/src/jobs/archive-tasks.job.ts, apps/backend/src/index.ts

### US-058: Endpoints de Gestión de Checklist

Implementación completa de endpoints REST para gestionar checklist items dentro de tareas. Se crearon validaciones Zod, servicio con lógica de negocio y 4 nuevos endpoints en el taskController. Los endpoints permiten crear, actualizar, eliminar y reordenar items de checklist con validaciones robustas de ownership y consistencia de datos. La funcionalidad de reordenamiento utiliza transacciones Prisma para garantizar atomicidad y valida que todos los items estén incluidos sin duplicados ni posiciones faltantes.

**Componentes:** apps/backend/src/validations/checklist.validation.ts, apps/backend/src/services/checklist.service.ts, apps/backend/src/controllers/task.controller.ts, apps/backend/src/routes/task.routes.ts

### US-057: Endpoints CRUD de Tareas

Implementación completa de los endpoints REST para la gestión de tareas (CRUD). Se crearon validaciones Zod, servicio con lógica de negocio y controlador con 5 endpoints siguiendo los patrones establecidos en el proyecto Horus. Los endpoints permiten listar tareas con filtros avanzados (status, priority, categoryId, dueDateFilter), obtener detalles de una tarea específica, crear, actualizar y eliminar tareas. Se implementó validación de categorías de scope 'tareas', gestión automática de timestamps (completedAt, canceledAt), y recalculación de orderPosition al eliminar tareas.

**Componentes:** apps/backend/src/validations/task.validation.ts, apps/backend/src/services/task.service.ts, apps/backend/src/controllers/task.controller.ts, apps/backend/src/routes/task.routes.ts, apps/backend/src/routes/index.ts

### US-056: Modelos Task y TaskChecklistItem en Base de Datos

Creados modelos completos de base de datos para sistema de gestión de tareas. Agregados enums Priority (alta/media/baja) y TaskStatus (pendiente/en_progreso/completada/cancelada). Modelo Task incluye todos los campos requeridos: title, description, priority, status, dueDate, completedAt, canceledAt, archivedAt, cancelReason, orderPosition, isActive. Modelo TaskChecklistItem para sub-tareas con title, completed, position. Relaciones configuradas: Task->User (CASCADE), Task->Category (RESTRICT), TaskChecklistItem->Task (CASCADE). Índices optimizados para queries: (userId, isActive, status), (userId, dueDate), (taskId, position). Migración SQL creada y documentada. Schema Prisma actualizado con documentación completa.

**Componentes:** apps/backend/prisma/schema.prisma, apps/backend/prisma/migrations/20250123_add_task_models/migration.sql

### US-055: Sistema de Notificaciones Locales con Expo

Implementado sistema completo de notificaciones locales con expo-notifications. Creado módulo centralizado NotificationService con funciones para programar/cancelar notificaciones diarias recurrentes. Configurado deep linking para abrir HabitDetail al tocar notificación. Configurado app.json con permisos iOS/Android y scheme para deep linking. Integrado en HabitFormScreen para programar notificaciones al activar recordatorio y en HabitsListScreen para cancelar al eliminar hábito. Configurados canales de notificación Android con icono, color, vibración. Deep linking funciona en foreground, background y app cerrada.

**Componentes:** apps/mobile/src/services/NotificationService.ts, apps/mobile/App.tsx, apps/mobile/src/screens/HabitFormScreen.tsx, apps/mobile/src/screens/HabitsListScreen.tsx, apps/mobile/app.json

### US-054: Configuración de Notificaciones en EditHabitScreen

Implementada funcionalidad completa para configurar notificaciones de recordatorio en la pantalla de creación/edición de hábitos. Se integró DateTimePicker nativo (iOS wheel, Android dialog), manejo de permisos con expo-notifications, programación de notificaciones locales diarias, y manejo de permisos denegados con opción de abrir Configuración. Reemplazó TextInput manual con selector de tiempo nativo. Integración completa con endpoint PUT /api/habits/:id/notifications de US-051.

**Componentes:** apps/mobile/src/screens/HabitFormScreen.tsx, apps/mobile/src/api/habits.api.ts

### US-053: Feature de Reactivación en HabitosScreen

Se implementó la funcionalidad completa de reactivación de hábitos desde HabitsListScreen. Los hábitos inactivos ahora se muestran con badge "Inactivo", opacidad reducida (0.6), y acción de swipe-to-reactivate en naranja. Al hacer swipe sobre un hábito inactivo, aparece la acción "Reactivar" que abre un dialog de confirmación con input opcional para razón de reactivación (max 200 caracteres). La implementación incluye optimistic update con TanStack Query para actualización visual inmediata, rollback automático en caso de error, y Toast de éxito cuando se completa. El sistema distingue automáticamente entre hábitos activos (swipe-to-delete rojo) e inactivos (swipe-to-reactivate naranja). Se integró con el endpoint POST /api/habits/:id/reactivate del backend (US-049).

**Componentes:** mobile/src/api/habits.api.ts, mobile/src/components/habits/ReactivateHabitDialog.tsx, mobile/src/components/habits/HabitCard.tsx, mobile/src/screens/HabitsListScreen.tsx, mobile/src/utils/auditFormatters.ts

### US-052: Pantalla HabitAuditScreen - Timeline de Cambios

Se implementó la pantalla HabitAuditScreen que muestra el historial de cambios de un hábito en formato timeline visual. La pantalla presenta cada cambio con su tipo (CREATED, UPDATED, DELETED, REACTIVATED), el campo modificado, los valores antiguos y nuevos formateados de forma legible, y la fecha relativa del cambio. Se creó el componente TimelineItem para renderizar cada entrada del historial con diseño visual atractivo, incluyendo iconos de colores por tipo de cambio, línea de tiempo vertical, y formato especial para valores como colores (con swatches visuales), periodicidad, días de la semana, etc. La pantalla incluye estados de carga, error, empty state, y pull-to-refresh. La navegación se integró desde HabitDetailScreen mediante un botón "Ver Historial de Cambios".

**Componentes:** mobile/src/screens/HabitAuditScreen.tsx, mobile/src/screens/HabitAuditScreenWrapper.tsx, mobile/src/components/habits/TimelineItem.tsx, mobile/src/utils/auditFormatters.ts, mobile/src/api/habits.api.ts, mobile/App.tsx, mobile/src/screens/HabitDetailScreen.tsx, mobile/src/screens/HabitDetailScreenWrapper.tsx

### US-051: Endpoint de Configuración de Notificaciones

Se implementó el endpoint PUT /api/habits/:id/notifications para configurar notificaciones de recordatorio para hábitos individuales. Los usuarios pueden habilitar/deshabilitar notificaciones y especificar la hora deseada en formato HH:mm. El servicio implementa lógica idempotente que permite crear, actualizar o deshabilitar configuraciones de notificación sin errores en llamadas múltiples. Se utiliza soft-disable (enabled=false) para preservar la configuración de tiempo cuando se deshabilitan las notificaciones.

**Componentes:** backend/src/validations/notification.validation.ts, backend/src/services/notification.service.ts, backend/src/controllers/habit.controller.ts, backend/src/routes/habit.routes.ts

### US-049: Endpoint de Reactivación de Hábitos

Implementación del endpoint POST /api/habits/:id/reactivate para reactivar hábitos previamente desactivados (soft delete). El endpoint valida que el hábito esté inactivo, lo reactiva estableciendo isActive=true, resetea currentStreak=0 para comenzar una racha nueva, mantiene longestStreak como récord histórico, y crea un registro de auditoría con changeType=REACTIVATED. Soporta body opcional con campo reason para documentar el motivo de la reactivación. Utiliza transacciones Prisma para garantizar atomicidad entre la actualización del hábito y la creación del audit log.

**Componentes:** apps/backend/src/services/habit.service.ts, apps/backend/src/controllers/habit.controller.ts, apps/backend/src/routes/habit.routes.ts, apps/backend/src/validations/habit.validation.ts

### US-048: Endpoint de Historial de Cambios

Implementación del endpoint GET /api/habits/:id/audit para consultar el historial de cambios de un hábito específico. El endpoint devuelve los registros de auditoría ordenados por fecha descendente (más recientes primero), deserializa automáticamente los valores JSON para facilitar su lectura, soporta paginación mediante parámetro limit (default: 50, max: 100), y valida que el hábito pertenezca al usuario autenticado. La respuesta incluye changeType, fieldChanged, oldValue, newValue, reason y createdAt de cada cambio registrado.

**Componentes:** apps/backend/src/controllers/habit.controller.ts, apps/backend/src/routes/habit.routes.ts, apps/backend/src/validations/habit.validation.ts

### US-047: Registro Automático de Cambios en Hábitos

Implementación del sistema de auditoría automática de cambios en hábitos. Todos los cambios CRUD (crear, actualizar, eliminar) ahora generan automáticamente registros en HabitAudit. El sistema detecta qué campos fueron modificados, serializa valores complejos como JSON, y utiliza transacciones atómicas para garantizar consistencia entre el cambio en Habit y su registro de auditoría. Se creó AuditService con helpers reutilizables y se modificó HabitService para integrar auditoría en todos los endpoints. Los campos auditados incluyen: name, description, periodicity, weekDays, timeOfDay, color, targetValue, unit, categoryId.

**Componentes:** apps/backend/src/services/audit.service.ts, apps/backend/src/services/habit.service.ts

### US-043: Feature de Marcado Retroactivo en Mobile

Implementación completa de la funcionalidad de marcado retroactivo en la aplicación móvil. Permite a los usuarios marcar hábitos de días anteriores (hasta 7 días) desde un bottom sheet intuitivo. Incluye selector de fecha personalizado, filtrado inteligente de hábitos según periodicidad, manejo de hábitos CHECK y NUMERIC, guardado en paralelo con manejo de errores parciales, y actualización automática de rachas.

**Componentes:** apps/mobile/src/api/habits.api.ts, apps/mobile/src/components/habits/DateSelector.tsx, apps/mobile/src/components/habits/RetroactiveMarkingSheet.tsx, apps/mobile/src/screens/HabitosDiariosScreen.tsx, apps/mobile/src/components/stats/WeeklyChart.tsx

### US-038: Endpoint de Estadísticas de Hábito Específico

Implementación completa de endpoint GET /api/habits/:id/stats que devuelve estadísticas detalladas de un hábito individual. Incluye racha actual y récord, total de completitudes, tasas de cumplimiento global y últimos 30 días, datos diarios completos para gráficos con flag shouldComplete basado en periodicidad, y estadísticas específicas para hábitos NUMERIC (promedio, mínimo, máximo, valores históricos). La validación de ownership garantiza que solo el propietario pueda ver las estadísticas. Optimizado con queries eficientes que traen todos los records de una vez.

**Componentes:** apps/backend/src/services/stats.service.ts, apps/backend/src/controllers/habit.controller.ts, apps/backend/src/routes/habit.routes.ts

### US-037: Endpoint de Estadísticas Generales del Usuario

Implementación completa de endpoint GET /api/habits/stats que devuelve estadísticas generales del usuario autenticado. Incluye tasa de completitud del día actual, total de hábitos, hábito con la racha más larga, historial de los últimos 7 días para gráficos, y estadísticas agrupadas por categoría. El servicio considera la periodicidad de cada hábito (DAILY, WEEKLY, MONTHLY, CUSTOM) para calcular correctamente qué hábitos deben realizarse cada día. Optimizado para responder en <200ms incluso con 50+ hábitos mediante queries eficientes con includes y selects específicos.

**Componentes:** apps/backend/src/services/stats.service.ts, apps/backend/src/controllers/habit.controller.ts, apps/backend/src/routes/habit.routes.ts

### US-036: Cron Job para Auto-completar Hábitos Numéricos

Implementación completa de un cron job que se ejecuta diariamente a las 00:01 para auto-completar hábitos numéricos que alcanzaron su targetValue pero no fueron marcados como completados. El job busca registros del día anterior donde value >= targetValue y completed = false, los marca como completados, y recalcula las rachas correspondientes. Incluye logging detallado para auditoría y manejo robusto de errores. Se instaló la dependencia node-cron y se integró el scheduler en el servidor Express.

**Componentes:** apps/backend/src/jobs/auto-complete-habits.job.ts, apps/backend/src/index.ts, apps/backend/package.json

### US-034: Animaciones y Celebraciones al Completar Hábitos

Implementación completa de animaciones y celebraciones motivadoras al completar hábitos en la app móvil. Se creó CelebrationOverlay con confetti animado para rachas > 5 días y mensajes especiales para récords personales. HabitCheckbox ahora tiene animación de escala (1.0 → 1.3 → 1.0) y glow effect verde al marcar. HabitNumericInput dispara celebración cuando alcanza targetValue. Sistema inteligente detecta: (1) Completitud normal, (2) Racha > 5 días (confetti), (3) Récord personal (mensaje especial). Incluye prevención de celebraciones duplicadas mediante Set() que trackea hábitos ya celebrados por día. Animaciones usan useNativeDriver para 60fps. Los comentarios de haptic feedback están listos para implementar cuando se instale expo-haptics.

**Componentes:** apps/mobile/src/components/habits/CelebrationOverlay.tsx, apps/mobile/src/components/habits/HabitCheckbox.tsx, apps/mobile/src/components/habits/HabitNumericInput.tsx, apps/mobile/src/components/habits/HabitDailyCard.tsx, apps/mobile/src/screens/HabitosDiariosScreen.tsx

### US-033: Mejorar HabitosDiariosScreen con Marcado Interactivo

Implementación completa de la pantalla de hábitos diarios (HabitosDiariosScreen) con marcado interactivo para dispositivos móviles. La pantalla permite marcar hábitos CHECK con checkbox táctil animado y actualizar hábitos NUMERIC con controles incrementales (+/-), barra de progreso visual, y auto-completado. Incluye agrupación por momento del día (mañana/tarde/noche/todo el día), badges de racha (🔥 X días), pull-to-refresh, optimistic updates con TanStack Query, loading states, y manejo de errores con toast. Se crearon 3 nuevos componentes (HabitCheckbox, HabitNumericInput, HabitDailyCard) y se extendió el API client con endpoints de marcado (US-029, US-030, US-032).

**Componentes:** apps/mobile/src/screens/HabitosDiariosScreen.tsx, apps/mobile/src/components/habits/HabitCheckbox.tsx, apps/mobile/src/components/habits/HabitNumericInput.tsx, apps/mobile/src/components/habits/HabitDailyCard.tsx, apps/mobile/src/api/habits.api.ts

### US-032: Progreso Parcial para Hábitos Numéricos Acumulativos

Implementación de actualización de progreso incremental para hábitos NUMERIC. Permite a los usuarios actualizar el valor de un hábito numérico de forma incremental durante el día mediante incrementos positivos o negativos. El sistema valida que el valor no sea negativo, auto-completa el hábito cuando alcanza el targetValue, y actualiza la racha automáticamente. Endpoint: PUT /api/habits/:id/daily/:date/progress con body {increment: number}. La implementación es transaccional, reutiliza el modelo HabitRecord existente, y devuelve el estado actualizado con porcentaje de progreso.

**Componentes:** apps/backend/src/services/habitProgress.service.ts, apps/backend/src/controllers/habit.controller.ts, apps/backend/src/routes/habit.routes.ts, apps/backend/src/validations/habitProgress.validation.ts

### US-031: Algoritmo de Cálculo de Rachas (Streak Calculation Algorithm)

Implementación completa del algoritmo de cálculo de rachas automático para hábitos. El sistema ahora calcula y actualiza automáticamente currentStreak y longestStreak cuando un usuario marca un hábito como completado o no completado. El algoritmo considera la periodicidad del hábito (DAILY, WEEKLY, MONTHLY, CUSTOM) y maneja casos especiales como primera completitud, marcado retroactivo, y días consecutivos. La implementación es transaccional y se ejecuta automáticamente al crear/actualizar registros de hábitos mediante el endpoint existente POST/PUT /api/habits/:id/records.

**Componentes:** apps/backend/prisma/schema.prisma, apps/backend/src/services/streak.service.ts, apps/backend/src/services/habitRecord.service.ts

### Endpoint Retroactivo para Marcar H\u00e1bitos (US-030)

Implementaci\u00f3n de endpoint PUT /api/habits/:id/daily/:date para marcar h\u00e1bitos de fechas espec\u00edficas (retroactivo hasta 7 d\u00edas atr\u00e1s). Actualizada validaci\u00f3n en schema Zod para rechazar fechas >7 d\u00edas en pasado. Endpoint reutiliza l\u00f3gica existente de US-029 (upsert, validaci\u00f3n de periodicidad, ownership). Proporciona sem\u00e1ntica RESTful clara para marcar fechas espec\u00edficas vs crear records gen\u00e9ricos. Valida que fecha est\u00e9 en rango permitido (hoy - 7 d\u00edas a hoy), devuelve 400 si fuera de rango.

**Componentes:** apps/backend/src/validations/habitRecord.validation.ts, apps/backend/src/controllers/habit.controller.ts, apps/backend/src/routes/habit.routes.ts

### Endpoint Registro de Completitudes de H\u00e1bitos (US-029)

Implementaci\u00f3n completa de endpoint POST /api/habits/:id/records para registrar completitudes de h\u00e1bitos. Incluye: HabitRecordService con l\u00f3gica de negocio, validaci\u00f3n de periodicidad (DAILY/WEEKLY/MONTHLY/CUSTOM), upsert pattern idempotente, validaciones Zod, normalizaci\u00f3n de fechas, soporte para h\u00e1bitos CHECK y NUMERIC, validaci\u00f3n de targetValue, campo notes opcional. Endpoints adicionales GET para consultar historial por fecha espec\u00edfica o rango. Autenticaci\u00f3n requerida, validaci\u00f3n de ownership, manejo de errores 400/404.

**Componentes:** apps/backend/src/services/habitRecord.service.ts, apps/backend/src/controllers/habit.controller.ts, apps/backend/src/routes/habit.routes.ts, apps/backend/src/validations/habitRecord.validation.ts

### Eliminar H\u00e1bito con Toast de Deshacer (US-024)

Implementaci\u00f3n completa de funcionalidad de eliminaci\u00f3n de h\u00e1bitos con soft delete (isActive=false), confirmaci\u00f3n mediante Alert, Toast de \u00e9xito con bot\u00f3n 'Deshacer' durante 5 segundos, y soporte para swipe-to-delete en HabitCard. Backend ya implementaba soft delete. Frontend ahora incluye UX mejorada: Alert con mensaje espec\u00edfico, Toast con acci\u00f3n de deshacer, y reactivaci\u00f3n mediante updateHabit.

**Componentes:** apps/mobile/src/screens/HabitDetailScreen.tsx, apps/mobile/src/screens/HabitDetailScreenWrapper.tsx, apps/mobile/src/screens/HabitsListScreen.tsx, apps/mobile/src/components/habits/HabitCard.tsx, apps/mobile/src/components/common/Toast.tsx, apps/backend/src/services/habit.service.ts

### Formulario Mobile de Crear/Editar Hábitos (US-023)

Implementación completa de formulario mobile full-screen para creación y edición de hábitos con validación frontend, preview en tiempo real, y gestión de estados mediante TanStack Query. Incluye 13 campos configurables (nombre, descripción, categoría, tipo CHECK/NUMERIC, periodicidad DAILY/WEEKLY/MONTHLY/CUSTOM, días de la semana, momento del día, recordatorio, color) con validaciones específicas por tipo y preview visual.

**Componentes:** apps/mobile/src/screens/HabitFormScreen.tsx, apps/mobile/src/screens/HabitFormScreenWrapper.tsx, apps/mobile/src/api/habits.ts

### Pantalla de Lista de Hábitos Mobile (US-022)

Implementación completa de pantalla de lista de hábitos para mobile: HabitsListScreen con header "Mis Hábitos" + botón crear, búsqueda por nombre (instant search en cliente), filtros por categoría (category chips visuales con iconos), toggle "Mostrar inactivos", lista con HabitCard mostrando icono categoría/nombre/tipo badge/periodicidad/weekDays visuales/target value, swipe-to-delete con Alert confirmación + Toast con undo (5 seg), pull-to-refresh, empty states (sin hábitos / sin resultados filtros), loading state, integración completa con GET /api/habits usando TanStack Query, navegación a HabitDetail/HabitForm. HabitCard component reutilizable con diseño completo, borderLeft color categor

**Componentes:** apps/mobile/src/screens (HabitsListScreen, HabitsListScreenWrapper), apps/mobile/src/components/habits (HabitCard), apps/mobile/src/api (habits.api.ts), apps/mobile/App.tsx (navegación)

### Modelo de Hábitos y Endpoints CRUD Backend (US-021)

Implementación completa del backend CRUD de hábitos: modelo Prisma con enums (HabitType: CHECK/NUMERIC, Periodicity: DAILY/WEEKLY/MONTHLY/CUSTOM, TimeOfDay: MANANA/TARDE/NOCHE/ANYTIME), HabitService con lógica de negocio (findAll, findById, create, update, delete), HabitController con 5 endpoints REST protegidos (GET /api/habits, GET /api/habits/:id, POST /api/habits, PUT /api/habits/:id, DELETE /api/habits/:id), validaciones Zod con reglas de negocio (targetValue obligatorio para NUMERIC, weekDays obligatorio para WEEKLY), soft delete con isActive flag, include automático de category en respuestas, validación de ownership (usuario solo accede sus hábitos y categorías). Cliente Prisma generado con tipos TypeScript. Rutas integradas en /api/habits con authMiddleware.

**Componentes:** apps/backend/src/controllers (habit.controller.ts), apps/backend/src/services (habit.service.ts), apps/backend/src/routes (habit.routes.ts, index.ts), apps/backend/src/validations (habit.validation.ts), apps/backend/prisma (schema.prisma con Habit model)

### Validation Helpers for Habits (US-027)

Implementación de funciones helper de validación para hábitos en el package shared. Incluye: validateWeekDays (valida array de días 0-6, sin duplicados, max 7), validatePeriodicity (valida periodicidad con weekDays según reglas: DAILY permite vacío o específicos, WEEKLY/CUSTOM requieren al menos 1 día, MONTHLY debe estar vacío), validateNumericHabit (valida que hábitos NUMERIC tengan targetValue positivo y CHECK no lo tengan), y validateHabitConfig (validador integral que combina todas las reglas). Todas las funciones retornan ValidationResult {isValid, error?} para feedback consistente. Funciones puras sin dependencias externas, con JSDoc completo y ejemplos de uso.

**Componentes:** packages/shared/src/utils (nuevo: habit-validators.ts, index.ts), packages/shared/src/index.ts (export utils)

### Shared Package - Habit Types and Schemas (US-026)

Implementación completa de tipos TypeScript, enums, interfaces y schemas Zod para el dominio de Hábitos en el package shared. Incluye: enums (HabitType, Periodicity, TimeOfDay), interfaces (Habit, CreateHabitDTO, UpdateHabitDTO, HabitsFilters), schemas Zod con validaciones de negocio (createHabitSchema, updateHabitSchema, getHabitsQuerySchema), y constantes de UI (labels, iconos, weekdays) para uso consistente entre backend, mobile y web. Los schemas incluyen validaciones custom: hábitos numéricos requieren targetValue, periodicidades WEEKLY/CUSTOM requieren weekDays seleccionados. Exportado desde @horus/shared para consumo en todas las apps del monorepo.

**Componentes:** packages/shared/src/types (nuevo: habit.types.ts), packages/shared/src/schemas (nuevo: habit.schemas.ts), packages/shared/src/types/index.ts (export), packages/shared/src/schemas/index.ts (export)

### Pantalla de Detalle de Hábito Mobile (US-025)

Implementación completa de la pantalla de detalle de hábito para móvil. Incluye visualización de configuración completa del hábito (tipo, periodicidad, días, hora, recordatorio, color), sección de estadísticas rápidas (mock con valores en 0 para futura integración en US-042), navegación a edición y eliminación con confirmación. Se actualizó el flujo de navegación para que el tap en un hábito desde la lista ahora navegue al detalle en lugar de directamente al formulario de edición, mejorando la experiencia de usuario siguiendo patrones estándar de apps móviles.

**Componentes:** apps/mobile/src/screens (nuevos: HabitDetailScreen, HabitDetailScreenWrapper), apps/mobile/App.tsx (navegación), apps/mobile/src/screens/HabitsListScreenWrapper.tsx (navegación)

### Implementación US-024: Eliminar Hábito con Swipe-to-Delete

Implementación completa de eliminación de hábitos con swipe-to-delete gesture, confirmación con Alert nativo, soft delete (isActive=false), y Toast con acción Deshacer (5 segundos). Se actualizó HabitCard para soportar Swipeable de react-native-gesture-handler, se extendió Toast component para soportar action buttons, y se integró TanStack Query mutations para delete y reactivate.

**Componentes:** apps/mobile/src/components/habits/HabitCard.tsx, apps/mobile/src/components/common/Toast.tsx, apps/mobile/src/screens/HabitsListScreen.tsx, apps/mobile/src/api/habits.api.ts

### Implementación US-023: HabitFormScreen Mobile

Desarrollo completo del formulario de crear/editar hábitos para mobile con todos los campos de configuración: nombre, descripción, categoría, tipo (CHECK/NUMERIC), periodicidad (diario/semanal/mensual/custom), días de semana, momento del día, recordatorio, color personalizado. Incluye validaciones exhaustivas, preview en tiempo real, y navegación modal. Se crearon wrappers para separar lógica de navegación y mantener components testeables.

**Componentes:** apps/mobile/src/screens/HabitFormScreen.tsx, apps/mobile/src/screens/HabitFormScreenWrapper.tsx, apps/mobile/src/screens/HabitsListScreenWrapper.tsx, apps/mobile/App.tsx, apps/mobile/src/screens/HabitsListScreen.tsx

### Implementación US-022: HabitsListScreen Mobile

Desarrollo completo de la pantalla de lista de hábitos para mobile con búsqueda, filtros por categoría, toggle activo/inactivo, pull-to-refresh y estados vacíos. Se crearon 3 archivos nuevos: API client, componente HabitCard reutilizable, y screen principal con TanStack Query. Patrón arquitectónico replicado desde US-015 (CategoriesScreen) para mantener consistencia en el monorepo.

**Componentes:** apps/mobile/src/api/habits.api.ts, apps/mobile/src/components/habits/HabitCard.tsx, apps/mobile/src/screens/HabitsListScreen.tsx

### US-021: Modelo de Hábitos y API CRUD completa

Implementación completa de US-021 (Modelo de Hábitos y Endpoints CRUD Backend) que establece la base del sistema de tracking de hábitos. Creado modelo Habit en Prisma con 4 enums (HabitType, Periodicity, TimeOfDay, Scope), migración ejecutada, y API REST completa con 5 endpoints: GET /habits (listar), GET /habits/:id (detalle), POST /habits (crear), PUT /habits/:id (actualizar), DELETE /habits/:id (soft delete). Validaciones Zod con reglas condicionales (targetValue requerido si NUMERIC, weekDays requerido si WEEKLY). Service con verificación de ownership de categorías y usuarios. Todos los endpoints protegidos con authMiddleware. Incluye relación con Category y User, índices optimizados, y soft delete con isActive.

**Componentes:** apps/backend/prisma/schema.prisma, apps/backend/src/validations/habit.validation.ts, apps/backend/src/services/habit.service.ts, apps/backend/src/controllers/habit.controller.ts, apps/backend/src/routes/habit.routes.ts, apps/backend/src/routes/index.ts

### US-019: Seed automático de categorías default al registrarse

Implementación completa de US-019 (Seed de Categorías Default al Registrarse) que crea automáticamente 15 categorías predefinidas cuando un usuario se registra en la aplicación. Cambios realizados: (1) Actualización de category.service.ts para reflejar las 15 categorías exactas especificadas en US-019 (4 Hábitos, 3 Tareas, 3 Eventos, 5 Gastos) con íconos y colores correctos, (2) Integración del seed en auth.service.ts dentro de createUser(), (3) Try-catch para que errores en el seed no bloqueen el registro del usuario. La primera categoría de cada scope se marca automáticamente como default. El seed se ejecuta sincrónicamente después de crear el usuario, garantizando categorías disponibles desde el primer uso.

**Componentes:** apps/backend/src/services/category.service.ts, apps/backend/src/services/auth.service.ts

### US-018: Confirmación para cambio de categoría default

Implementación completa de US-018 (Marcar Categoría como Default) que agrega confirmación cuando ya existe una categoría default en el scope, y muestra Toast específico con el nombre y scope de la categoría marcada. La funcionalidad principal ya existía desde US-015, solo se agregaron mejoras de UX: (1) Alert de confirmación "¿Reemplazar '{nombre}' como default?" si hay default previo, (2) Toast detallado '"{nombre}" es ahora la categoría default de {scope}' con manejo de errores. Cambios realizados en CategoryBottomSheet (handleSetDefault) y CategoriesScreen (setDefaultMutation con onSuccess/onError, prop currentDefault).

**Componentes:** apps/mobile/src/components/categories/CategoryBottomSheet.tsx, apps/mobile/src/screens/CategoriesScreen.tsx

### Estructura Preparatoria Mobile para Gestión de Categorías

Creación de arquitectura completa para pantalla de categorías mobile (CategoriesScreen) con types compartidos, API service, componentes (CategoryCard, CategoryBottomSheet) y documentación exhaustiva. Código preparatorio listo para activarse cuando React Native/Expo se configure. Incluye instalación de @horus/shared en mobile y configuración de TypeScript paths.

**Componentes:** packages/shared/src/types/category.types.ts, apps/mobile/src/api/categories.api.ts, apps/mobile/src/components/categories/CategoryCard.tsx, apps/mobile/src/components/categories/CategoryBottomSheet.tsx, apps/mobile/src/screens/CategoriesScreen.tsx, apps/mobile/package.json, apps/mobile/tsconfig.json

### Sistema de Categorías con Enum Scope y Soft Delete

Implementaci\u00f3n completa del sistema de categor\u00edas CRUD para el backend de Horus. Incluye modelo Prisma con enum Scope (habitos, tareas, eventos, gastos), servicios, controladores, validaciones Zod, y rutas protegidas. Sistema de categor\u00eda por defecto (una por scope) y seed autom\u00e1tico de 12 categor\u00edas en registro de usuario. Patr\u00f3n soft delete implementado.

**Componentes:** apps/backend/prisma/schema.prisma, apps/backend/src/services/category.service.ts, apps/backend/src/controllers/category.controller.ts, apps/backend/src/routes/category.routes.ts, apps/backend/src/validations/category.validation.ts, apps/backend/src/controllers/auth.controller.ts

### Implementar CRUD completo de categor\u00edas

Implementaci\u00f3n completa del sistema de categor\u00edas backend con modelo Prisma, enum Scope (habitos, tareas, eventos, gastos), validaciones Zod, service layer con l\u00f3gica de negocio, controller con 6 endpoints CRUD, rutas protegidas con auth, soft delete, seteo de default, y seed autom\u00e1tico de 12 categor\u00edas por defecto al registrar usuario.

**Componentes:** backend-database, backend-api, backend-auth

### Implementar tests del error middleware

Implementaci\u00f3n de suite de tests completa para el error middleware usando Vitest. Incluye 10 tests cubriendo: errores de validaci\u00f3n Zod, errores de Prisma (P2002, P2025), errores HTTP personalizados (BadRequest, Unauthorized, NotFound, Conflict), y errores gen\u00e9ricos. Tambi\u00e9n se configur\u00f3 Vitest en el proyecto y se actualiz\u00f3 package.json con scripts de test.

**Componentes:** backend-testing, backend-middlewares

### Crear README con documentaci\u00f3n de variables de entorno

Creaci\u00f3n del README.md principal del proyecto con documentaci\u00f3n completa de la estructura del proyecto, requisitos, instalaci\u00f3n, y especialmente la configuraci\u00f3n de variables de entorno del backend. Incluye tabla de variables requeridas y opcionales, ejemplos y comandos para generar claves JWT seguras.

**Componentes:** documentation

### Implementar endpoint POST /api/auth/logout

Implementación del endpoint de logout que invalida el refresh token en la base de datos. Aunque la US lo marcaba como opcional, se implementó porque mejora significativamente la seguridad del sistema al prevenir el uso de tokens robados después del logout. El endpoint está protegido con authMiddleware y reutiliza updateRefreshToken(null) para invalidar.

**Componentes:** backend-auth, backend-routes

### Implementar endpoint GET /api/auth/me

Implementación del endpoint para obtener el usuario autenticado actual. El endpoint está protegido con authMiddleware y reutiliza el usuario cargado por el middleware para evitar queries duplicadas. Retorna los datos del usuario sin password ni refreshToken.

**Componentes:** backend-auth, backend-routes

### Implementar endpoint de refresh token

Implementación del flujo de renovación de tokens JWT. Incluye validación con Zod del refresh token, verificación contra la base de datos para asegurar que el token no haya sido rotado/invalidado, y generación de nuevos tokens (access y refresh) con rotating refresh token pattern para mayor seguridad.

**Componentes:** backend-auth, backend-routes, backend-validations

### Auth Middleware para Token Verification (US-008)

Implementaci\u00f3n del middleware authMiddleware que verifica tokens JWT en rutas protegidas. Lee token del header Authorization Bearer, verifica con JWT secret, carga usuario desde DB (sin password/refreshToken), y lo agrega a req.user. Retorna 401 si token ausente, inv\u00e1lido, expirado o usuario no existe.

**Componentes:** backend

### User Login Backend (US-007)

Implementaci\u00f3n del endpoint de login POST /api/auth/login. Valida credenciales de usuario existente, compara password con bcrypt, genera nuevos tokens JWT (access y refresh), y retorna datos del usuario sin password. Usa error 401 gen\u00e9rico para prevenir enumeraci\u00f3n de usuarios.

**Componentes:** backend

### User Registration Backend (US-006)

Implementaci\u00f3n completa del endpoint de registro de usuarios POST /api/auth/register. Incluye modelo User en Prisma, servicio de autenticaci\u00f3n con bcrypt y JWT, validaciones con Zod, middleware de manejo de errores global, y configuraci\u00f3n de variables de entorno. Se configur\u00f3 Express con estructura de carpetas profesional (controllers, services, routes, middlewares, validations).

**Componentes:** backend, database

### Documentaci\u00f3n de Arquitectura Inicial (US-005)

Implementaci\u00f3n completa de la documentaci\u00f3n de arquitectura del proyecto Horus. Se crearon dos archivos principales: ARQUITECTURA.md con la estructura del proyecto, decisiones tecnol\u00f3gicas, diagramas, convenciones de c\u00f3digo y flujo de trabajo Git; y CONTRIBUTING.md con la gu\u00eda de contribuci\u00f3n para nuevos desarrolladores incluyendo setup, est\u00e1ndares y proceso de PR.

**Componentes:** documentation

_Sección para documentar funcionalidades principales._

## Cambios Recientes

### ARCH-20251126-080115-301: Migración de @horus/shared de CommonJS a ESM

**Fecha:** 2025-11-26
**Tipo:** architectural

**Resumen:**
Se migró el paquete @horus/shared de CommonJS a ESM (ES Modules) para garantizar compatibilidad con Vite y bundlers modernos. Se actualizó package.json con "type: module" y exports field, y tsconfig.json para emitir módulos ESNext con moduleResolution: Bundler.

**Motivación:**
Durante la implementación de US-102, el build de Vite falló al intentar importar el enum Scope desde @horus/shared. El error indicaba que Vite no podía importar exports nombrados desde módulos CommonJS generados por TypeScript. Esta incompatibilidad bloqueaba completamente el build de producción de la aplicación web.

**Componentes Afectados:**

- packages/shared
- apps/web
- apps/backend

**Decisiones Técnicas:**

- **Usar moduleResolution: Bundler en tsconfig**
  - Justificación: Bundler es la opción recomendada para librerías que se consumen mediante bundlers modernos como Vite, esbuild, Rollup. Permite mejor tree-shaking y compatibilidad.
  - Trade-offs: Bundler es específico para uso con bundlers, no para ejecución directa con Node.js. Pero dado que @horus/shared solo se usa en contextos bundleados (web con Vite, backend con tsx), es la opción correcta.
- **Agregar exports field con tipos explícitos**
  - Justificación: El campo exports en package.json es el estándar moderno para declarar puntos de entrada. Especifica explícitamente types, import y require paths.
  - Trade-offs: Exports field requiere Node 12.7+, pero todos nuestros entornos lo soportan. Provee mejor control sobre qué se exporta del paquete.

**Nuevas Dependencias:**

---

### ARCH-20251123-013731-256: Modelos de gastos recurrentes y instancias mensuales

**Fecha:** 2025-11-23
**Tipo:** architectural

**Resumen:**
Implementación de modelos de base de datos para gestión de gastos recurrentes mensuales. Se agregaron dos nuevos modelos: RecurringExpense (plantilla de gasto recurrente) y MonthlyExpenseInstance (instancia mensual específica de un gasto). Se creó el enum ExpenseStatus con valores pendiente/pagado. RecurringExpense almacena la plantilla del gasto (concepto, categoría, moneda) sin monto específico. MonthlyExpenseInstance representa una instancia concreta para un mes/año determinado con monto real, estado de pago, cuenta utilizada (nullable hasta que se pague), fecha de pago, y notas. Se configuraron todas las relaciones necesarias con User, Category, y Account, y se agregaron índices para queries frecuentes.

**Motivación:**
Los usuarios necesitan gestionar gastos recurrentes mensuales (alquiler, servicios, suscripciones) de forma eficiente sin tener que crear manualmente la misma transacción cada mes. Se requiere un sistema que permita definir plantillas de gastos y generar automáticamente instancias mensuales que el usuario pueda editar, marcar como pagadas, y asociar a cuentas específicas.

**Componentes Afectados:**

- apps/backend/prisma

**Decisiones Técnicas:**

- **Separar plantilla (RecurringExpense) de instancias (MonthlyExpenseInstance)**
  - Justificación: Permite modificar plantilla sin afectar instancias ya generadas, mantener historial de montos anteriores, y tener flexibilidad para ajustar montos mes a mes
  - Trade-offs: Dos modelos pero mayor flexibilidad y claridad
- **MonthlyExpenseInstance almacena concept y categoryId propios**
  - Justificación: Permitir que el usuario modifique concepto o categoría de una instancia específica sin afectar la plantilla ni otras instancias
  - Trade-offs: Duplicación de datos pero flexibilidad total
- **previousAmount nullable para tracking de cambios**
  - Justificación: Permitir comparar monto actual con monto del mes anterior para detectar aumentos/disminuciones de servicios
  - Trade-offs: Campo adicional pero query más eficiente
- **accountId nullable hasta que se pague**
  - Justificación: El gasto puede estar pendiente sin cuenta asignada, solo al marcarlo como pagado se asocia a cuenta específica
  - Trade-offs: Null handling pero workflow más flexible
- **Unique constraint en recurringExpenseId + month + year**
  - Justificación: Prevenir duplicados: solo una instancia por gasto recurrente por mes
  - Trade-offs: Rigidez pero garantía de consistencia
- **Índice compuesto en userId + month + year + status**
  - Justificación: Query frecuente: obtener gastos pendientes o pagados de un mes específico para un usuario
  - Trade-offs: Índice más grande pero query optimizada
- **onDelete: Cascade para RecurringExpense**
  - Justificación: Al eliminar plantilla, eliminar automáticamente todas las instancias generadas (limpieza completa)
  - Trade-offs: Pérdida de historial pero limpieza automática
- **onDelete: SetNull para Account en MonthlyExpenseInstance**
  - Justificación: Si se elimina cuenta, no perder el registro de gasto, solo desvincular la cuenta
  - Trade-offs: Gastos huérfanos pero preservación de historial

**Nuevas Dependencias:**

---

### ARCH-20251121-123307-210: US-050: Modelo NotificationSetting para Recordatorios

**Fecha:** 2025-11-21
**Tipo:** architectural

**Resumen:**
Implementación del modelo NotificationSetting en Prisma para almacenar configuraciones de recordatorios por hábito. El modelo establece una relación 1:1 con Habit mediante constraint UNIQUE en habitId, almacena la hora del recordatorio en formato HH:mm, incluye flag enabled para activar/desactivar notificaciones, y tiene índice compuesto (userId, enabled) optimizado para cron jobs que consultan notificaciones habilitadas. Incluye relaciones ON DELETE CASCADE con Habit y User para mantener integridad referencial. El modelo sienta las bases para el sistema de notificaciones push del sistema.

**Motivación:**
Necesidad de almacenar configuración de recordatorios personalizada por hábito para implementar sistema de notificaciones push. Cada hábito puede tener un horario específico de recordatorio diferente al resto, y los usuarios deben poder habilitar/deshabilitar notificaciones individualmente. El modelo permite queries eficientes para cron jobs que envían notificaciones en batch.

**Componentes Afectados:**

- apps/backend/prisma/schema.prisma
- apps/backend/prisma/migrations/20250122_add_notification_settings/migration.sql
- Prisma Client (auto-generado)

**Decisiones Técnicas:**

- **Relación 1:1 con Habit mediante UNIQUE constraint en habitId**
  - Justificación: Un hábito solo debe tener una configuración de notificación. El UNIQUE constraint a nivel de DB previene duplicados y garantiza integridad. En Prisma se modela como NotificationSetting? (opcional) en Habit.
  - Trade-offs: Si en el futuro se necesitan múltiples horarios por hábito, requerirá refactoring, pero esto es improbable y la simplicidad actual es preferible.
- **Campo time como VARCHAR(5) para formato HH:mm**
  - Justificación: Formato string simple y legible (ej: '08:00', '20:30'). Fácil de validar con regex, portable entre zonas horarias (se interpreta como hora local), y suficiente para casos de uso actuales.
  - Trade-offs: Requiere validación en aplicación del formato HH:mm, pero la simplicidad y legibilidad lo justifican.
- **Campo enabled como Boolean con default true**
  - Justificación: Permite habilitar/deshabilitar notificaciones sin eliminar la configuración. Default true asume que si existe NotificationSetting, el usuario quiere notificaciones.
  - Trade-offs: Requiere query adicional para filtrar por enabled=true, pero el índice (userId, enabled) lo optimiza.
- **Índice compuesto en (userId, enabled)**
  - Justificación: Optimiza query principal del cron job: 'obtener todas las notificaciones habilitadas de un usuario'. El índice permite usar covering index scan para esta query frecuente.
  - Trade-offs: El índice consume espacio, pero el beneficio en performance para cron jobs justifica ampliamente el costo.
- **ON DELETE CASCADE para relaciones con Habit y User**
  - Justificación: Si se elimina un hábito o usuario, la configuración de notificaciones queda huérfana y sin utilidad. CASCADE elimina automáticamente estos registros manteniendo integridad.
  - Trade-offs: Si se elimina hábito accidentalmente, se pierde configuración de notificación, pero esto es consistente con soft delete pattern de Habit (isActive=false).
- **Incluir userId redundante además de habitId**
  - Justificación: Permite queries rápidas en cron jobs sin JOIN a tabla habits. La redundancia mejora performance drásticamente para consultas frecuentes del scheduler.
  - Trade-offs: Requiere mantener consistencia (userId debe coincidir con habit.userId), pero Prisma lo garantiza en creación.

**Nuevas Dependencias:**

---

### ARCH-20251121-114446-475: US-046: Modelo HabitAudit para Trazabilidad de Cambios

**Fecha:** 2025-11-21
**Tipo:** architectural

**Resumen:**
Implementación del modelo HabitAudit con enum ChangeType para registrar todos los cambios realizados a los hábitos (creación, actualización, eliminación, reactivación). El modelo incluye campos para tipo de cambio, campo modificado, valores anterior/nuevo en formato JSON, razón del cambio y timestamps. Se agregaron índices optimizados para consultas por habitId y userId. La implementación sigue el patrón de Audit Trail para mantener trazabilidad completa del ciclo de vida de los hábitos.

**Motivación:**
Necesidad de tener un registro histórico completo de todos los cambios realizados a los hábitos para auditoría, depuración y análisis de patrones de uso. Permite responder preguntas como: ¿Cuándo se modificó este hábito? ¿Qué valores tenía antes? ¿Quién realizó el cambio? ¿Por qué se eliminó/reactivó?

**Componentes Afectados:**

- apps/backend/prisma/schema.prisma
- apps/backend/prisma/migrations/20250121_add_habit_audit_model/migration.sql
- Prisma Client (auto-generado)

**Decisiones Técnicas:**

- **Usar enum ChangeType con valores CREATED, UPDATED, DELETED, REACTIVATED**
  - Justificación: Permite type-safety a nivel de TypeScript y PostgreSQL. Los valores están claramente definidos y no pueden ser arbitrarios. Facilita queries y filtros por tipo de cambio.
  - Trade-offs: Si en el futuro se necesitan nuevos tipos de cambio, se requiere una migración para agregar valores al enum. Sin embargo, esto es preferible a tener valores inconsistentes en la base de datos.
- **Almacenar oldValue y newValue como TEXT (JSON string) en lugar de JSONB**
  - Justificación: Flexibilidad máxima para almacenar cualquier tipo de dato sin necesidad de esquema fijo. Los valores se serializan como JSON strings antes de guardarse. Esto permite registrar cambios en campos de diferentes tipos (string, number, array, object) de forma uniforme.
  - Trade-offs: Queries sobre los valores almacenados requieren deserialización. Sin embargo, el caso de uso principal es consultar el historial completo de un hábito, no filtrar por valores específicos dentro del JSON.
- **Índice compuesto en (habitId, createdAt DESC)**
  - Justificación: Optimiza la consulta más común: obtener el historial de cambios de un hábito específico ordenado por fecha descendente. El índice permite usar covering index scan para esta query.
  - Trade-offs: El índice consume espacio adicional en disco, pero el beneficio en performance para la query principal justifica el costo.
- **ON DELETE CASCADE para relaciones con Habit y User**
  - Justificación: Si se elimina físicamente un hábito o usuario (caso excepcional), se eliminan automáticamente sus registros de auditoría. Esto mantiene la integridad referencial sin dejar registros huérfanos.
  - Trade-offs: Si se elimina físicamente un hábito, se pierde su historial de auditoría. Sin embargo, esto es consistente con el soft delete pattern usado en Habit (isActive=false), donde la eliminación física es excepcional.
- **Campo reason opcional (VARCHAR 500)**
  - Justificación: Permite registrar contexto adicional para cambios importantes como eliminaciones o reactivaciones. No es obligatorio para no sobrecargar el flujo de actualización automática, pero está disponible cuando se necesita.
  - Trade-offs: Al ser opcional, algunos registros pueden carecer de contexto. Sin embargo, esto permite flexibilidad en la implementación.

**Nuevas Dependencias:**

---

- **[2025-11-21]** US-045: Cacheo de Estadísticas con React Query

- **[2025-11-21]** US-044: Evaluación e Instalación de Victory Native para Gráficos

- **[2025-11-21]** US-035: Optimización de Queries para Cálculo de Rachas

### ARCH-20251121-000706-969: Modelo HabitRecord para Historial de Completitudes (US-028)

**Fecha:** 2025-11-21
**Tipo:** architectural

**Resumen:**
Creaci\u00f3n del modelo HabitRecord en Prisma para registrar historial completo de completitudes de h\u00e1bitos. Incluye campos: id, habitId, userId, date (DATE), completed (boolean), value (Float para NUMERIC), notes (VARCHAR 500). \u00cdndice \u00fanico compuesto (habitId, userId, date) previene duplicados. \u00cdndices adicionales en (userId, date) y (habitId, date) optimizan queries de dashboard y gr\u00e1ficos. Relaciones CASCADE con Habit y User. Migraci\u00f3n SQL generada. Prisma Client regenerado exitosamente.

**Motivación:**
Fundamentar sistema de rachas, estad\u00edsticas y progreso hist\u00f3rico. Sin este modelo es imposible calcular rachas actuales, r\u00e9cords, tasas de completitud, o generar gr\u00e1ficos de progreso temporal.

**Componentes Afectados:**

- apps/backend/prisma/schema.prisma
- apps/backend/prisma/migrations/20250121000000_add_habit_records/migration.sql
- @prisma/client (generated types)

**Decisiones Técnicas:**

- **Float para campo value (DOUBLE PRECISION)**
  - Justificación: Suficiente precisión para valores típicos de hábitos (peso, distancia, cantidad). Más performante que Decimal.
  - Trade-offs: Float: performance vs Decimal: máxima precisión. Para tracking de hábitos Float es suficiente.
- **Índice único compuesto (habitId, userId, date)**
  - Justificación: Previene duplicados críticos para integridad de rachas. Un hábito solo puede registrarse una vez por día.
  - Trade-offs: Requiere upsert pattern en application pero garantiza integridad de datos.
- **Índices en (userId, date) y (habitId, date)**
  - Justificación: Optimizan queries más comunes: dashboard diario por usuario, historial de hábito específico.
  - Trade-offs: Espacio vs velocidad. Con >10k records los índices dan 10-100x mejora.
- **ON DELETE CASCADE para ambas FKs**
  - Justificación: Eliminar usuario/hábito debe eliminar sus records automáticamente (integridad referencial).
  - Trade-offs: CASCADE simplifica cleanup pero elimina histórico. Soft delete de hábitos mitiga esto.
- **Campo date como DATE (no TIMESTAMP)**
  - Justificación: Hábitos se registran por día completo, no por hora específica. DATE reduce espacio y simplifica queries de rango.
  - Trade-offs: DATE: solo día vs TIMESTAMP: precisión temporal. Para hábitos DATE es semánticamente correcto.

**Nuevas Dependencias:**

---

### ARCH-20251120-164041-293: US-020: Shared package con schemas Zod para categorías

**Fecha:** 2025-11-20
**Tipo:** architectural

**Resumen:**
Implementación completa de US-020 (Shared Package - Category Types) que centraliza todos los tipos y schemas de validación de categorías en @horus/shared para reutilización entre backend, mobile y web. Cambios implementados: (1) Instalación de Zod en @horus/shared, (2) Creación de schemas/category.schemas.ts con scopeSchema, createCategorySchema, updateCategorySchema y getCategoriesQuerySchema usando Zod, (3) Migración de backend para usar schemas de shared eliminando duplicación completa en category.validation.ts, (4) Agregar @horus/shared como dependencia del backend. Mobile ya usaba shared types desde US-015. Resultado: eliminación total de duplicación de validaciones, garantizando consistencia entre todas las apps del monorepo.

**Motivación:**
Cumplir con US-020 y establecer patrón DRY (Don't Repeat Yourself) para validaciones compartidas, eliminando duplicación entre backend y frontend, y garantizando validaciones idénticas en todas las apps.

**Componentes Afectados:**

- packages/shared/src/schemas
- apps/backend/src/validations
- packages/shared/package.json
- apps/backend/package.json

**Decisiones Técnicas:**

- **Schemas Zod en shared con tipos inferidos**
  - Justificación: Zod permite definir schemas que sirven tanto para validación runtime como para inferencia de tipos TypeScript. Patrón estándar en monorepos modernos.
  - Trade-offs: Zod agrega ~20KB al bundle, pero es la librería más TypeScript-friendly y con mejor DX. Vale la pena el peso por type-safety + runtime validation.
- **Backend re-exporta desde shared en validation layer**
  - Justificación: Mantiene API interna del backend consistente (controllers siguen importando desde ./validations/) pero elimina duplicación
  - Trade-offs: Capa adicional de indirección, pero facilita refactoring futuro y mantiene arquitectura limpia.
- **Workspace protocol para dependencia shared**
  - Justificación: pnpm workspace:\* garantiza que siempre se use la versión local de shared, no una versión publicada en npm
  - Trade-offs: Requiere pnpm (no funciona con npm/yarn), pero es el estándar de facto para monorepos pnpm.

**Nuevas Dependencias:**

- zod v^4.1.12: Runtime validation con inferencia de tipos TypeScript

---

### ARCH-20251120-123349-326: Configuración completa de React Native con Expo

**Fecha:** 2025-11-20
**Tipo:** architectural

**Resumen:**
Configuración completa del proyecto mobile con React Native 0.82.1 y Expo 54.0.25. Se implementó la estructura completa de navegación con React Navigation 7.x, state management con TanStack Query 5.x, y sistema de gestos con React Native Gesture Handler y Reanimated. Esta configuración permite el desarrollo móvil multiplataforma (iOS/Android) con soporte completo para la arquitectura monorepo, hot reload, y acceso a packages compartidos (@horus/shared).

**Motivación:**
El proyecto requería una aplicación móvil nativa para complementar el backend existente. React Native con Expo fue seleccionado por: 1) Desarrollo multiplataforma con un solo código base, 2) Ecosistema maduro con amplio soporte de bibliotecas, 3) Expo proporciona tooling moderno y simplificado, 4) React Native Reanimated ofrece animaciones de alto rendimiento, 5) Compatibilidad con la arquitectura TypeScript del monorepo.

**Componentes Afectados:**

- apps/mobile
- @horus/shared
- monorepo-config

**Decisiones Técnicas:**

- **Usar Expo en lugar de React Native CLI**
  - Justificación: Expo proporciona mejor developer experience con configuración simplificada, hot reload superior, y acceso a APIs nativas sin necesidad de código nativo personalizado. Para MVP es ideal.
  - Trade-offs: Expo añade overhead de tamaño de bundle (~50MB base) pero elimina complejidad de configuración nativa. Para futuras necesidades de módulos nativos custom, se puede ejectar a bare workflow.
- **TanStack Query en lugar de Redux/MobX/Zustand**
  - Justificación: TanStack Query está especializado en server state (API calls), proporciona caching automático, sincronización background, y stale-while-revalidate. Reduce boilerplate comparado con Redux.
  - Trade-offs: Solo maneja server state, no client state global complejo. Para state local se usa useState/useReducer, lo cual es suficiente para US-015.
- **Metro bundler con workspaceRoot watching**
  - Justificación: Metro debe poder resolver @horus/shared desde packages/ en el monorepo. Configurar watchFolders al workspace root permite symlinks de pnpm.
  - Trade-offs: Metro es el bundler oficial de React Native y tiene mejor compatibilidad, aunque es más lento que alternativas modernas. Para producción, bundle size es optimizado automáticamente.
- **React Navigation 7.x en lugar de Expo Router**
  - Justificación: React Navigation es más maduro, con mejor soporte de TypeScript y más control sobre navegación. Expo Router (basado en file-routing) es más opinionado.
  - Trade-offs: React Navigation es más verboso (requiere definir Stack.Navigator explícitamente) pero ofrece más flexibilidad y tipado estricto con TypeScript.

**Nuevas Dependencias:**

- expo v^54.0.25: Framework y tooling para React Native
- react-native v^0.82.1: Framework móvil multiplataforma
- @react-navigation/native v^7.1.20: Sistema de navegación
- @react-navigation/native-stack v^7.6.3: Stack navigator nativo
- @react-navigation/material-top-tabs v^7.4.3: Tab navigator estilo Material
- @tanstack/react-query v^5.90.10: State management asíncrono y caching
- axios v^1.13.2: Cliente HTTP
- @gorhom/bottom-sheet v^5.2.6: Componente bottom sheet
- react-native-gesture-handler v^2.29.1: Sistema de gestos nativo
- react-native-reanimated v^4.1.5: Librería de animaciones

---

_Cambios arquitectónicos y de features documentados automáticamente._

## Componentes

_Listado de componentes del sistema._

## Dependencias

_Librerías y dependencias del proyecto._

## Decisiones de Diseño

_ADRs y decisiones arquitectónicas importantes._

---

_Documento mantenido automáticamente por Claude Code via MCP._
