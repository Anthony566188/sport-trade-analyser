import api from './api';
import type { Team, Championship } from '../types';

/**
 * Busca times de um campeonato específico com filtro opcional.
 * GET /championships/{id}/teams/search?query=<text>
 *
 * Quando `query` estiver vazio, o backend retorna todos os times
 * daquele campeonato (comportamento "Ver todos").
 */
export async function searchTeamsByChampionship(
  championshipId: number,
  query: string,
): Promise<Team[]> {
  const params = query.trim() ? { query: query.trim() } : {};
  const { data } = await api.get<Team[]>(
    `/championships/${championshipId}/teams/search`,
    { params },
  );
  return data;
}

/**
 * Busca TODOS os times (modo amistoso) — sem filtro de campeonato.
 * GET /championships/all/teams/search?query=<text>
 * (Endpoint assumido para o modo amistoso; ajuste se diferente.)
 */
export async function searchAllTeams(query: string): Promise<Team[]> {
  const params = query.trim() ? { query: query.trim() } : {};
  const { data } = await api.get<Team[]>('/teams/search', { params });
  return data;
}

/**
 * Lista todos os campeonatos disponíveis.
 * GET /championships
 */
export async function fetchChampionships(): Promise<Championship[]> {
  const { data } = await api.get<Championship[]>('/championships');
  return data;
}
