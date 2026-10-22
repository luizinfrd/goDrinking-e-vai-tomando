// popula o banco com o catálogo de drinks, vinhos e locais, o demo, o admin e uma comunidade fictícia
// idempotente: pode rodar várias vezes (bebidas e locais são atualizados pelo nome; usuários e avaliações só são criados)
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma';
import { colunasPercebidas } from '../src/domain/sabor';
import { preferenciaService } from '../src/services/preferenciaService';
import { BEBIDAS } from './seed/bebidas';
import { LOCAIS } from './seed/locais';
import { BebidaSeed } from './seed/tipos';
import { ADMIN, DEMO, gerarComunidade } from './seed/usuarios';

const DIA_MS = 24 * 60 * 60 * 1000;

async function upsertBebida(b: BebidaSeed) {
  const dados = {
    nome: b.nome,
    tipo: b.tipo,
    descricao: b.descricao,
    imagemUrl: b.imagem ?? null,
    atributoDoce: b.sabor.doce,
    atributoSeco: b.sabor.seco,
    atributoCitrico: b.sabor.citrico,
    atributoEncorpado: b.sabor.encorpado,
    harmonizaCom: b.harmonizaCom,
    ...(b.tipo === 'drink'
      ? { baseAlcoolica: b.baseAlcoolica, ingredientes: b.ingredientes }
      : { tipoVinho: b.tipoVinho, uva: b.uva, paisOrigem: b.paisOrigem }),
  };

  // a tabela não tem unique no nome, então a busca é feita antes
  const existente = await prisma.bebida.findFirst({ where: { nome: b.nome } });
  if (existente) {
    return prisma.bebida.update({ where: { id: existente.id }, data: dados });
  }
  return prisma.bebida.create({ data: dados });
}

// cria o usuário só se ainda não existir: rodar de novo não troca senha nem perfil
async function garantirUsuario(dados: { nome: string; email: string; senhaHash: string; papel?: string }) {
  return prisma.user.upsert({
    where: { email: dados.email },
    create: {
      nome: dados.nome,
      email: dados.email,
      senha: dados.senhaHash,
      papel: dados.papel ?? 'usuario',
      preferences: { create: {} },
    },
    update: {},
  });
}

async function main() {
  console.log('semeando bebidas...');
  const bebidaId = new Map<string, string>();
  for (const b of BEBIDAS) {
    const bebida = await upsertBebida(b);
    bebidaId.set(bebida.nome, bebida.id);
  }
  const idDaBebida = (nome: string) => {
    const id = bebidaId.get(nome);
    if (!id) throw new Error(`bebida "${nome}" não existe no seed`);
    return id;
  };

  console.log('semeando locais...');
  const localId = new Map<string, string>();
  const locaisPorBebida = new Map<string, string[]>();
  for (const { bebidas, imagem, ...campos } of LOCAIS) {
    const dados = { ...campos, imagemUrl: imagem ?? null };
    const existente = await prisma.local.findFirst({ where: { nome: dados.nome } });
    const local = existente
      ? await prisma.local.update({ where: { id: existente.id }, data: dados })
      : await prisma.local.create({ data: dados });
    localId.set(local.nome, local.id);

    for (const nomeBebida of bebidas) {
      const id = idDaBebida(nomeBebida);
      await prisma.bebidaLocal.upsert({
        where: { localId_bebidaId: { localId: local.id, bebidaId: id } },
        create: { localId: local.id, bebidaId: id },
        update: {},
      });
      locaisPorBebida.set(nomeBebida, [...(locaisPorBebida.get(nomeBebida) ?? []), local.nome]);
    }
  }

  console.log('criando usuários...');
  const senhaDemo = await bcrypt.hash(DEMO.senha, 10);
  const senhaAdmin = await bcrypt.hash(ADMIN.senha, 10);

  const demo = await garantirUsuario({ nome: DEMO.nome, email: DEMO.email, senhaHash: senhaDemo });
  await preferenciaService.salvarOnboarding(demo.id, DEMO.onboarding);
  for (const a of DEMO.avaliacoes) {
    const id = idDaBebida(a.bebida);
    await prisma.avaliacao.upsert({
      where: { userId_bebidaId: { userId: demo.id, bebidaId: id } },
      create: { userId: demo.id, bebidaId: id, nota: a.nota, comentario: a.comentario },
      update: {},
    });
  }
  for (const nome of DEMO.favoritos) {
    const id = bebidaId.get(nome);
    if (!id) continue;
    await prisma.favorito.upsert({
      where: { userId_bebidaId: { userId: demo.id, bebidaId: id } },
      create: { userId: demo.id, bebidaId: id },
      update: {},
    });
  }

  const admin = await garantirUsuario({ nome: ADMIN.nome, email: ADMIN.email, senhaHash: senhaAdmin, papel: 'admin' });
  await preferenciaService.salvarOnboarding(admin.id, ADMIN.onboarding);

  const comunidade = gerarComunidade(BEBIDAS, locaisPorBebida);
  const idsDaComunidade: string[] = [];
  for (const pessoa of comunidade) {
    const user = await garantirUsuario({ nome: pessoa.nome, email: pessoa.email, senhaHash: senhaDemo });
    idsDaComunidade.push(user.id);
    await preferenciaService.salvarOnboarding(user.id, pessoa.onboarding);
    for (const a of pessoa.avaliacoes) {
      const id = idDaBebida(a.bebida);
      await prisma.avaliacao.upsert({
        where: { userId_bebidaId: { userId: user.id, bebidaId: id } },
        create: {
          userId: user.id,
          bebidaId: id,
          nota: a.nota,
          comentario: a.comentario,
          localId: a.local ? localId.get(a.local) : null,
          data: new Date(Date.now() - a.diasAtras * DIA_MS),
          ...colunasPercebidas(a.percepcao),
        },
        update: {},
      });
    }
  }

  console.log('recalculando notas médias e paladares...');
  await preferenciaService.recalcularNotasMedias([...bebidaId.values()]);
  await preferenciaService.recalcularVarios([demo.id, admin.id, ...idsDaComunidade]);

  const drinks = BEBIDAS.filter((b) => b.tipo === 'drink').length;
  console.log(
    `seed concluído: ${drinks} drinks, ${BEBIDAS.length - drinks} vinhos, ${LOCAIS.length} locais, ` +
      `${comunidade.length} usuários da comunidade; demo ${DEMO.email} / ${DEMO.senha}; admin ${ADMIN.email} / ${ADMIN.senha}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
