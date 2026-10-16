// instância única do prisma client compartilhada por todos os services
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
