# US-011: Logout

**Sprint:** 01 - Email/Password Authentication
**ID:** US-011
**Título:** Logout

## Descripción

Como usuario, quiero poder cerrar sesión para que mis datos no estén accesibles desde el dispositivo.

## Criterios de Aceptación

- [ ] Endpoint POST /api/auth/logout creado (opcional, puede ser solo frontend)
- [ ] Endpoint opcional: invalidar refreshToken en BD
- [ ] Botón de logout en Settings screen de mobile
- [ ] Limpiar tokens de SecureStore
- [ ] Limpiar AuthContext (user = null)
- [ ] Navegar a LoginScreen
- [ ] Confirmación opcional: "¿Cerrar sesión?"

## Tareas Técnicas

- [ ] Implementar endpoint POST /api/auth/logout (opcional) - [1h]
- [ ] Agregar botón Logout en Settings screen - [1h]
- [ ] Limpiar tokens de SecureStore - [0.5h]
- [ ] Limpiar AuthContext - [0.5h]
- [ ] Navegación a LoginScreen - [0.5h]
- [ ] Tests del logout - [1h]

## Componentes Afectados

- **backend:** AuthController (opcional)
- **mobile:** SettingsScreen, AuthContext, SecureStore

## Dependencias

- US-007 (Login) y US-010 (Get Current User)

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
