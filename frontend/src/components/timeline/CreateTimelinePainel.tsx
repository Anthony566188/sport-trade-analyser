import React, { useState } from 'react'
import { Clock, Play, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Spinner } from '../ui/Spinner'
import { minSecToSeconds } from '../../utils/time'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateTimelinePainelProps {
  /** Callback que recebe o tempo inicial em segundos ao confirmar */
  onConfirm: (startSeconds: number) => Promise<void>
  /** Classe adicional */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CreateTimelinePanel
 *
 * Exibido quando uma partida existe mas ainda não tem timeline associada.
 * Permite ao usuário definir o tempo inicial (MM:SS) antes de criar/iniciar.
 *
 * UX: inputs de minutos e segundos separados (mais fácil de preencher
 * rapidamente em campo), com soma exibida em segundos para conferência.
 */
export const CreateTimelinePainel: React.FC<CreateTimelinePainelProps> = ({
  onConfirm,
  className,
}) => {
  const [minutes,  setMinutes]  = useState(0)
  const [seconds,  setSeconds]  = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const totalSeconds = minSecToSeconds(minutes, seconds)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm(totalSeconds)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar timeline.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = cn(
    'w-16 text-center rounded-lg border-2 px-2 py-2 text-sm font-mono',
    'bg-white dark:bg-turf-800',
    'border-turf-200 dark:border-turf-700',
    'text-turf-900 dark:text-turf-100',
    'focus:outline-none focus:border-pitch-500',
    'transition-colors',
  )

  return (
    <div className={cn(
      'rounded-2xl p-5 border border-dashed',
      'border-turf-300 dark:border-turf-600',
      'bg-turf-50/50 dark:bg-turf-800/20',
      className,
    )}>
      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-turf-400 dark:text-turf-500" />
        <p className="text-sm font-semibold text-turf-700 dark:text-turf-300">
          Nenhuma timeline iniciada
        </p>
      </div>

      <p className="text-xs text-turf-500 dark:text-turf-400 mb-4">
        Defina o tempo inicial e clique em <strong>Iniciar Timeline</strong>.
        Se a partida já começou, informe o tempo atual para sincronizar.
      </p>

      {/* ── Inputs de tempo ── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={120}
            value={minutes}
            onChange={e => setMinutes(Math.max(0, Math.min(120, Number(e.target.value))))}
            aria-label="Minutos iniciais"
            className={inputCls}
          />
          <span className="text-xs text-turf-400 dark:text-turf-500">min</span>
        </div>

        <span className="text-turf-300 dark:text-turf-600 font-bold select-none">:</span>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={e => setSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
            aria-label="Segundos iniciais"
            className={inputCls}
          />
          <span className="text-xs text-turf-400 dark:text-turf-500">seg</span>
        </div>

        <span className="text-xs text-turf-400 dark:text-turf-500 ml-1">
          = {totalSeconds}s
        </span>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 mb-3">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Botão ── */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        aria-label="Criar e iniciar timeline"
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
          'bg-pitch-600 hover:bg-pitch-700 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {loading
          ? <Spinner size="sm" className="border-white border-t-transparent" />
          : <Play className="w-4 h-4" />
        }
        {loading ? 'Criando...' : 'Iniciar Timeline'}
      </button>
    </div>
  )
}
