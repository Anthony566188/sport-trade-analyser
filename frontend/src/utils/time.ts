/**
 * Converte segundos totais para exibição no formato MM:SS ou 45+N'.
 *
 * Regra do backend:
 *   - 0..2700s  → MM:SS (ex: 07:30)
 *   - > 2700s   → 45+N' onde N = ceil((elapsed - 2700) / 60)
 */
export function secondsToDisplay(s: number): string {
  if (s > 2700) {
    const extra = Math.ceil((s - 2700) / 60)
    return `45+${extra}'`
  }
  const m   = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

/**
 * Converte uma string "MM:SS" para segundos.
 * Retorna null se o formato for inválido.
 */
export function displayToSeconds(value: string): number | null {
  const trimmed = value.trim()

  // Aceita formatos: "90", "7:30", "07:30", "45:00"
  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, parseInt(trimmed, 10))
  }

  const parts = trimmed.split(':')
  if (parts.length !== 2) return null

  const minutes = parseInt(parts[0], 10)
  const seconds = parseInt(parts[1], 10)

  if (isNaN(minutes) || isNaN(seconds)) return null
  if (seconds < 0 || seconds > 59)      return null
  if (minutes < 0)                       return null

  return minutes * 60 + seconds
}

/**
 * Converte segundos para objeto {minutes, seconds} para uso em inputs separados.
 */
export function secondsToMinSec(totalSeconds: number): { minutes: number; seconds: number } {
  // Limita ao máximo de 2700s (45min) para o campo base
  const clamped = Math.min(totalSeconds, 2700)
  return {
    minutes: Math.floor(clamped / 60),
    seconds: clamped % 60,
  }
}

/**
 * Converte minutos e segundos para total em segundos.
 */
export function minSecToSeconds(minutes: number, seconds: number): number {
  return Math.max(0, minutes * 60 + seconds)
}
