import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play, Pause, SkipBack, SkipForward,
  StopCircle, Edit2, Check, X,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatChronometerTime } from '../../utils/time'
import { MatchPeriod } from '../../types'
import type { ChronometerStatus, PhaseTransitionAction } from '../../hooks/useChronometer'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

/** Pontos onde acréscimo é válido (em segundos) */
const OVERTIME_BREAKPOINTS: Record<number, MatchPeriod> = {
  2700: MatchPeriod.FIRST_HALF,   // 45:00
  5400: MatchPeriod.SECOND_HALF,  // 90:00
  6300: MatchPeriod.EXTRA_FIRST,  // 105:00
  7200: MatchPeriod.EXTRA_SECOND, // 120:00
}

/** Converte número para string com zero à esquerda */
const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0')

/** Interpreta string como inteiro não-negativo, ou 0 se inválido */
const parseIntSafe = (s: string) => Math.max(0, parseInt(s.replace(/\D/g, ''), 10) || 0)

/** Retorna true se baseSeconds é exatamente um ponto de acréscimo */
const isBreakpoint = (s: number) => s in OVERTIME_BREAKPOINTS

// ─── TimeEditor (sub-componente) ─────────────────────────────────────────────

interface TimeEditorProps {
  elapsed:    number
  period:     MatchPeriod
  onCommit:   (seconds: number, period: MatchPeriod) => void
  onCancel:   () => void
}

