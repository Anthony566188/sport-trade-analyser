import React, { useState, useCallback } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, StopCircle, Edit2,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatChronometerTime } from '../../utils/time'
import { MatchPeriod } from '../../types'
import { TimeEditor } from './TimeEditor'
import { decomposeSeconds } from './TimeEditor'
import type { ChronometerStatus, PhaseTransitionAction } from '../../hooks/useChronometer'

interface TimelineControlsProps {
  elapsed:            number
  status:             ChronometerStatus
  period:             MatchPeriod
  onTogglePlayPause:  () => void
  onSeek:             (delta: number) => void
  onSetTime:          (seconds: number, period: MatchPeriod) => void
  onChangePeriod:     (period: MatchPeriod) => void
  onStop:             () => void
  onPhaseTransition:  (action: PhaseTransitionAction) => void
  disabled?:          boolean
  className?:         string
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  elapsed, status, period,
  onTogglePlayPause, onSeek, onSetTime, onChangePeriod,
  onPhaseTransition, onStop,
  disabled = false, className,
}) => {
  const [editing, setEditing] = useState(false)

  const isRunning = status === 'running'
  const isPaused  = status === 'paused'
  const isIdle    = status === 'idle'

  const { base: initBase, additional: initAdd } = decomposeSeconds(elapsed, period)

  const handleCommit = useCallback(({ baseSeconds, additionalSeconds, period: newPeriod }: {
    baseSeconds: number; additionalSeconds: number; period: MatchPeriod; totalSeconds: number
  }) => {
    const total = baseSeconds + additionalSeconds
    onSetTime(total, newPeriod)
    if (newPeriod !== period) onChangePeriod(newPeriod)
    setEditing(false)
  }, [onSetTime, onChangePeriod, period])

  // ── Fase ──
  const isRunning_ = isRunning
  let nextPhaseAction: PhaseTransitionAction | null = null
  let phaseLabel = ''
  if (period === MatchPeriod.FIRST_HALF)                       { nextPhaseAction = 'END_1H';  phaseLabel = 'Encerrar 1º Tempo' }
  else if (period === MatchPeriod.HALF_TIME)                   { nextPhaseAction = 'START_2H'; phaseLabel = 'Iniciar 2º Tempo' }
  else if (period === MatchPeriod.SECOND_HALF && !isPaused)    { nextPhaseAction = 'END_2H';  phaseLabel = 'Encerrar 2º Tempo' }
  else if (period === MatchPeriod.SECOND_HALF && isPaused)     { nextPhaseAction = 'START_E1'; phaseLabel = 'Iniciar Prorrogação (1T)' }
  else if (period === MatchPeriod.EXTRA_FIRST  && !isPaused)   { nextPhaseAction = 'END_E1';  phaseLabel = 'Encerrar 1ºT Prorrogação' }
  else if (period === MatchPeriod.EXTRA_FIRST  && isPaused)    { nextPhaseAction = 'START_E2'; phaseLabel = 'Iniciar Prorrogação (2T)' }
  else if (period === MatchPeriod.EXTRA_SECOND && !isPaused)   { nextPhaseAction = 'END_E2';  phaseLabel = 'Encerrar Prorrogação' }

  const statusLabel = isRunning ? 'Rodando' : isPaused ? 'Pausado' : 'Aguardando'
  const dotCls = isRunning
    ? 'bg-emerald-500 animate-pulse'
    : isPaused ? 'bg-amber-400' : 'bg-turf-300 dark:bg-turf-600'

  return (
    <div className={cn(
      'rounded-2xl p-5 border transition-colors',
      isRunning
        ? 'bg-pitch-50 dark:bg-pitch-950/20 border-pitch-200 dark:border-pitch-900'
        : isPaused
        ? 'bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
        : 'bg-turf-50 dark:bg-turf-800/40 border-turf-200 dark:border-turf-700',
      className,
    )}>
      {/* ── Tempo + badge ── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-2', dotCls)} />

          {editing ? (
            <TimeEditor
              variant="inline"
              initialBaseSeconds={initBase}
              initialAdditionalSeconds={initAdd}
              onConfirm={handleCommit}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <button
              onClick={() => { if (!disabled && !isIdle) setEditing(true) }}
              disabled={disabled || isIdle}
              title={(!disabled && !isIdle) ? 'Clique para editar' : undefined}
              className={cn(
                'font-mono text-xl sm:text-2xl font-bold tracking-tight transition-colors group',
                isRunning ? 'text-turf-900 dark:text-turf-100'
                  : isPaused ? 'text-amber-700 dark:text-amber-400'
                  : 'text-turf-400 dark:text-turf-500',
                !disabled && !isIdle && 'hover:text-pitch-600 dark:hover:text-pitch-400 cursor-pointer',
                (disabled || isIdle) && 'cursor-default',
              )}
            >
              {formatChronometerTime(elapsed, period)}
              {!disabled && !isIdle && (
                <Edit2 className="inline-block w-3.5 h-3.5 ml-2 opacity-0 group-hover:opacity-50 transition-opacity align-baseline" />
              )}
            </button>
          )}
        </div>

        <span className={cn(
          'text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 mt-0.5',
          isRunning
            ? 'bg-pitch-100 dark:bg-pitch-950/40 text-pitch-700 dark:text-pitch-400'
            : isPaused
            ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
            : 'bg-turf-200 dark:bg-turf-700 text-turf-500 dark:text-turf-400',
        )}>
          {statusLabel}
        </span>
      </div>

      {/* ── Controles ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {nextPhaseAction && (
          <>
            <button
              onClick={() => onPhaseTransition(nextPhaseAction!)}
              disabled={disabled || isIdle}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {phaseLabel}
            </button>
            <div className="w-px h-5 bg-turf-200 dark:bg-turf-700 mx-1" />
          </>
        )}

        <button onClick={() => onSeek(-5)} disabled={disabled || isIdle}
          aria-label="-5s"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-turf-200 dark:border-turf-700 text-turf-600 dark:text-turf-300 hover:bg-turf-100 dark:hover:bg-turf-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <SkipBack className="w-3.5 h-3.5" /> 5s
        </button>

        <button onClick={onTogglePlayPause} disabled={disabled || isIdle}
          aria-label={isRunning_ ? 'Pausar' : 'Iniciar'}
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
            isRunning_ ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-pitch-600 hover:bg-pitch-700 text-white',
          )}>
          {isRunning_ ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> {isPaused ? 'Retomar' : 'Iniciar'}</>}
        </button>

        <button onClick={() => onSeek(5)} disabled={disabled || isIdle}
          aria-label="+5s"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-turf-200 dark:border-turf-700 text-turf-600 dark:text-turf-300 hover:bg-turf-100 dark:hover:bg-turf-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          +5s <SkipForward className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-turf-200 dark:bg-turf-700 mx-1" />

        <button onClick={onStop} disabled={disabled || isIdle}
          aria-label="Encerrar"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-red-500 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <StopCircle className="w-3.5 h-3.5" /> Encerrar
        </button>
      </div>

      {!isIdle && !editing && !disabled && (
        <p className="text-[10px] text-turf-400 dark:text-turf-500 mt-3">
          Clique no tempo para editá-lo manualmente.
        </p>
      )}
    </div>
  )
}