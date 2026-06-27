import axios from 'axios';

/** Base URL aponta para o backend FastAPI local */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

/**
 * Normaliza o campo `detail` do FastAPI ou exceções de rede para uma string legível.
 */
function parseApiError(error: unknown): string {
  // Sem resposta do servidor (timeout, falha de rede, CORS, etc.)
  if (!axios.isAxiosError(error) || !error.response) {
    return error instanceof Error ? error.message : 'Erro de conexão com o servidor.';
  }

  const data = error.response.data;

  // Se a resposta for um texto simples (ex: erro 500 devolvendo HTML ou texto puro)
  if (typeof data === 'string') {
    return data;
  }

  // Fallback caso a data seja nula ou vazia
  if (!data) {
    return `Erro ${error.response.status}: ${error.response.statusText}`;
  }

  const detail = data.detail;

  // Caso 1: detail é uma string simples (Erros de domínio capturados no Controller via HTTPException)
  if (typeof detail === 'string') {
    return detail;
  }

  // Caso 2: detail é o array de erros do Pydantic (Validações estruturais e exceções de Schemas)
  if (Array.isArray(detail) && detail.length > 0) {
    try {
      return detail
        .map((d: any) => {
          // Proteção caso o array de details contenha apenas strings
          if (typeof d === 'string') return d;

          let msg = d?.msg ?? 'Campo inválido';
          
          // O Pydantic adiciona o prefixo "Value error, " quando um @model_validator falha
          if (typeof msg === 'string' && msg.startsWith('Value error, ')) {
            msg = msg.replace('Value error, ', '');
          }

          // Substituímos o uso de .at(-1) por indexação segura para evitar TypeError em engines antigos
          const locArray = Array.isArray(d?.loc) ? d.loc : [];
          const field = locArray.length > 0 ? locArray[locArray.length - 1] : undefined;

          // Se o erro for atrelado ao corpo inteiro da requisição (ex: validação cruzada), ignoramos o prefixo "body:"
          if (field === 'body') {
            return msg;
          }

          return field ? `${field}: ${msg}` : msg;
        })
        .join(' | ');
    } catch (err) {
      return 'Erro de validação nos dados enviados.';
    }
  }

  // Caso 3: detail é um objeto (Outros formatos de erro previstos por middlewares)
  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string') return detail.message;
    if (typeof detail.error === 'string') return detail.error;
  }

  // Caso 4: fallback para propriedade message no nível root da resposta
  if (typeof data.message === 'string') {
    return data.message;
  }

  // Fallback genérico final
  return `Erro ${error.response.status}: ${error.response.statusText}`;
}

// Interceptor de resposta: normaliza todos os erros da API transformando-os em Errors legíveis
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(parseApiError(error))),
);

export default api;