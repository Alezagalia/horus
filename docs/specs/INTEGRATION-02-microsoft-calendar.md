# SPEC-I02: Integración Microsoft Calendar

**Tipo:** integration
**Estado:** draft
**Dependencias:** SPEC-01 (Auth), SPEC-05 (Eventos), SPEC-I01 (Google Calendar — arquitectura compartida)

---

## Objetivo

Sincronizar eventos de Horus con Microsoft Outlook Calendar usando el mismo modelo de `CalendarConnection` que la integración de Google, bajo el provider `MICROSOFT`.

## Actores

- **Usuario autenticado**: conecta y desconecta su cuenta de Microsoft.
- **Sistema (sync)**: sincroniza eventos con Microsoft Graph API.

---

## Reglas de Negocio

1. Usa el mismo modelo `CalendarConnection` que Google, con `provider = MICROSOFT`.
2. La autorización se realiza mediante OAuth2 con Microsoft Identity Platform (Azure AD).
3. Los scopes requeridos: `Calendars.ReadWrite`, `offline_access`.
4. El `syncCursor` almacena el `deltaToken` de Microsoft Graph para sincronización incremental.
5. Un usuario solo puede tener una conexión activa de Microsoft (`@@unique([userId, provider])`).
6. La lógica de reintentos y backoff es idéntica a Google Calendar.

---

## Flujo de Autorización

```
1. GET /api/calendar-connections/microsoft/auth-url → URL de autorización Microsoft
2. Usuario autoriza en Microsoft
3. Microsoft redirige a /api/calendar-connections/microsoft/callback?code=...
4. Backend intercambia code por tokens y guarda en CalendarConnection con provider=MICROSOFT
5. Sincronización inicial
```

---

## API Endpoints

**Base path:** `/api/calendar-connections`

| Método   | Path                  | Descripción                                     |
| -------- | --------------------- | ----------------------------------------------- |
| `GET`    | `/microsoft/auth-url` | Obtener URL de autorización OAuth2 Microsoft    |
| `GET`    | `/microsoft/callback` | Callback OAuth2                                 |
| `POST`   | `/microsoft/sync`     | Forzar sincronización manual                    |
| `GET`    | `/`                   | Listar todas las conexiones activas del usuario |
| `DELETE` | `/:id`                | Desconectar una conexión                        |

---

## Criterios de Aceptación

- [ ] El flujo OAuth2 de Microsoft retorna y almacena `accessToken` y `refreshToken`.
- [ ] Los eventos se sincronizan con Microsoft Graph API usando el endpoint de Calendar.
- [ ] El `deltaToken` se usa para sincronización incremental (no se re-descargan todos los eventos).
- [ ] Un usuario puede tener conectados Google y Microsoft simultáneamente.
- [ ] Desconectar la cuenta elimina la conexión y revoca el token en Microsoft.
