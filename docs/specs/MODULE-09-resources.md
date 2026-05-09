# SPEC-09: Base de Conocimiento (Resources)

**Tipo:** module
**Estado:** draft
**Dominio:** gestión del conocimiento personal
**Dependencias:** SPEC-01 (Auth), SPEC-02 (Categorías)

---

## Objetivo

Proveer al usuario un repositorio personal de conocimiento donde puede guardar notas de texto libre (NOTE), fragmentos de código (SNIPPET) y bookmarks de URLs (BOOKMARK), organizados por categorías, tags, y con búsqueda semántica.

## Actores

- **Usuario autenticado**: crea, edita, busca y organiza sus recursos de conocimiento.

---

## Reglas de Negocio

1. Un recurso tiene tres tipos:
   - `NOTE`: contenido de texto libre o markdown.
   - `SNIPPET`: fragmento de código con lenguaje de programación asociado.
   - `BOOKMARK`: URL con título y descripción opcional.
2. Los recursos se organizan con categorías (`scope = knowledge`) y tags libres.
3. Un recurso puede marcarse como `isPinned` para aparecer primero en el listado.
4. El campo `metadata` es JSON libre para almacenar datos adicionales por tipo.
5. Los recursos admiten un `color` para identificación visual.
6. La búsqueda opera sobre título, descripción y contenido.
7. Los recursos usan soft delete (`isActive`).

---

## Modelo de Datos

```prisma
model Resource {
  id          String       @id @default(uuid())
  userId      String
  categoryId  String?
  type        ResourceType // NOTE | SNIPPET | BOOKMARK
  title       String
  description String?
  content     String?      // para NOTE y SNIPPET
  url         String?      // para BOOKMARK
  language    String?      // para SNIPPET (ej: "typescript", "python")
  metadata    Json?        // datos adicionales libres
  tags        String[]
  isPinned    Boolean      @default(false)
  color       String?
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user        User         @relation(...)
  category    Category?    @relation(...)
}

enum ResourceType { NOTE SNIPPET BOOKMARK }
```

---

## API Endpoints

**Base path:** `/api/resources`

| Método   | Path       | Descripción                                           |
| -------- | ---------- | ----------------------------------------------------- |
| `GET`    | `/`        | Listar recursos (filtrable por tipo, categoría, tags) |
| `GET`    | `/search`  | Búsqueda full-text en título, descripción y contenido |
| `GET`    | `/tags`    | Listar todos los tags únicos del usuario              |
| `GET`    | `/stats`   | Estadísticas: total por tipo, más usados              |
| `GET`    | `/:id`     | Obtener recurso por ID                                |
| `POST`   | `/`        | Crear nuevo recurso                                   |
| `PUT`    | `/:id`     | Actualizar recurso                                    |
| `PATCH`  | `/:id/pin` | Alternar estado de pin (isPinned)                     |
| `DELETE` | `/:id`     | Soft delete del recurso                               |

---

## Criterios de Aceptación

- [ ] Un `BOOKMARK` requiere `url` válida.
- [ ] Un `SNIPPET` debe incluir `language`.
- [ ] Los recursos pinneados aparecen primero en el listado.
- [ ] La búsqueda en `/search` opera sobre título, descripción y contenido.
- [ ] `/tags` retorna tags únicos del usuario sin duplicados.
- [ ] Un usuario no puede ver o modificar recursos de otro usuario.
- [ ] El filtro por tipo en el listado es opcional.
