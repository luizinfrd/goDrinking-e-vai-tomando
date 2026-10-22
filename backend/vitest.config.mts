import { defineConfig } from 'vitest/config';

// os testes de integração usam um schema separado ("test") no mesmo postgres do docker compose
const DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://godrinking:godrinking@localhost:5432/godrinking?schema=test';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./test/globalSetup.ts'],
    env: { DATABASE_URL, JWT_SECRET: 'segredo-de-teste', NODE_ENV: 'test' },
    // os arquivos de integração compartilham o banco
    fileParallelism: false,
    hookTimeout: 60_000,
  },
});
