import api from './api';
import type { Method, MethodRequestPayload } from '../types';

export const methodService = {
  /**
   * Cria um novo método de aposta.
   * POST /method
   */
  create: async (payload: MethodRequestPayload): Promise<Method> => {
    const { data } = await api.post<Method>('/method', payload);
    return data;
  },

  /**
   * Retorna todos os métodos de aposta cadastrados no sistema.
   * GET /method
   */
  getAll: async (): Promise<Method[]> => {
    const { data } = await api.get<Method[]>('/method');
    return data;
  },

  /**
   * Busca um método de aposta específico pelo seu ID.
   * GET /method/{id}
   */
  getById: async (id: number): Promise<Method> => {
    const { data } = await api.get<Method>(`/method/${id}`);
    return data;
  },

  /**
   * Atualiza um método de aposta.
   * PUT /method/{id}
   */
  update: async (id: number, payload: MethodRequestPayload): Promise<Method> => {
    const { data } = await api.put<Method>(`/method/${id}`, payload);
    return data;
  },

  /**
   * Deleta um método de aposta.
   * DELETE /method/{id}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/method/${id}`);
  },
};