const TimeEditor: React.FC<TimeEditorProps> = ({ elapsed, period, onCommit, onCancel }) => {
  // Calcula o base atual a partir do elapsed + period
  const calcBase = () => {
    switch (period) {
      case MatchPeriod.FIRST_HALF:   return Math.min(elapsed, 2700)
      case MatchPeriod.HALF_TIME:    return 2700
      case MatchPeriod.SECOND_HALF:  return Math.min(elapsed, 5400)
      case MatchPeriod.EXTRA_FIRST:  return Math.min(elapsed, 6300)
      case MatchPeriod.EXTRA_SECOND: return Math.min(elapsed, 7200)
      default:                       return elapsed
    }
  }
  const calcAdd = () => {
    const base = calcBase()
    return Math.max(0, elapsed - base)
  }

  const baseS = calcBase()
  const addS  = calcAdd()

  // ── State ──
  const [baseMin, setBaseMin] = useState(pad2(Math.floor(baseS / 60)))
  const [baseSec, setBaseSec] = useState(pad2(baseS % 60))
  const [addMin,  setAddMin]  = useState(pad2(Math.floor(addS / 60)))
  const [addSec,  setAddSec]  = useState(pad2(addS % 60))
  const [error,   setError]   = useState<string | null>(null)

  const baseMinRef = useRef<HTMLInputElement>(null)
  const baseSecRef = useRef<HTMLInputElement>(null)
  const addMinRef  = useRef<HTMLInputElement>(null)
  const addSecRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { baseMinRef.current?.focus(); baseMinRef.current?.select() }, [])

  // ── Computed ──
  const baseSeconds  = parseIntSafe(baseMin) * 60 + parseIntSafe(baseSec)
  const addSeconds   = parseIntSafe(addMin)  * 60 + parseIntSafe(addSec)
  const showOvertime = isBreakpoint(baseSeconds)
  const totalSeconds = baseSeconds + (showOvertime ? addSeconds : 0)

  // ── Helpers ──
  const clampSec = (val: string, setter: (v: string) => void) => {
    const n = parseIntSafe(val)
    setter(pad2(Math.min(n, 59)))
  }

  const autoTab = (val: string, maxVal: number, nextRef: React.RefObject<HTMLInputElement>) => {
    const n = parseIntSafe(val)
    // Auto-tab quando dois dígitos atingirem o limite ou quando digitar ":"
    if (String(n).length >= 2 && n >= Math.floor(maxVal / 10)) {
      nextRef.current?.focus()
      nextRef.current?.select()
    }
  }

  // ── Commit ──
  const commit = useCallback(() => {
    if (parseIntSafe(baseSec) > 59 || parseIntSafe(addSec) > 59) {
      setError('Segundos devem ser entre 00 e 59.')
      return
    }

    let inferredPeriod: MatchPeriod

    if (showOvertime && addSeconds > 0) {
      // Período inferido do ponto de acréscimo exato
      inferredPeriod = OVERTIME_BREAKPOINTS[baseSeconds]
    } else {
      // Inferência automática de período (comportamento existente preservado)
      if (baseSeconds <= 2700)      inferredPeriod = MatchPeriod.FIRST_HALF
      else if (baseSeconds <= 5400) inferredPeriod = MatchPeriod.SECOND_HALF
      else if (baseSeconds <= 6300) inferredPeriod = MatchPeriod.EXTRA_FIRST
      else                          inferredPeriod = MatchPeriod.EXTRA_SECOND
    }

    onCommit(totalSeconds, inferredPeriod)
  }, [baseSeconds, addSeconds, showOvertime, totalSeconds, baseSec, addSec, onCommit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  commit()
    if (e.key === 'Escape') onCancel()
  }

  // ── Preview do tempo resultante ──
  const previewDisplay = (() => {
    const m = Math.floor(baseSeconds / 60)
    const s = baseSeconds % 60
    const base = `${pad2(m)}:${pad2(s)}`
    if (showOvertime && addSeconds > 0) {
      return `${base}+${pad2(Math.floor(addSeconds / 60))}:${pad2(addSeconds % 60)}'`
    }
    return `${base}'`
  })()

  return (
    <div
      className="flex flex-col gap-2"
      onKeyDown={handleKeyDown}
    >
      {/* ── Inputs de tempo base ── */}
      <div className="flex items-center gap-1">
        {/* Minutos */}
        <input
          ref={baseMinRef}
          type="text"
          inputMode="numeric"
          value={baseMin}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 3)
            setBaseMin(v)
            setError(null)
            autoTab(v, 200, baseSecRef)
          }}
          onBlur={e => setBaseMin(pad2(parseIntSafe(e.target.value)))}
          aria-label="Minutos"
          className={cn(
            'w-12 text-center font-mono text-xl font-bold bg-transparent border-b-2 outline-none',
            'text-turf-900 dark:text-turf-100',
            error ? 'border-red-500' : 'border-pitch-500',
          )}
        />
        <span className="font-mono text-xl font-bold text-turf-400 select-none">:</span>
        {/* Segundos */}
        <input
          ref={baseSecRef}
          type="text"
          inputMode="numeric"
          value={baseSec}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2)
            setBaseSec(v)
            setError(null)
            if (showOvertime) autoTab(v, 60, addMinRef)
          }}
          onBlur={e => clampSec(e.target.value, setBaseSec)}
          aria-label="Segundos"
          className={cn(
            'w-10 text-center font-mono text-xl font-bold bg-transparent border-b-2 outline-none',
            'text-turf-900 dark:text-turf-100',
            error ? 'border-red-500' : 'border-pitch-500',
          )}
        />

        {/* ── Acréscimo (aparece apenas em pontos válidos) ── */}
        {showOvertime && (
          <>
            <span className="font-mono text-base font-bold text-pitch-500 select-none px-0.5">+</span>
            {/* Min acréscimo */}
            <input
              ref={addMinRef}
              type="text"
              inputMode="numeric"
              value={addMin}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                setAddMin(v)
                setError(null)
                autoTab(v, 99, addSecRef)
              }}
              onBlur={e => setAddMin(pad2(parseIntSafe(e.target.value)))}
              aria-label="Minutos de acréscimo"
              className={cn(
                'w-10 text-center font-mono text-xl font-bold bg-transparent border-b-2 outline-none',
                'text-pitch-600 dark:text-pitch-400',
                'border-pitch-500',
              )}
            />
            <span className="font-mono text-xl font-bold text-turf-400 select-none">:</span>
            {/* Seg acréscimo */}
            <input
              ref={addSecRef}
              type="text"
              inputMode="numeric"
              value={addSec}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                setAddSec(v)
                setError(null)
              }}
              onBlur={e => clampSec(e.target.value, setAddSec)}
              aria-label="Segundos de acréscimo"
              className={cn(
                'w-10 text-center font-mono text-xl font-bold bg-transparent border-b-2 outline-none',
                'text-pitch-600 dark:text-pitch-400',
                'border-pitch-500',
              )}
            />
          </>
        )}

        {/* Confirm / Cancel */}
        <button
          onClick={commit}
          aria-label="Confirmar"
          className="p-1 ml-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onCancel}
          aria-label="Cancelar"
          className="p-1 rounded text-turf-400 hover:bg-turf-100 dark:hover:bg-turf-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Dicas contextuais ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {error ? (
          <p className="text-[10px] text-red-500">{error}</p>
        ) : showOvertime ? (
          <p className="text-[10px] text-pitch-500 dark:text-pitch-400">
            Acréscimo disponível → <span className="font-mono font-semibold">{previewDisplay}</span>
          </p>
        ) : (
          <p className="text-[10px] text-turf-400 dark:text-turf-500">
            Para acréscimo, defina o tempo exato (45:00, 90:00, 105:00 ou 120:00).
          </p>
        )}
      </div>
    </div>
  )
}

