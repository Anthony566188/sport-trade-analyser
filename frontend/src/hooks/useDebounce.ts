import { useState, useEffect } from 'react';

/**
 * Retarda a atualização de um valor por `delay` milissegundos.
 * Usado para evitar chamadas excessivas à API enquanto o usuário digita.
 *
 * @param value  Valor a ser "debounceado"
 * @param delay  Tempo de espera em ms (padrão: 500ms)
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
