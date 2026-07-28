-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "userId" TEXT NOT NULL,
    "pesoDoce" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pesoSeco" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pesoCitrico" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pesoEncorpado" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "bebidas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "atributoDoce" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atributoSeco" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atributoCitrico" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atributoEncorpado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notaMedia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criadoUser" BOOLEAN NOT NULL DEFAULT false,
    "tipoVinho" TEXT,
    "uva" TEXT,
    "paisOrigem" TEXT,
    "ingredientes" TEXT,
    "baseAlcoolica" TEXT,

    CONSTRAINT "bebidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bebidaId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,

    CONSTRAINT "locais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bebidas_locais" (
    "localId" TEXT NOT NULL,
    "bebidaId" TEXT NOT NULL,

    CONSTRAINT "bebidas_locais_pkey" PRIMARY KEY ("localId","bebidaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_bebidaId_fkey" FOREIGN KEY ("bebidaId") REFERENCES "bebidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bebidas_locais" ADD CONSTRAINT "bebidas_locais_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bebidas_locais" ADD CONSTRAINT "bebidas_locais_bebidaId_fkey" FOREIGN KEY ("bebidaId") REFERENCES "bebidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
