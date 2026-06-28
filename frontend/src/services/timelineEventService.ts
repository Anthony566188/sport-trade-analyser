import api from './api';
import type { TimelineEvent, TimelineEventRequestPayload, UpdateTimelineEventRequestPayload } from '../types';

export const timelineEventService = {
  /**
   * Busca todos os eventos registrados em uma timeline específica.
   * GET /timeline-event/timeline/{timelineId}
   */
  getByTimelineId: async (timelineId: number): Promise<TimelineEvent[]> => {
    const { data } = await api.get<TimelineEvent[]>(`/timeline-event/timeline/${timelineId}`);
    return data;
  },

  /**
   * Cria um novo evento físico ou de critério na timeline.
   * POST /timeline-event
   */
  create: async (payload: TimelineEventRequestPayload): Promise<TimelineEvent> => {
    const { data } = await api.post<TimelineEvent>('/timeline-event', payload);
    return data;
  },

    /**
   * Atualiza um evento da timeline.
   * PUT /timeline-event/{id}
   */
  update: async (id: number, payload: UpdateTimelineEventRequestPayload): Promise<TimelineEvent> => {
    const { data } = await api.put<TimelineEvent>(`/timeline-event/${id}`, payload);
    return data;
  },

  /**
   * Deleta um evento da timeline.
   * DELETE /timeline-event/{id}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/timeline-event/${id}`);
  },
};