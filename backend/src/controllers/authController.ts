// recebe os dados e chama o service após validação do JWT
import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
    async register(req: Request, res: Response) {
        try {
            const {nome, email, senha} = req.body;

            if (!nome || !email || !senha) {
                res.status(400).json({error: 'Nome, email e senha são obrigatórios'});
                return;
            }

            if (senha.length < 8){
                res.status(400).json({error: 'A senha deve ter no mínimo 8 caracteres'});
            }

            const user = await authService.register(nome, email, senha);
            res.status(201).json({message: 'Usuário cadastrado com sucesso', user});
        } catch (error: any) {
            if(error.message === 'Email já cadastrado'){
                res.status(409).json({error: error.message});
                return;
            }    
            res.status(500).json({error: 'Erro interno do servidor'});
        }
    },

    async login(req: Request, res: Response){
        try{
            const {email, senha} = req.body;

            if (!email || !senha){
                res.status(400).json({error: 'Email e senha são obrigatórios'});
                return;
            }

            const result = await authService.login(email, senha);
            res.status(201).json(result);
        } catch (error: any) {
            if(error.message === 'Credenciais inválidas'){
                res.status(401).json({error: error.message});
                return;
            }
            res.status(500).json({error: 'Erro interno do servidor'});
        }
    },
}