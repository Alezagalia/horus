# US-096: Layout Principal con Sidebar de Navegación

**Sprint:** 11 - Frontend Web Base
**ID:** US-096
**Título:** Layout Principal con Sidebar de Navegación

## Descripción

Como usuario web, quiero tener una barra de navegación lateral con acceso rápido a todas las secciones, para navegar fácilmente por la aplicación.

## Criterios de Aceptación

- [ ] Componente `MainLayout` creado:
  - Sidebar fijo a la izquierda (width: 240px en desktop, colapsable en tablet)
  - Content area a la derecha (flex-grow)
- [ ] Componente `Sidebar` creado con navegación:
  - Logo de Horus en la parte superior
  - Menu items:
    - 🏠 Dashboard (/)
    - ✅ Hábitos del Día (/habits/today)
    - 📋 Mis Hábitos (/habits)
    - 📝 Tareas (/tasks)
    - 🗂️ Categorías (/categories)
  - Información de usuario en la parte inferior:
    - Avatar o iniciales
    - Nombre del usuario
    - Email (pequeño, gris)
    - Botón "Cerrar sesión"
  - Item activo con highlight visual
  - Hover states en items
- [ ] Responsive:
  - Desktop (≥1024px): Sidebar siempre visible, 240px width
  - Tablet (768-1023px): Sidebar colapsable con botón hamburguesa
  - Mobile (<768px): No implementar en este sprint
- [ ] Botón hamburguesa (tablet):
  - Icono ☰ en esquina superior izquierda
  - Click: toggle sidebar (slide in/out con animación)
  - Overlay oscuro cuando sidebar abierto
- [ ] Navegación con React Router:
  - Usar `<NavLink>` para items de menu
  - ActiveClassName para highlight del item activo

## Tareas Técnicas

- [ ] Crear componente MainLayout - [1h]
- [ ] Crear componente Sidebar con menu items - [1.5h]
- [ ] Integrar React Router NavLink para navegación - [0.5h]
- [ ] Implementar lógica de collapse/expand para tablet - [1h]
- [ ] Agregar animaciones de transición - [0.5h]
- [ ] Estilos responsive con Tailwind - [1h]
- [ ] Integrar datos de usuario desde authStore - [0.5h]
- [ ] Implementar botón logout - [0.5h]
- [ ] Escribir tests - [1h]

## Componentes Afectados

- **web:** MainLayout, Sidebar, navigation components

## Dependencias

- US-095 (Sistema de autenticación)

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
