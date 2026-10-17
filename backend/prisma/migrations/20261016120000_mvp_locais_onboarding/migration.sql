-- AlterTable
ALTER TABLE "bebidas" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "imagemUrl" TEXT;

-- AlterTable
ALTER TABLE "locais" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "imagemUrl" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "tipo" TEXT;

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "baseCitrico" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "baseDoce" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "baseEncorpado" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "baseSeco" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "onboardingConcluido" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_userId_bebidaId_key" ON "avaliacoes"("userId", "bebidaId");
