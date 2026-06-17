import api from './api';
import type { BetRequestPayload, UpdateBetRequestPayload, Bet } from '../types';

export const betService = {
  /**
   * Cria uma nova aposta.
   * POST /bet
   */
  create: async (payload: BetRequestPayload): Promise<Bet> => {
    const { data } = await api.post<Bet>('/bet', payload);
    return data;
  },

  /**
   * Busca uma aposta específica pelo ID.
   * GET /bet/{id}
   */
  getById: async (id: number): Promise<Bet> => {
    const { data } = await api.get<Bet>(`/bet/${id}`);
    return data;
  },

  /**
   * Atualiza os dados de uma aposta existente.
   * PUT /bet/{id}
   */
  update: async (id: number, payload: UpdateBetRequestPayload): Promise<Bet> => {
    const { data } = await api.put<Bet>(`/bet/${id}`, payload);
    return data;
  },

  /**
   * Deleta uma aposta e propaga exclusão em cascata (eventos).
   * DELETE /bet/{id}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/bet/${id}`);
  },

  /**
   * Realiza o Cashout (encerra a aposta).
   * PUT /bet/{id}/exit/{exit_odd}
   */
  exit: async (id: number, exitOdd: number): Promise<Bet> => {
    const { data } = await api.put<Bet>(`/bet/${id}/exit/${exitOdd}`);
    return data;
  },
};