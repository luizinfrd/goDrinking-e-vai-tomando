import { z } from 'zod';
import { texto, vetorSabor } from './comum';

export const atualizarPerfilSchema = z.object({ nome: texto('Nome', 100) });

export const preferenciasSchema = vetorSabor;
