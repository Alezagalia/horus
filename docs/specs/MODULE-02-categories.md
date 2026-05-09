# SPEC-02: Categorías

**Tipo:** module
**Estado:** draft
**Dominio:** transversal
**Dependencias:** SPEC-01 (Auth)

---

## Objetivo

Proveer un sistema de clasificación polimórfico que permita al usuario organizar sus hábitos, tareas, eventos, gastos y recursos bajo categorías propias con nombre, ícono y color.

## Actores

- **Usuario autenticado**: crea, edita, elimina y consulta sus propias categorías.

---

## Reglas de Negocio

1. Una categoría pertenece a un único usuario (no son globales/compartidas).
2. El nombre de categoría debe ser único por usuario + scope.
3. El campo `scope` determina en qué módulo aplica la categoría:
   - `habitos` → Hábitos
   - `tareas` → Tareas
   - `eventos` → Eventos
   - `gastos` → Finanzas / Gastos
   - `knowledge` → Base de conocimiento
4. Una categoría puede marcarse como `isDefault`; solo puede haber una por scope por usuario.
5. No se puede eliminar una categoría que tenga registros asociados (ON DELETE RESTRICT).
6. Las categorías usan soft delete (`isActive`).

---

## Modelo de Datos

```prisma
model Category {
  id        String   @id @default(uuid())
  userId    String
  name      String
  scope     Scope    // habitos | tareas | eventos | gastos | knowledge
  icon      String?
  color     String?
  isDefault Boolean  @default(false)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name, scope])
}

enum Scope {
  habitos
  tareas
  eventos
  gastos
  knowledge
}
```

---

## API Endpoints

**Base path:** `/api/categories`

| Método   | Path               | Descripción                               |
| -------- | ------------------ | ----------------------------------------- |
| `GET`    | `/`                | Listar categorías (filtrable por `scope`) |
| `GET`    | `/:id`             | Obtener categoría por ID                  |
| `POST`   | `/`                | Crear nueva categoría                     |
| `PUT`    | `/:id`             | Actualizar categoría                      |
| `PUT`    | `/:id/set-default` | Marcar como predeterminada                |
| `DELETE` | `/:id`             | Soft delete de categoría                  |

### GET /

**Query params:** `?scope=habitos` (opcional)
**Response 200:**

```json
[{ "id", "name", "scope", "icon", "color", "isDefault" }]
```

### POST /

**Body:**

```json
{
  "name": "string",
  "scope": "habitos|tareas|eventos|gastos|knowledge",
  "icon": "string?",
  "color": "string?"
}
```

---

## Criterios de Aceptación

- [ ] No se pueden crear dos categorías con el mismo nombre y scope para el mismo usuario.
- [ ] Al marcar una categoría como default, la anterior default del mismo scope se desmarca.
- [ ] Eliminar una categoría con registros activos retorna error 409.
- [ ] El listado filtra por `isActive = true` por defecto.
- [ ] Un usuario no puede ver/modificar categorías de otro usuario.
