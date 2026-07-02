import api from './api';
import type { 
  BetRequestPayload, 
  UpdateBetRequestPayload, 
  BetExitRequestPayload,
  Bet 
} from '../types';

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
   * Busca todas as apostas associadas a uma partida.
   * GET /bet/match/{matchId}
   */
  getByMatchId: async (matchId: number): Promise<Bet[]> => {
    const { data } = await api.get<Bet[]>(`/bet/match/${matchId}`);
    return data;
  },

  /**
   * Atualiza os dados de uma aposta existente (trinca completa).
   * PUT /bet/{id}
   */
  update: async (id: number, payload: UpdateBetRequestPayload): Promise<Bet> => {
    const { data } = await api.put<Bet>(`/bet/${id}`, payload);
    return data;
  },

  /**
   * Deleta uma aposta.
   * DELETE /bet/{id}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/bet/${id}`);
  },

  /**
   * Realiza o Cashout (encerra a aposta).
   * PUT /bet/{id}/exit
   */
  exit: async (id: number, payload: BetExitRequestPayload): Promise<Bet> => {
    const { data } = await api.put<Bet>(`/bet/${id}/exit`, payload);
    return data;
  },
};