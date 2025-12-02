# US-012: User Login (Backend + Mobile)

**Sprint:** 01 - Email/Password Authentication
**ID:** US-012
**Título:** User Login (Backend + Mobile)

## Descripción

Como usuario existente, quiero poder iniciar sesión con mi email y contraseña para acceder a mi cuenta y mis datos.

## Criterios de Aceptación

- [ ] Endpoint POST /api/auth/login creado
- [ ] Request body acepta: email, password
- [ ] Validar que usuario existe en BD
- [ ] Comparar password con bcrypt.compare
- [ ] Generar nuevos tokens si credenciales son correctas
- [ ] Response 200 con: user, accessToken, refreshToken
- [ ] Error 401 si credenciales son inválidas
- [ ] Pantalla de login en mobile con campos: email, password
- [ ] Checkbox "Recordarme" (opcional, usar refreshToken)
- [ ] Link a pantalla de registro
- [ ] Loading state durante request
- [ ] Navegación a Home screen después de login exitoso
- [ ] Tokens guardados en SecureStore

## Tareas Técnicas

- [ ] Implementar endpoint POST /api/auth/login - [2h]
- [ ] Validar credenciales con bcrypt - [1h]
- [ ] Generar tokens JWT - [0.5h]
- [ ] Manejo de errores (usuario no existe, password incorrecta) - [1h]
- [ ] Crear pantalla LoginScreen en mobile - [2h]
- [ ] Integrar con API en mobile - [1h]
- [ ] Guardar tokens en SecureStore - [0.5h]
- [ ] Implementar "Recordarme" - [1h]
- [ ] Tests unitarios del endpoint - [1.5h]
- [ ] Tests de componente LoginScreen - [1.5h]

## Componentes Afectados

- **backend:** AuthController, AuthService
- **mobile:** LoginScreen, AuthContext, API client

## Dependencias

- US-006 (User Registration debe estar completo)

## Prioridad

critical

## Esfuerzo Estimado

7 Story Points
