ALTER TABLE "productos"
ADD COLUMN "categoria" TEXT NOT NULL DEFAULT 'Otros';

UPDATE "productos"
SET "categoria" = CASE
  WHEN "titulo" ILIKE '%detergente%' OR "titulo" ILIKE '%limpieza%' THEN 'Limpieza'
  WHEN "titulo" ILIKE '%cuaderno%' OR "titulo" ILIKE '%papel%' THEN 'Papelería'
  WHEN "titulo" ILIKE '%cepillo%' OR "titulo" ILIKE '%gorra%' THEN 'Cuidado Personal'
  WHEN "titulo" ILIKE '%bolsa%' OR "titulo" ILIKE '%botella%' THEN 'Hogar'
  ELSE 'Otros'
END;
