ALTER TABLE "usuarios"
ADD COLUMN "latitudActual" DOUBLE PRECISION,
ADD COLUMN "longitudActual" DOUBLE PRECISION,
ADD COLUMN "ubicacionActualizadaEn" TIMESTAMP(3);

ALTER TABLE "usuarios"
ADD CONSTRAINT "usuarios_current_location_pair_check"
CHECK (
  ("latitudActual" IS NULL) = ("longitudActual" IS NULL)
  AND ("latitudActual" IS NULL) = ("ubicacionActualizadaEn" IS NULL)
  AND ("latitudActual" IS NULL OR "latitudActual" BETWEEN -90 AND 90)
  AND ("longitudActual" IS NULL OR "longitudActual" BETWEEN -180 AND 180)
);

UPDATE "usuarios"
SET "disponible" = false
WHERE "rol" = 'AGENT';
