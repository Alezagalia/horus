# US-002: Configuración de TypeScript

**Sprint:** 00 - Infrastructure and Foundation
**ID:** US-002
**Título:** Configuración de TypeScript

## Descripción

Como desarrollador del equipo, quiero tener TypeScript configurado en todos los packages para garantizar type safety y productividad desde el inicio del proyecto.

## Criterios de Aceptación

- [ ] TypeScript instalado como dev dependency en root (versión 5.6+)
- [ ] tsconfig.json base en root con configuraciones comunes
- [ ] tsconfig.json en backend extendiendo del base con target ES2022, moduleResolution Node16, outDir dist
- [ ] tsconfig.json en web extendiendo del base con configuración de React y JSX
- [ ] tsconfig.json en shared extendiendo del base con declaration true para generar .d.ts
- [ ] Script "type-check" funciona en cada package
- [ ] Compilación exitosa con tsc --noEmit en todos los packages
- [ ] VSCode o IDE reconoce tipos correctamente con autocomplete
- [ ] Configuración de paths alias funcionando (@/lib, @/components, etc.)

## Tareas Técnicas

- [ ] Instalar typescript en root - [0.5h]
- [ ] Crear tsconfig.json base - [1h]
- [ ] Crear tsconfig.json en backend - [0.5h]
- [ ] Crear tsconfig.json en web - [0.5h]
- [ ] Crear tsconfig.json en mobile - [0.5h]
- [ ] Crear tsconfig.json en shared - [0.5h]
- [ ] Configurar paths alias - [1h]
- [ ] Agregar scripts type-check - [0.5h]
- [ ] Verificar compilación - [0.5h]
- [ ] Documentar en README - [0.5h]

## Componentes Afectados

- **infrastructure:** tsconfig files
- **backend:** tsconfig.json, type checking
- **mobile:** tsconfig.json, type checking
- **web:** tsconfig.json, type checking
- **shared:** tsconfig.json, declaration files

## Dependencias

- US-001 (Monorepo debe estar configurado)

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
