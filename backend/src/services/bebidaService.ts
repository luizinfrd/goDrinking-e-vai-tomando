import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { erros } from '../utils/erros';

export { isErroDeValidacao } from '../utils/erros';

export type DadosBebida = {
    nome?: string;
    tipo?: string;
    descricao?: string | null;
    imagemUrl?: string | null;
    atributoDoce?: number;
    atributoSeco?: number;
    atributoCitrico?: number;
    atributoEncorpado?: number;
    criadoUser?: boolean;

    tipoVinho?: string | null;
    uva?: string | null;
    paisOrigem?: string | null;

    ingredientes?: string | null;
    baseAlcoolica?: string | null;
};

export const bebidaService = {
    async listar(tipo?: string, nome?: string){
        return prisma.bebida.findMany({
            where: {
                ...(tipo && { tipo: { equals: tipo.toLowerCase(), mode: 'insensitive'}}),
                // busca parcial: "negr" encontra "Negroni"
                ...(nome && { nome: { contains: nome, mode: 'insensitive'}}),
            },

            include: { _count: { select: { avaliacoes: true } } },
            orderBy: [{notaMedia: 'desc'}, {nome: 'asc'}],
        });
    },

    async buscarPorId(id: string) {
        const bebida = await prisma.bebida.findUnique({
            where: { id },
            include: {
                avaliacoes: {
                    orderBy: { data: 'desc'},
                    take: 10, //limita os resultados em 10 registros
                    include: { user: { select: { id: true, nome: true } } },
                },
                locais: {
                    include: { local: true },
                },
                _count: { select: { avaliacoes: true } },
            },
        });

        if (!bebida) {
            throw erros.naoEncontrado('Bebida não encontrada');
        }

        return bebida;
    },

    async criar(dados: DadosBebida & { nome: string; tipo: string }) {
        const tipo = dados.tipo.toLowerCase();

        if (tipo !== 'vinho' && tipo !== 'drink'){
            throw erros.validacao('Tipo deve ser "vinho" ou "drink"');
        }

        if (tipo === 'vinho' && !dados.tipoVinho){
            throw erros.validacao('Campo tipoVinho é obrigatório para vinhos');
        }

        if (tipo === 'drink' && !dados.baseAlcoolica){
            throw erros.validacao('Campo baseAlcoolica é obrigatório para drinks');
        }

        return prisma.bebida.create({ data: { ...dados, tipo } as Prisma.BebidaCreateInput });
    },

    async atualizar(id:  string, dados: DadosBebida) {
        const bebida = await prisma.bebida.findUnique({ where: { id } });

        if(!bebida) {
            throw erros.naoEncontrado('Bebida não encontrada');
        }

        // o tipo não muda depois de criado (os campos específicos dependem dele)
        const { tipo, ...resto } = dados;
        return prisma.bebida.update({ where: { id }, data: resto as Prisma.BebidaUpdateInput });
    },

    async deletar(id: string) {
        const bebida = await prisma.bebida.findUnique({ where: { id }});

        if (!bebida) {
            throw erros.naoEncontrado('Bebida não encontrada');
        }

        return prisma.bebida.delete({ where: { id }});
    },
};
