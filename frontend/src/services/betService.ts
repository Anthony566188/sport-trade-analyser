import api from './api';
import type { BetRequestPayload, Bet } from '../types';

export const betService = {
  /**
   * Cria uma nova aposta.
   * POST /bet
   */
  create: async (payload: BetRequestPayload): Promise<Bet> => {
    const { data } = await api.post<Bet>('/bet', payload);
    return data;
  },
};