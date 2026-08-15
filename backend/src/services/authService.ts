// lógica de negócio (hash, comparar senha, gerar token)

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '1h';

export const authService = {
    async register(nome: string, email: string, senha: string){
        const userExistente = await prisma.user.findUnique({ where: {email} });

        if(userExistente) {
            throw new Error('Email já cadastrado');
        }

        // gera o hash da senha
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        //cria o usuário e suas preferências
        const user = await prisma.user.create({
            data: {
                nome,
                email,
                senha: senhaHash,
                preferences: {
                    create: {
                        pesoDoce: 0,
                        pesoSeco: 0,
                        pesoCitrico: 0,
                        pesoEncorpado: 0,
                    },
                },
            },

            select: {id: true, nome: true, email: true, dataCriacao: true},
        });

        return user;
    },

    async login(email: string, senha: string){
        //busca o usuário pelo email
        const user = await prisma.user.findUnique({ where: { email } });

        if(!user) {
            throw new Error('Credenciais inválidas');
        }

        //compara a senha com o hashcode criado
        const senhaCorreta = await bcrypt.compare(senha, user.senha);
        if(!senhaCorreta) {
            throw new Error('Credenciais inválidas');
        }

        // token jwt
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return {
            token,
            user: { id: user.id, nome: user.nome, email:user.email },
        };
    },
};