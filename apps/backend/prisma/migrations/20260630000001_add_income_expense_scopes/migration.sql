-- Separar categorías de dinero en ingresos / egresos (parte 1 de 2).
-- Agrega los valores 'ingresos' y 'egresos' al enum "Scope".
--
-- IMPORTANTE: estos ADD VALUE van en una migración PROPIA, separada del UPDATE que
-- los usa (migración 20260630000002). PostgreSQL no permite usar un valor de enum
-- recién agregado dentro de la misma transacción en que se lo agrega (PG 12+ permite
-- agregarlo en una transacción, pero no usarlo hasta que commitee).

-- AlterEnum
ALTER TYPE "Scope" ADD VALUE IF NOT EXISTS 'ingresos';
ALTER TYPE "Scope" ADD VALUE IF NOT EXISTS 'egresos';
