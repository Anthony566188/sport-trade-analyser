import axios from 'axios';

/** Base URL aponta para o backend FastAPI local */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

/**
 * Normaliza o campo `detail` do FastAPI para uma string legível.
 */
function parseApiError(error: unknown): string {
  // Sem resposta do servidor (timeout, rede, etc.)
  if (!axios.isAxiosError(error) || !error.response) {
    return error instanceof Error ? error.message : 'Erro de conexão com o servidor.';
  }

  const detail = error.response.data?.detail;

  // Caso 1: detail é uma string simples
  if (typeof detail === 'string') {
    return detail;
  }

  // Caso 2: detail é o array de erros do Pydantic
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d: { loc?: string[]; msg?: string }) => {
        // Pega o último elemento de `loc` como contexto do campo (ex: "stake")
        const field = d.loc?.at(-1);
        const msg   = d.msg ?? 'Campo inválido';
        return field ? `${field}: ${msg}` : msg;
      })
      .join(' | ');
  }

  // Fallback
  return `Erro ${error.response.status}: ${error.response.statusText}`;
}

// Interceptor de resposta: normaliza todos os erros da API
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(parseApiError(error))),
);

export default api;