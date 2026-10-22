-- funcionalidades v2 (todas as mudanças são aditivas: nada existente é alterado ou removido)
-- percepção dos atributos e diário na avaliação, favoritos, harmonização, faixa de preço,
-- papel de admin, autor das bebidas da comunidade e índices das FKs mais consultadas

-- AlterTable
ALTER TABLE "avaliacoes" ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "localId" TEXT,
ADD COLUMN     "percebidoCitrico" DOUBLE PRECISION,
ADD COLUMN     "percebidoDoce" DOUBLE PRECISION,
ADD COLUMN     "percebidoEncorpado" DOUBLE PRECISION,
ADD COLUMN     "percebidoSeco" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "bebidas" ADD COLUMN     "criadoPorId" TEXT,
ADD COLUMN     "harmonizaCom" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "locais" ADD COLUMN     "faixaPreco" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "papel" TEXT NOT NULL DEFAULT 'usuario';

-- CreateTable
CREATE TABLE "favoritos" (
    "userId" TEXT NOT NULL,
    "bebidaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("userId","bebidaId")
);

-- CreateIndex
CREATE INDEX "avaliacoes_bebidaId_idx" ON "avaliacoes"("bebidaId");

-- CreateIndex
CREATE INDEX "bebidas_locais_bebidaId_idx" ON "bebidas_locais"("bebidaId");

-- AddForeignKey
ALTER TABLE "bebidas" ADD CONSTRAINT "bebidas_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_bebidaId_fkey" FOREIGN KEY ("bebidaId") REFERENCES "bebidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- integridade que o prisma não modela
ALTER TABLE "users" ADD CONSTRAINT "users_papel_check" CHECK ("papel" IN ('usuario', 'admin'));
ALTER TABLE "locais" ADD CONSTRAINT "locais_faixaPreco_check" CHECK ("faixaPreco" BETWEEN 1 AND 4);
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_percebido_check" CHECK (
  ("percebidoDoce" IS NULL OR "percebidoDoce" BETWEEN 0 AND 1) AND
  ("percebidoSeco" IS NULL OR "percebidoSeco" BETWEEN 0 AND 1) AND
  ("percebidoCitrico" IS NULL OR "percebidoCitrico" BETWEEN 0 AND 1) AND
  ("percebidoEncorpado" IS NULL OR "percebidoEncorpado" BETWEEN 0 AND 1)
);
