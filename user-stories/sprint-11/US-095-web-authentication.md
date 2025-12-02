# US-095: Sistema de Autenticación Web (Login, Registro, Protección de Rutas)

**Sprint:** 11 - Frontend Web Base
**ID:** US-095
**Título:** Sistema de Autenticación Web (Login, Registro, Protección de Rutas)

## Descripción

Como usuario web, quiero poder registrarme, iniciar sesión y tener mis sesiones protegidas, para acceder de forma segura a mi cuenta desde el navegador.

## Criterios de Aceptación

- [ ] Página `LoginPage` (`/login`) implementada:
  - Formulario con email y password
  - Validación con React Hook Form + Zod
  - Botón "Iniciar sesión"
  - Link a "Crear cuenta" (registro)
  - Loading state durante login
  - Mensajes de error claros
- [ ] Página `RegisterPage` (`/register`) implementada:
  - Formulario con nombre, email, password, confirmar password
  - Validación: email válido, password min 8 caracteres, passwords coinciden
  - Botón "Crear cuenta"
  - Link a "Ya tengo cuenta" (login)
  - Loading state durante registro
  - Mensajes de error
- [ ] Zustand store `useAuthStore` creado:
  - State: `user`, `accessToken`, `isAuthenticated`, `isLoading`
  - Actions: `login()`, `register()`, `logout()`, `checkAuth()`, `refreshToken()`
- [ ] Service `authService` creado:
  - `login(email, password)` - POST /api/auth/login
  - `register(name, email, password)` - POST /api/auth/register
  - `getMe()` - GET /api/auth/me
  - `refreshAccessToken()` - POST /api/auth/refresh
- [ ] Tokens almacenados en localStorage
- [ ] Interceptor de Axios configurado:
  - Agregar `Authorization: Bearer {token}` a todas las requests
  - Si 401 Unauthorized: intentar refresh token automáticamente
  - Si refresh falla: logout y redirect a /login
- [ ] Protección de rutas con `ProtectedRoute` component
- [ ] Persistencia de sesión al recargar página
- [ ] Logout funcional

## Tareas Técnicas

- [ ] Crear Zustand store `useAuthStore` - [1.5h]
- [ ] Crear service `authService` con endpoints - [1h]
- [ ] Configurar Axios con interceptors (tokens, refresh) - [1.5h]
- [ ] Crear componente `ProtectedRoute` - [0.5h]
- [ ] Implementar `LoginPage` con formulario - [1.5h]
- [ ] Implementar `RegisterPage` con formulario - [1.5h]
- [ ] Integrar React Hook Form + Zod validation - [1h]
- [ ] Implementar persistencia y checkAuth en app load - [1h]
- [ ] Escribir tests de componentes - [1.5h]

## Componentes Afectados

- **web:** LoginPage, RegisterPage, authStore, authService, ProtectedRoute

## Dependencias

- US-094 (Setup del proyecto)
- Backend auth endpoints (Sprint 1, 2)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
