import api from './api';
import type { BetRequestPayload, Bet } from '../types';

export const betService = {
  // Verifique se a sua rota no FastAPI é '/bet' ou '/bets'
  create: async (payload: BetRequestPayload): Promise<Bet> => {
    const response = await api.post('/bet', payload);
    return response.data;
  },
  
};