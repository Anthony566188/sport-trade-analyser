import React, { useState } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Spinner } from '../ui/Spinner'
import { TimeEditor } from './TimeEditor'
import type { MatchPeriod } from '../../types'

// ─── GoalInput ────────────────────────────────────────────────────────────────

interface GoalInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  align?: 'left' | 'right'
}

const GoalInput: React.FC<GoalInputProps> = ({ label, value, onChange, align = 'left' }) => (
  <div className={cn('flex flex-col items-center gap-1', align === 'right' && 'items-end')}>
    <span className="text-[10px] text-turf-400 dark:text-turf-500 font-medium truncate max-w-[90px]">
      {label}
    </span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label={`Diminuir gols de ${label}`}
        className="w-6 h-6 rounded flex items-center justify-center bg-turf-100 dark:bg-turf-700 text-turf-600 dark:text-turf-300 text-lg leading-none hover:bg-turf-200 dark:hover:bg-turf-600 transition-colors"
      >−</button>
      <span className="w-8 text-center font-mono font-bold text-lg text-turf-900 dark:text-turf-100">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`Aumentar gols de ${label}`}
        className="w-6 h-6 rounded flex items-center justify-center bg-turf-100 dark:bg-turf-700 text-turf-600 dark:text-turf-300 text-lg leading-none hover:bg-turf-200 dark:hover:bg-turf-600 transition-colors"
      >+</button>
    </div>
  </div>
)

// ─── CreateTimelinePainel ─────────────────────────────────────────────────────

interface CreateTimelinePainelProps {
  teamHome: string
  teamAway: string
  onConfirm: (
    baseSeconds: number,
    additionalSeconds: number,
    period: MatchPeriod,
    homeGoals: number,
    awayGoals: number,
  ) => Promise<void>
  className?: string
}

export const CreateTimelinePainel: React.FC<CreateTimelinePainelProps> = ({
  teamHome,
  teamAway,
  onConfirm,
  className,
}) => {
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [homeGoals,  setHomeGoals]  = useState(0)
  const [awayGoals,  setAwayGoals]  = useState(0)

  const handleConfirm = async (result: {
    baseSeconds: number; additionalSeconds: number; period: MatchPeriod; totalSeconds: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm(result.baseSeconds, result.additionalSeconds, result.period, homeGoals, awayGoals)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar timeline.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      'rounded-2xl p-5 border border-dashed space-y-4',
      'border-turf-300 dark:border-turf-600',
      'bg-turf-50/50 dark:bg-turf-800/20',
      className,
    )}>
      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-turf-400 dark:text-turf-500" />
        <p className="text-sm font-semibold text-turf-700 dark:text-turf-300">
          Iniciar nova Timeline
        </p>
      </div>

      {/* ── Placar ── */}
      <div>
        <p className="text-[10px] font-semibold text-turf-500 dark:text-turf-400 uppercase tracking-wider mb-2">
          Placar inicial
        </p>
        <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-xl bg-white dark:bg-turf-800 border border-turf-200 dark:border-turf-700">
          <GoalInput label={teamHome} value={homeGoals} onChange={setHomeGoals} />
          <span className="font-mono font-bold text-lg text-turf-400 dark:text-turf-500 select-none">×</span>
          <GoalInput label={teamAway} value={awayGoals} onChange={setAwayGoals} align="right" />
        </div>
      </div>

      {/* ── Tempo inicial ── */}
      <div>
        <p className="text-xs text-turf-500 dark:text-turf-400 mb-3">
          Defina o tempo inicial. Se a partida já começou, informe o tempo atual para sincronizar.
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-turf-500">
            <Spinner size="sm" /> Criando timeline...
          </div>
        ) : (
          <TimeEditor
            variant="block"
            initialBaseSeconds={0}
            initialAdditionalSeconds={0}
            onConfirm={handleConfirm}
            confirmLabel="Iniciar Timeline"
            autoFocus={false}
          />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}