import { z } from 'zod';
import { id } from './comum';

export const paramsFavorito = z.object({ bebidaId: id('bebidaId') });
