import api from './api';
import type { Timeline, TimelineRequestPayload, MatchPeriod } from '../types';

export interface StopTimelineParams {
  match_period_finished: MatchPeriod;
  minute_second_finished: number;
  additional_minute_second_finished: number;
}

export const timelineService = {
  /**
   * Busca a timeline correspondente a uma partida.
   * GET /timeline/match/{matchId}
   */
  getByMatchId: async (matchId: number): Promise<Timeline> => {
    const { data } = await api.get<Timeline>(`/timeline/match/${matchId}`);
    return data;
  },

  /**
   * Cria uma nova timeline vinculada a uma partida.
   * POST /timeline
   */
  create: async (payload: TimelineRequestPayload): Promise<Timeline> => {
    const { data } = await api.post<Timeline>('/timeline', payload);
    return data;
  },

  /**
   * Encerra a timeline registrando o período e momento do apito final.
   * PUT /timeline/stop/{id}
   */
  stop: async (id: number, params: StopTimelineParams): Promise<void> => {
    await api.put(`/timeline/stop/${id}`, params);
  },
};