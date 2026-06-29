import React, { useState, useRef, useEffect } from 'react'
import {
  Play, Pause, SkipBack, SkipForward,
  StopCircle, Edit2, Check, X,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { secondsToDisplay, displayToSeconds, formatMinutesSeconds } from '../../utils/time'
import { MatchPeriod, MATCH_PERIOD_LABELS } from '../../types'
import type { ChronometerStatus, PhaseTransitionAction } from '../../hooks/useChronometer'

// ─── Types ────────────────────────────────────────────────────────────────────
interface TimelineControlsProps {
  /** Tempo atual em segundos */
  elapsed: number
  /** Estado do cronômetro */
  status: ChronometerStatus
  /** Estado explícito do período da partida */
  period: MatchPeriod
  /** Alterna play/pause */
  onTogglePlayPause: () => void
  /** Avança ou recua N segundos */
  onSeek: (delta: number) => void
  /** Define o tempo manualmente */
  onSetTime: (seconds: number) => void
  /** Atualiza explicitamente o período do jogo */
  onChangePeriod: (period: MatchPeriod) => void
  /** Encerra a timeline (persiste no backend) */
  onStop: () => void
  /** Transição explícita de fase do jogo */
  onPhaseTransition: (action: PhaseTransitionAction) => void
  /** Quando true, todos os controles ficam desabilitados */
  disabled?: boolean
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * TimelineControls
 *
 * Barra de controles do cronômetro com:
 * - Exibição do tempo atual (clicável para edição manual)
 * - Botão Play/Pause
 * - Botões -5s / +5s (seek)
 * - Botão Encerrar
 * - Indicador de estado (rodando / pausado)
 */
export const TimelineControls: React.FC<TimelineControlsProps> = ({
  elapsed,
  status,
  period,
  onTogglePlayPause,
  onSeek,
  onSetTime,
  onChangePeriod,
  onPhaseTransition,
  onStop,
  disabled = false,
  className,
}) => {
  // ── Estado de edição manual do tempo ──
  const [editing, setEditing]         = useState(false)
  const [editValue, setEditValue]     = useState('')
  const [editError, setEditError]     = useState(false)
  const inputRef                      = useRef<HTMLInputElement>(null)

  const isRunning = status === 'running'
  const isPaused  = status === 'paused'
  const isIdle    = status === 'idle'

  // ── Foca o input ao entrar em modo de edição ──
  useEffect(() => {
    if (editing) {
      setEditError(false)
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [editing])

  // ── Confirma a edição manual ──
  const commitEdit = () => {
    const parsed = displayToSeconds(editValue)
    if (parsed === null) {
      setEditError(true)
      return
    }
    onSetTime(parsed)
    setEditing(false)
    setEditError(false)
  }

  // ── Cancela a edição ──
  const cancelEdit = () => {
    setEditing(false)
    setEditError(false)
  }

  // ── Teclas no input de edição ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  commitEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  // ── Label do estado ──
  const statusLabel = isRunning ? 'Rodando' : isPaused ? 'Pausado' : 'Aguardando'
  const statusColor = isRunning
    ? 'bg-emerald-500'
    : isPaused
    ? 'bg-amber-400'
    : 'bg-turf-300 dark:bg-turf-600'

  // ── Lógica de Transição de Fase ──
  let nextPhaseAction: PhaseTransitionAction | null = null
  let phaseActionLabel = ''

  if (period === MatchPeriod.FIRST_HALF) {
    nextPhaseAction = 'END_1H'
    phaseActionLabel = 'Encerrar 1º Tempo'
  } else if (period === MatchPeriod.HALF_TIME) {
    nextPhaseAction = 'START_2H'
    phaseActionLabel = 'Iniciar 2º Tempo'
  } else if (period === MatchPeriod.SECOND_HALF) {
    if (isPaused) {
      nextPhaseAction = 'START_E1'
      phaseActionLabel = 'Iniciar Prorrogação (1T)'
    } else {
      nextPhaseAction = 'END_2H'
      phaseActionLabel = 'Encerrar 2º Tempo'
    }
  } else if (period === MatchPeriod.EXTRA_FIRST) {
    if (isPaused) {
      nextPhaseAction = 'START_E2'
      phaseActionLabel = 'Iniciar Prorrogação (2T)'
    } else {
      nextPhaseAction = 'END_E1'
      phaseActionLabel = 'Encerrar 1ºT Prorrogação'
    }
  } else if (period === MatchPeriod.EXTRA_SECOND) {
    if (!isPaused) {
      nextPhaseAction = 'END_E2'
      phaseActionLabel = 'Encerrar Prorrogação'
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-5 border transition-colors',
        isRunning
          ? 'bg-pitch-50 dark:bg-pitch-950/20 border-pitch-200 dark:border-pitch-900'
          : isPaused
          ? 'bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
          : 'bg-turf-50 dark:bg-turf-800/40 border-turf-200 dark:border-turf-700',
        className,
      )}
    >
      {/* ── Linha superior: tempo + indicador ── */}
      <div className="flex items-center justify-between gap-4 mb-4">

        {/* Tempo — clicável para editar */}
        <div className="flex items-center gap-3">
          {/* Dot de status */}
          <span
            aria-label={`Status: ${statusLabel}`}
            className={cn(
              'w-2.5 h-2.5 rounded-full flex-shrink-0',
              statusColor,
              isRunning && 'animate-pulse',
            )}
          />

          {editing ? (
            /* ── Input de edição manual ── */
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                value={editValue}
                onChange={e => { setEditValue(e.target.value); setEditError(false) }}
                onKeyDown={handleKeyDown}
                aria-label="Editar tempo manualmente"
                placeholder="MM:SS"
                className={cn(
                  'w-24 font-mono text-2xl font-bold bg-transparent border-b-2 outline-none text-center',
                  'text-turf-900 dark:text-turf-100',
                  editError
                    ? 'border-red-500 text-red-500'
                    : 'border-pitch-500',
                )}
              />
              <button
                onClick={commitEdit}
                aria-label="Confirmar edição"
                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEdit}
                aria-label="Cancelar edição"
                className="p-1 rounded text-turf-400 hover:bg-turf-100 dark:hover:bg-turf-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ── Display do tempo ── */
            <button
              onClick={() => {
                if (!disabled && !isIdle) {
                  setEditValue(formatMinutesSeconds(elapsed)) // Captura o tempo EXATO do clique
                  setEditing(true)
                }
              }}
              disabled={disabled || isIdle}
              aria-label="Clique para editar o tempo manualmente"
              title={(!disabled && !isIdle) ? 'Clique para editar' : undefined}
              className={cn(
                'font-mono text-xl sm:text-2xl font-bold tracking-tight transition-colors',
                isRunning
                  ? 'text-turf-900 dark:text-turf-100'
                  : isPaused
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-turf-400 dark:text-turf-500',
                !disabled && !isIdle && 'hover:text-pitch-600 dark:hover:text-pitch-400 cursor-pointer group',
                (disabled || isIdle) && 'cursor-default',
              )}
            >
              {secondsToDisplay(elapsed)}
              {/* Ícone de lápis ao hover */}
              {!disabled && !isIdle && (
                <Edit2 className="inline-block w-3.5 h-3.5 ml-2 opacity-0 group-hover:opacity-50 transition-opacity align-baseline" />
              )}
            </button>
          )}
        </div>

        {/* Badge de status */}
        {/* Seleção de Período e Badge de status */}
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => onChangePeriod(e.target.value as MatchPeriod)}
            disabled={disabled || isIdle}
            aria-label="Selecionar período da partida"
            className={cn(
              "text-xs font-semibold rounded-lg px-2 py-1 border outline-none bg-transparent appearance-none cursor-pointer",
              "text-turf-700 dark:text-turf-300 border-turf-200 dark:border-turf-700 focus:border-pitch-500 transition-colors",
              (disabled || isIdle) && "opacity-50 cursor-not-allowed"
            )}
          >
            {Object.entries(MATCH_PERIOD_LABELS).map(([val, label]) => (
              <option key={val} value={val} className="text-black dark:text-white bg-white dark:bg-turf-800">
                {label}
              </option>
            ))}
          </select>

          <span className={cn(
            'text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full',
            isRunning
              ? 'bg-pitch-100 dark:bg-pitch-950/40 text-pitch-700 dark:text-pitch-400'
              : isPaused
              ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
              : 'bg-turf-200 dark:bg-turf-700 text-turf-500 dark:text-turf-400',
          )}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* ── Linha inferior: botões de controle ── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Transição de Fase */}
        {nextPhaseAction && (
          <>
            <button
              onClick={() => onPhaseTransition(nextPhaseAction!)}
              disabled={disabled || isIdle}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {phaseActionLabel}
            </button>
            <div className="w-px h-5 bg-turf-200 dark:bg-turf-700 mx-1" aria-hidden />
          </>
        )}

        {/* -5s */}
        <button
          onClick={() => onSeek(-5)}
          disabled={disabled || isIdle}
          aria-label="Voltar 5 segundos"
          title="-5s"
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            'border-turf-200 dark:border-turf-700',
            'text-turf-600 dark:text-turf-300',
            'hover:bg-turf-100 dark:hover:bg-turf-700',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <SkipBack className="w-3.5 h-3.5" />
          5s
        </button>

        {/* Play / Pause */}
        <button
          onClick={onTogglePlayPause}
          disabled={disabled || isIdle}
          aria-label={isRunning ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors',
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-pitch-600 hover:bg-pitch-700 text-white',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {isRunning
            ? <><Pause className="w-4 h-4" /> Pausar</>
            : <><Play  className="w-4 h-4" /> {isPaused ? 'Retomar' : 'Iniciar'}</>
          }
        </button>

        {/* +5s */}
        <button
          onClick={() => onSeek(5)}
          disabled={disabled || isIdle}
          aria-label="Avançar 5 segundos"
          title="+5s"
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            'border-turf-200 dark:border-turf-700',
            'text-turf-600 dark:text-turf-300',
            'hover:bg-turf-100 dark:hover:bg-turf-700',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          +5s
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Divider visual */}
        <div className="w-px h-5 bg-turf-200 dark:bg-turf-700 mx-1" aria-hidden />

        {/* Encerrar */}
        <button
          onClick={onStop}
          disabled={disabled || isIdle}
          aria-label="Encerrar timeline"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
            'text-red-500 dark:text-red-400',
            'border-red-200 dark:border-red-900',
            'hover:bg-red-50 dark:hover:bg-red-950/20',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <StopCircle className="w-3.5 h-3.5" />
          Encerrar
        </button>
      </div>

      {/* ── Dica de edição manual ── */}
      {!isIdle && !editing && !disabled && (
        <p className="text-[10px] text-turf-400 dark:text-turf-500 mt-3">
          Clique no tempo para editá-lo manualmente.
        </p>
      )}
    </div>
  )
}
