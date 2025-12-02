# US-116: Página de Gestión de Categorías (Web)

**Sprint:** 13 - Frontend Web Completo
**ID:** US-116
**Título:** Página de Gestión de Categorías (Web)
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero gestionar mis categorías desde el navegador, para organizar mis hábitos, tareas y gastos sin usar la app móvil.

## Razón

Las categorías son esenciales para organizar y filtrar contenido en todas las funcionalidades. Los usuarios web deben poder crear y gestionar sus propias categorías.

## Criterios de Aceptación

### 1. Página CategoriesPage

- [ ] Accesible desde `/categories`
- [ ] Header: "Categorías" con descripción
- [ ] Tres tabs para filtrar por scope:
  - Tab "Hábitos" (scope: 'habitos')
  - Tab "Tareas" (scope: 'tareas')
  - Tab "Gastos" (scope: 'gastos')
  - Default: tab según query param o "Hábitos"

### 2. Lista de Categorías

- [ ] Mostrar:
  - Icono (emoji)
  - Nombre
  - Color (badge o background)
  - Contador de items asociados
  - Fecha de creación
  - Acciones: Editar, Eliminar
- [ ] Responsive: 3 col desktop, 2 col tablet, 1 col mobile

### 3. Botón "Nueva Categoría"

- [ ] En header
- [ ] Abre modal de crear categoría

### 4. Modal de Crear/Editar Categoría

- [ ] Campo nombre (text input, max 50 caracteres)
- [ ] Selector de icono (emoji picker o grid)
- [ ] Selector de color (paleta de 12 colores)
- [ ] Selector de scope (solo en creación)
- [ ] Botones: "Cancelar", "Guardar"

### 5. Confirmación de Eliminación

- [ ] Dialog: "¿Eliminar '{nombre}'? Esto NO eliminará los items asociados."
- [ ] Validar que no se pueda eliminar si tiene items asociados

### 6. Integración con Endpoints

- [ ] GET /api/categories?scope={scope}
- [ ] POST /api/categories
- [ ] PUT /api/categories/:id
- [ ] DELETE /api/categories/:id

### 7. Estados

- [ ] Loading: skeleton de lista
- [ ] Empty state: "No tienes categorías de {scope}"
- [ ] Error state: mensaje + "Reintentar"

### 8. Validaciones

- [ ] Nombre no vacío
- [ ] Nombre único por scope
- [ ] Color seleccionado
- [ ] Icono seleccionado

### 9. Actualizar Layout

- [ ] Mover "Categorías" de "Próximamente" a "Productividad"
- [ ] Activar link `/categories`

## Tareas Técnicas

- [ ] Crear página CategoriesPage.tsx - [2h]
- [ ] Crear componente CategoryCard - [1.5h]
- [ ] Crear componente CategoryFormModal - [3h]
- [ ] Implementar tabs de scope con React Query - [1h]
- [ ] Crear EmojiPicker component - [2h]
- [ ] Crear ColorPicker component - [1h]
- [ ] Integrar con API - [2h]
- [ ] Implementar confirmación de eliminación - [1h]
- [ ] Styling - [2h]
- [ ] Tests de componentes - [3h]
- [ ] Actualizar Layout.tsx - [0.5h]

## Componentes Afectados

- **web:** CategoriesPage, CategoryCard, CategoryFormModal, EmojiPicker, ColorPicker

## Dependencias

- Sprint 2 completado (endpoints de categorías en backend)
- TanStack Query configurado (Sprint 11)

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
