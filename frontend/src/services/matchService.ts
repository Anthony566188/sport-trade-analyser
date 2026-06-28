import api from './api';
import type { Match, MatchRequestPayload } from '../types';

export const matchService = {
  /**
   * Cria uma nova partida.
   * POST /matches
   */
  create: async (payload: MatchRequestPayload): Promise<Match> => {
    const { data } = await api.post<Match>('/matches', payload);
    return data;
  },

  /**
   * Busca as partidas agendadas para uma data específica.
   * GET /matches/date/{date}
   */
  getByDate: async (date: string): Promise<Match[]> => {
    const { data } = await api.get<Match[]>(`/matches/date/${date}`);
    return data;
  },

  /**
   * Busca uma partida específica pelo seu ID.
   * GET /matches/{id}
   */
  getById: async (id: number): Promise<Match> => {
    const { data } = await api.get<Match>(`/matches/${id}`);
    return data;
  },

  /**
   * Atualiza os dados de uma partida.
   * PUT /matches/{id}
   */
  update: async (id: number, payload: MatchRequestPayload): Promise<Match> => {
    const { data } = await api.put<Match>(`/matches/${id}`, payload);
    return data;
  },

  /**
   * Deleta uma partida pelo ID.
   * DELETE /matches/{id}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/matches/${id}`);
  },
};