import React, { useState } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Spinner } from '../ui/Spinner'
import { TimeEditor } from './TimeEditor'
import type { MatchPeriod } from '../../types'

interface CreateTimelinePainelProps {
  onConfirm: (baseSeconds: number, additionalSeconds: number, period: MatchPeriod) => Promise<void>
  className?: string
}

export const CreateTimelinePainel: React.FC<CreateTimelinePainelProps> = ({
  onConfirm,
  className,
}) => {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleConfirm = async (result: {
    baseSeconds: number; additionalSeconds: number; period: MatchPeriod; totalSeconds: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm(result.baseSeconds, result.additionalSeconds, result.period)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar timeline.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      'rounded-2xl p-5 border border-dashed',
      'border-turf-300 dark:border-turf-600',
      'bg-turf-50/50 dark:bg-turf-800/20',
      className,
    )}>
      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-turf-400 dark:text-turf-500" />
        <p className="text-sm font-semibold text-turf-700 dark:text-turf-300">
          Nenhuma timeline iniciada
        </p>
      </div>

      <p className="text-xs text-turf-500 dark:text-turf-400 mb-4">
        Defina o tempo inicial e clique em <strong>Iniciar Timeline</strong>.
        Se a partida já começou, informe o tempo atual para sincronizar.
      </p>

      {/* ── Editor estruturado de tempo ── */}
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

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 mt-3">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}