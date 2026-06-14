import axios from 'axios';

/** Base URL aponta para o backend FastAPI local */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// Interceptor de erro global: repassa o detalhe da API FastAPI
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail: string =
      error?.response?.data?.detail ?? error?.message ?? 'Erro desconhecido.';
    return Promise.reject(new Error(detail));
  },
);

export default api;
