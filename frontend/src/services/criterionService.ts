import api from './api';
import type { Criterion, CriterionRequestPayload } from '../types';

export const criterionService = {
  /**
   * Cria um novo critério.
   * POST /criterion
   */
  create: async (payload: CriterionRequestPayload): Promise<Criterion> => {
    const { data } = await api.post<Criterion>('/criterion', payload);
    return data;
  },

  /**
   * Retorna todos os critérios analíticos cadastrados no sistema.
   * GET /criterion
   */
  getAll: async (): Promise<Criterion[]> => {
    const { data } = await api.get<Criterion[]>('/criterion');
    return data;
  },

  /**
   * Busca um critério específico pelo seu ID.
   * GET /criterion/{id}
   */
  getById: async (id: number): Promise<Criterion> => {
    const { data } = await api.get<Criterion>(`/criterion/${id}`);
    return data;
  },

  /**
   * Atualiza os dados de um critério.
   * PUT /criterion/{id}
   */
  update: async (id: number, payload: CriterionRequestPayload): Promise<Criterion> => {
    const { data } = await api.put<Criterion>(`/criterion/${id}`, payload);
    return data;
  },

  /**
   * Deleta um critério.
   * DELETE /criterion/{id}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/criterion/${id}`);
  },
};