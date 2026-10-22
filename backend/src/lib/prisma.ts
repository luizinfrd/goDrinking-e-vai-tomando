// instância única do prisma client compartilhada por todos os repositórios
import { Prisma, PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// aceita tanto o client quanto o client de uma transação, para os repositórios participarem dela
export type Db = Prisma.TransactionClient;