// ─── TimelineControls ─────────────────────────────────────────────────────────

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
  const [editing, setEditing] = useState(false)

  const isRunning = status === 'running'
  const isPaused  = status === 'paused'
  const isIdle    = status === 'idle'

  const handleCommit = useCallback((seconds: number, inferredPeriod: MatchPeriod) => {
    onSetTime(seconds, inferredPeriod)
    // Se o período inferido for diferente do atual, muda explicitamente
    if (inferredPeriod !== period) {
      onChangePeriod(inferredPeriod)
    }
    setEditing(false)
  }, [onSetTime, onChangePeriod, period])

  const handleCancel = useCallback(() => setEditing(false), [])

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
      {/* ── Linha superior: tempo + badge de estado ── */}
      <div className="flex items-start justify-between gap-4 mb-4">

        <div className="flex items-start gap-3">
          {/* Dot de status */}
          <span
            aria-label={`Status: ${statusLabel}`}
            className={cn(
              'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2',
              statusColor,
              isRunning && 'animate-pulse',
            )}
          />

          {editing ? (
            /* ── Editor estruturado ── */
            <TimeEditor
              elapsed={elapsed}
              period={period}
              onCommit={handleCommit}
              onCancel={handleCancel}
            />
          ) : (
            /* ── Display do tempo ── */
            <button
              onClick={() => { if (!disabled && !isIdle) setEditing(true) }}
              disabled={disabled || isIdle}
              aria-label="Clique para editar o tempo manualmente"
              title={(!disabled && !isIdle) ? 'Clique para editar' : undefined}
              className={cn(
                'font-mono text-xl sm:text-2xl font-bold tracking-tight transition-colors group',
                isRunning
                  ? 'text-turf-900 dark:text-turf-100'
                  : isPaused
                  ? 'text-amber-700 dark:text-amber-400'
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

        {/* Badge de estado */}
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

      {/* ── Linha de botões de controle ── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* -5s */}
        <button
          onClick={() => onSeek(-5)}
          disabled={disabled || isIdle}
          aria-label="Voltar 5 segundos"
          title="-5s"
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            'border-turf-200 dark:border-turf-700 text-turf-600 dark:text-turf-300',
            'hover:bg-turf-100 dark:hover:bg-turf-700',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <SkipBack className="w-3.5 h-3.5" /> 5s
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
            'border-turf-200 dark:border-turf-700 text-turf-600 dark:text-turf-300',
            'hover:bg-turf-100 dark:hover:bg-turf-700',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          +5s <SkipForward className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-turf-200 dark:bg-turf-700 mx-1" aria-hidden />

        {/* Transição de Fase */}
        {nextPhaseAction && (
          <>
            <button
              onClick={() => onPhaseTransition(nextPhaseAction!)}
              disabled={disabled || isIdle}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {phaseActionLabel}
            </button>
            <div className="w-px h-5 bg-turf-200 dark:bg-turf-700 mx-1" aria-hidden />
          </>
        )}

        {/* Encerrar */}
        <button
          onClick={onStop}
          disabled={disabled || isIdle}
          aria-label="Encerrar timeline"
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors border',
            'text-red-500 dark:text-red-400 border-red-200 dark:border-red-900',
            'hover:bg-red-50 dark:hover:bg-red-950/20',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <StopCircle className="w-3.5 h-3.5" /> Encerrar
        </button>
      </div>

      {/* ── Dica de edição ── */}
      {!isIdle && !editing && !disabled && (
        <p className="text-[10px] text-turf-400 dark:text-turf-500 mt-3">
          Clique no tempo para editá-lo manualmente.
        </p>
      )}
    </div>
  )
}