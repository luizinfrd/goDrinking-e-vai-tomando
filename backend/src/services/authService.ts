// lógica de negócio (hash, comparar senha, gerar token)

import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { getJwtExpiresIn, getJwtSecret } from '../utils/jwt';

const SALT_ROUNDS = 10;

export const authService = {
    async register(nome: string, email: string, senha: string){
        const userExistente = await prisma.user.findUnique({ where: {email} });

        if(userExistente) {
            throw new Error('Email já cadastrado');
        }

        // gera o hash da senha
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        //cria o usuário e suas preferências (zeradas até o onboarding)
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
            getJwtSecret(),
            { expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'] }
        );

        return {
            token,
            user: { id: user.id, nome: user.nome, email:user.email },
        };
    },
};
