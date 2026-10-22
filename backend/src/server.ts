// env primeiro: valida a configuração antes de montar qualquer coisa
import { env } from './config/env';
import { criarApp } from './app';
import { prisma } from './lib/prisma';

const servidor = criarApp().listen(env.PORT, () => {
  console.log(`servidor rodando na porta ${env.PORT}`);
});

// encerramento gracioso: termina as requisições em andamento e fecha as conexões com o banco
function encerrar(sinal: string) {
  console.log(`${sinal} recebido, encerrando...`);
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));
