-- AlterEnum
ALTER TYPE "EstadoCanje" ADD VALUE 'RESERVADO_PENDIENTE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoDenuncia" ADD VALUE 'EN_VERIFICACION';
ALTER TYPE "EstadoDenuncia" ADD VALUE 'VERIFICADO_PENDIENTE';
ALTER TYPE "EstadoDenuncia" ADD VALUE 'EN_SANEAMIENTO';
ALTER TYPE "EstadoDenuncia" ADD VALUE 'RESUELTO_TECNICO';
ALTER TYPE "EstadoDenuncia" ADD VALUE 'CERRADO_INACCESIBLE';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'COLLABORATOR';

-- AlterTable
ALTER TABLE "canjes" ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "bloqueadoHasta" TIMESTAMP(3),
ADD COLUMN     "fechaEntrega" TIMESTAMP(3),
ADD COLUMN     "fechaExpiracion" TIMESTAMP(3),
ADD COLUMN     "sucursalId" TEXT;

-- AlterTable
ALTER TABLE "denuncias" ADD COLUMN     "fechaResolucion" TIMESTAMP(3),
ADD COLUMN     "fechaVerificacion" TIMESTAMP(3),
ADD COLUMN     "fotoSolucionUrl" TEXT,
ADD COLUMN     "fotoVerificacionUrl" TEXT,
ADD COLUMN     "informeSolucion" TEXT,
ADD COLUMN     "intentosInaccesible" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "observacionesAdmin" TEXT,
ADD COLUMN     "ocultarUsuario" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "puntosOtorgados" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "puntos" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "horario" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "municipioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canjes" ADD CONSTRAINT "canjes_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
