// recria o schema de teste com as migrations antes da suíte
import { execSync } from 'node:child_process';

export default function setup() {
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://godrinking:godrinking@localhost:5432/godrinking?schema=test' },
  });
}
