-- Separar categorías de dinero en ingresos / egresos (parte 2 de 2).
-- Las categorías de dinero existentes (scope 'gastos') eran todas de egreso, así que
-- se migran a 'egresos'. Las categorías de ingreso se crean nuevas desde la app y
-- vía createDefaultCategories para usuarios nuevos.
--
-- El valor 'gastos' se conserva en el enum por compatibilidad con datos históricos,
-- pero deja de usarse en la app (ver enum Scope @deprecated en shared).
--
-- Nota: las transacciones de tipo 'ingreso' que hoy apuntan a una categoría 'gastos'
-- pasarán a apuntar a una categoría 'egresos'. La FK sigue siendo válida y la lectura
-- no se rompe; solo al EDITAR esa transacción de ingreso habrá que reelegir una
-- categoría de 'ingresos' (la validación de scope por tipo corre en create/update).

UPDATE "categories" SET "scope" = 'egresos' WHERE "scope" = 'gastos';
