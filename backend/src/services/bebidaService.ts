import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isErroDeValidacao(msg: string): boolean{
    return msg.startsWith('[validacao]');
}

export {isErroDeValidacao};

export const bebidaService = {
    async listar(tipo?: string, nome?: string){
        return prisma.bebida.findMany({
            where: {
                ...(tipo && { tipo: { equals: tipo, mode: 'insensitive'}}),
                ...(nome && { nome: { equals: nome, mode: 'insensitive'}}),
            },

            orderBy: {notaMedia: 'desc'},
        });
    },

    async buscarPorId(id: string) {
        const bebida = await prisma.bebida.findUnique({
            where: { id },
            include: {
                avaliacoes: {
                    orderBy: { data: 'desc'},
                    take: 10, //limita os resultados em 10 registros
                },
            },
        });

        if (!bebida) {
            throw new Error('[validacao] Bebida não encontrada');
        }

        return bebida;
    },

    async criar(dados: {
        nome: string;
        tipo: string;
        atributoDoce?: number;
        atributoSeco?: number; 
        atributoCitrico?: number;
        atributoEncorpado?: number; 
        criadoUser?: boolean;

        tipoVinho?: string;
        uva?: string;
        paisOrigem?: string;

        ingredientes?: string;
        baseAlcoolica?: string;
    }) {
        const tipo = dados.tipo.toLowerCase();

        if (tipo === 'vinho' && !dados.tipoVinho){
            throw new Error('[validacao] Campo tipoVinho é obrigatório para vinhos');
        }

        if (tipo === 'drink' && !dados.baseAlcoolica){
            throw new Error('[validacao] Campo baseAlcoolica é obrigatório para drinks');
        }

        if (tipo !== 'vinho' && tipo !== 'drink'){
            throw new Error('[validacao] Tipo deve ser "vinho" ou "drink"');
        }

        return prisma.bebida.create({ data: dados });
    },

    async atualizar(id:  string, dados: {
        nome?: string;
        atributoDoce?: number;
        atributoSeco?: number;
        atributoCitrico?: number;
        atributoEncorpado?: number;
        tipoVinho?: string;
        uva?: string;
        paisOrigem?: string;
        ingredientes?: string;
        baseAlcoolica?: string;
    }) {
        const bebida = await prisma.bebida.findUnique({ where: { id } });

        if(!bebida) {
            throw new Error('[validacao] Bebida não encontrada');
        }

        return prisma.bebida.update({ where: { id }, data: dados });
    },

    async deletar(id: string) {
        const bebida = await prisma.bebida.findUnique({ where: { id }});

        if (!bebida) {
            throw new Error('[validacao] Bebida não encontrada');
        }

        return prisma.bebida.delete({ where: { id }});
    },
};