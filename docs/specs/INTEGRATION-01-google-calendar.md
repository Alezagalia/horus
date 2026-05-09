# SPEC-I01: Integración Google Calendar

**Tipo:** integration
**Estado:** draft
**Dependencias:** SPEC-01 (Auth), SPEC-05 (Eventos)

---

## Objetivo

Sincronizar eventos de Horus con Google Calendar de forma bidireccional: los eventos creados en Horus se reflejan en Google Calendar y viceversa, usando OAuth2 para autorización.

## Actores

- **Usuario autenticado**: conecta y desconecta su cuenta de Google Calendar.
- **Sistema (sync)**: sincroniza eventos periódicamente y maneja reintentos.

---

## Reglas de Negocio

1. El flujo de autorización usa OAuth2 con los scopes de Google Calendar API.
2. Los tokens (`accessToken`, `refreshToken`) se almacenan en `CalendarConnection`.
3. El `accessToken` expira; el sistema lo renueva automáticamente con el `refreshToken`.
4. Al sincronizar, se usa `syncCursor` (pageToken) para obtener solo los cambios incrementales.
5. Cada evento sincronizado almacena el `googleEventId` (único en el sistema).
6. Los errores de sincronización se registran en `syncLastError` y se gestionan reintentos con backoff exponencial (`syncRetryCount`, `syncNextRetryAt`).
7. El modelo `SyncSetting` también provee sincronización legacy (pre-`CalendarConnection`).
8. Un usuario solo puede tener una conexión activa de Google (`@@unique([userId, provider])`).

---

## Flujo de Autorización

```
1. GET /api/sync/google/auth-url  → genera URL de autorización OAuth2
2. Usuario autoriza en Google
3. Google redirige a /api/sync/google/callback?code=...
4. Backend intercambia code por tokens y guarda en CalendarConnection
5. Sincronización inicial de eventos existentes
```

---

## API Endpoints

**Base path:** `/api/sync`

| Método   | Path                 | Descripción                                     |
| -------- | -------------------- | ----------------------------------------------- |
| `GET`    | `/google/auth-url`   | Obtener URL de autorización OAuth2              |
| `GET`    | `/google/callback`   | Callback OAuth2, intercambia code por tokens    |
| `POST`   | `/google/sync`       | Forzar sincronización manual                    |
| `DELETE` | `/google/disconnect` | Desconectar cuenta de Google Calendar           |
| `GET`    | `/status`            | Estado de sincronización (última sync, errores) |

**Calendar Connections:** `/api/calendar-connections`

| Método   | Path   | Descripción                           |
| -------- | ------ | ------------------------------------- |
| `GET`    | `/`    | Listar conexiones activas del usuario |
| `DELETE` | `/:id` | Desconectar una conexión específica   |

---

## Criterios de Aceptación

- [ ] El callback OAuth2 guarda `accessToken` y `refreshToken` de forma segura.
- [ ] Los tokens expirados se renuevan automáticamente antes de cada sync.
- [ ] Los eventos creados en Horus aparecen en Google Calendar.
- [ ] Los eventos creados/modificados en Google Calendar se sincronizan a Horus.
- [ ] No se crean eventos duplicados (validación por `googleEventId`).
- [ ] Los errores de sync quedan registrados; los reintentos usan backoff exponencial.
- [ ] Desconectar la cuenta elimina la `CalendarConnection` y revoca los tokens.
