import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { MatchPeriod } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeEditorResult {
  baseSeconds:       number
  additionalSeconds: number
  period:            MatchPeriod
  totalSeconds:      number
}

interface TimeEditorProps {
  initialBaseSeconds?:       number
  initialAdditionalSeconds?: number
  /** Se omitido, o período é sempre inferido automaticamente */
  initialPeriod?:            MatchPeriod
  onConfirm?: (result: TimeEditorResult) => void 
  onChange?: (result: TimeEditorResult) => void  
  hideControls?: boolean                      
  onCancel?: () => void
  /** inline → compacto (dentro do cronômetro)
   *  block  → formulário com labels (criação / encerramento) */
  variant?: 'inline' | 'block'
  confirmLabel?: string
  autoFocus?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Pontos onde acréscimo é válido (base em segundos → período) */
const OVERTIME_BREAKPOINTS: Record<number, MatchPeriod> = {
  2700: MatchPeriod.FIRST_HALF,
  5400: MatchPeriod.SECOND_HALF,
  6300: MatchPeriod.EXTRA_FIRST,
  7200: MatchPeriod.EXTRA_SECOND,
}

const pad2          = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0')
const parseIntSafe  = (s: string) => Math.max(0, parseInt(s.replace(/\D/g, ''), 10) || 0)
const isBreakpoint  = (s: number) => s in OVERTIME_BREAKPOINTS

/** Infere o período a partir dos segundos base (sem acréscimo) */
function inferPeriod(baseSeconds: number, hasAdditional: boolean): MatchPeriod {
  if (hasAdditional && isBreakpoint(baseSeconds)) {
    return OVERTIME_BREAKPOINTS[baseSeconds]
  }
  if (baseSeconds <= 2700) return MatchPeriod.FIRST_HALF
  if (baseSeconds <= 5400) return MatchPeriod.SECOND_HALF
  if (baseSeconds <= 6300) return MatchPeriod.EXTRA_FIRST
  return MatchPeriod.EXTRA_SECOND
}

/** Decompõe totalSeconds em { base, additional } para um dado período */
function decomposeSeconds(
  totalSeconds: number,
  period: MatchPeriod,
): { base: number; additional: number } {
  const caps: Record<MatchPeriod, number> = {
    [MatchPeriod.FIRST_HALF]:   2700,
    [MatchPeriod.HALF_TIME]:    2700,
    [MatchPeriod.SECOND_HALF]:  5400,
    [MatchPeriod.EXTRA_FIRST]:  6300,
    [MatchPeriod.EXTRA_SECOND]: 7200,
  }
  const cap = caps[period] ?? totalSeconds
  return {
    base:       Math.min(totalSeconds, cap),
    additional: Math.max(0, totalSeconds - cap),
  }
}

// ─── TimeEditor ───────────────────────────────────────────────────────────────

export const TimeEditor: React.FC<TimeEditorProps> = ({
  initialBaseSeconds       = 0,
  initialAdditionalSeconds = 0,
  onConfirm,
  onChange,
  onCancel,
  variant      = 'inline',
  confirmLabel = 'Confirmar',
  autoFocus    = true,
  hideControls = false,
}) => {
  const [baseMin, setBaseMin] = useState(pad2(Math.floor(initialBaseSeconds / 60)))
  const [baseSec, setBaseSec] = useState(pad2(initialBaseSeconds % 60))
  const [addMin,  setAddMin]  = useState(pad2(Math.floor(initialAdditionalSeconds / 60)))
  const [addSec,  setAddSec]  = useState(pad2(initialAdditionalSeconds % 60))
  const [error,   setError]   = useState<string | null>(null)

  const baseMinRef = useRef<HTMLInputElement>(null)
  const baseSecRef = useRef<HTMLInputElement>(null)
  const addMinRef  = useRef<HTMLInputElement>(null)
  const addSecRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      baseMinRef.current?.focus()
      baseMinRef.current?.select()
    }
  }, [autoFocus])

  // ── Derived ──
  const baseSeconds = parseIntSafe(baseMin) * 60 + parseIntSafe(baseSec)
  const addSeconds  = parseIntSafe(addMin)  * 60 + parseIntSafe(addSec)
  const showOvertime = isBreakpoint(baseSeconds)
  const totalSeconds = baseSeconds + (showOvertime ? addSeconds : 0)

  // Mantém a referência mais recente do callback para evitar loops de renderização
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Reporta em tempo real as mudanças isolando as dependências do callback
  useEffect(() => {
    if (onChangeRef.current) {
      if (parseIntSafe(baseSec) > 59 || parseIntSafe(addSec) > 59) return
      const period = inferPeriod(baseSeconds, showOvertime && addSeconds > 0)
      const effectiveAdd = showOvertime ? addSeconds : 0
      onChangeRef.current({ baseSeconds, additionalSeconds: effectiveAdd, period, totalSeconds: baseSeconds + effectiveAdd })
    }
  }, [baseSeconds, addSeconds, showOvertime, baseSec, addSec])

  const previewText = (() => {
    const m = Math.floor(baseSeconds / 60)
    const s = baseSeconds % 60
    const base = `${pad2(m)}:${pad2(s)}`
    if (showOvertime && addSeconds > 0)
      return `${base}+${pad2(Math.floor(addSeconds / 60))}:${pad2(addSeconds % 60)}'`
    return `${base}'`
  })()

  // ── Auto-tab ──
  const autoTab = (val: string, limit: number, ref: React.RefObject<HTMLInputElement>) => {
    const n = parseIntSafe(val)
    if (val.length >= 2 && n >= Math.floor(limit / 10)) {
      ref.current?.focus(); ref.current?.select()
    }
  }

  const clampSec = (val: string, setter: (v: string) => void) =>
    setter(pad2(Math.min(parseIntSafe(val), 59)))

  // ── Commit ──
  const commit = useCallback(() => {
    if (parseIntSafe(baseSec) > 59 || parseIntSafe(addSec) > 59) {
      setError('Segundos devem ser entre 00 e 59.'); return
    }
    const period       = inferPeriod(baseSeconds, showOvertime && addSeconds > 0)
    const effectiveAdd = showOvertime ? addSeconds : 0
    if (onConfirm) {
      onConfirm({ baseSeconds, additionalSeconds: effectiveAdd, period, totalSeconds: baseSeconds + effectiveAdd })
    }
  }, [baseSeconds, addSeconds, showOvertime, baseSec, addSec, onConfirm])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')                        commit()
    if (e.key === 'Escape' && onCancel) onCancel()
  }

  // ── Styles ──
  const isBlock   = variant === 'block'
  const inputBase = cn(
    'text-center font-mono font-bold bg-transparent outline-none border-b-2 transition-colors',
    isBlock
      ? 'w-14 text-base py-1 text-turf-900 dark:text-turf-100'
      : 'w-12 text-xl   py-0 text-turf-900 dark:text-turf-100',
    error ? 'border-red-500 text-red-500' : 'border-pitch-500',
  )
  const addInputBase = cn(
    'text-center font-mono font-bold bg-transparent outline-none border-b-2 border-pitch-500 transition-colors',
    isBlock
      ? 'w-14 text-base py-1 text-pitch-600 dark:text-pitch-400'
      : 'w-10 text-xl   py-0 text-pitch-600 dark:text-pitch-400',
  )
  const sepCls = cn('font-mono font-bold select-none text-turf-400',
    isBlock ? 'text-base' : 'text-xl')

  return (
    <div className={cn('flex flex-col', isBlock ? 'gap-3' : 'gap-2')} onKeyDown={handleKeyDown}>

      {isBlock && (
        <p className={cn('text-[10px] uppercase tracking-wider font-semibold',
          'text-turf-500 dark:text-turf-400')}>
          Tempo
        </p>
      )}

      {/* ── Input row ── */}
      <div className="flex items-center flex-wrap gap-1">

        {/* Base: MM:SS */}
        <input ref={baseMinRef} type="text" inputMode="numeric"
          value={baseMin} aria-label="Minutos"
          className={inputBase}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 3)
            setBaseMin(v); setError(null); autoTab(v, 200, baseSecRef)
          }}
          onBlur={e => setBaseMin(pad2(parseIntSafe(e.target.value)))}
        />
        <span className={sepCls}>:</span>
        <input ref={baseSecRef} type="text" inputMode="numeric"
          value={baseSec} aria-label="Segundos"
          className={inputBase}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2)
            setBaseSec(v); setError(null)
            if (showOvertime) autoTab(v, 60, addMinRef)
          }}
          onBlur={e => clampSec(e.target.value, setBaseSec)}
        />

        {/* Acréscimo: aparece apenas nos pontos válidos */}
        {showOvertime && (
          <>
            <span className={cn('font-mono font-bold select-none text-pitch-500 dark:text-pitch-400 px-0.5',
              isBlock ? 'text-sm' : 'text-base')}>
              +
            </span>
            <input ref={addMinRef} type="text" inputMode="numeric"
              value={addMin} aria-label="Minutos de acréscimo"
              className={addInputBase}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                setAddMin(v); setError(null); autoTab(v, 99, addSecRef)
              }}
              onBlur={e => setAddMin(pad2(parseIntSafe(e.target.value)))}
            />
            <span className={sepCls}>:</span>
            <input ref={addSecRef} type="text" inputMode="numeric"
              value={addSec} aria-label="Segundos de acréscimo"
              className={addInputBase}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                setAddSec(v); setError(null)
              }}
              onBlur={e => clampSec(e.target.value, setAddSec)}
            />
          </>
        )}

        {/* Botões inline */}
        {variant === 'inline' && !hideControls && (
          <>
            <button onClick={commit} aria-label="Confirmar"
              className="p-1 ml-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            {onCancel && (
              <button onClick={onCancel} aria-label="Cancelar"
                className="p-1 rounded text-turf-400 hover:bg-turf-100 dark:hover:bg-turf-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Dica ── */}
      {error ? (
        <p className="text-[10px] text-red-500">{error}</p>
      ) : showOvertime ? (
        <p className={cn('text-[10px]', 'text-pitch-500 dark:text-pitch-400')}>
          Acréscimo disponível →{' '}
          <span className="font-mono font-semibold">{previewText}</span>
        </p>
      ) : (
        <p className="text-[10px] text-turf-400 dark:text-turf-500">
          Para acréscimo, defina o tempo exato: 45:00, 90:00, 105:00 ou 120:00.
        </p>
      )}

      {/* Botões block */}
      {isBlock && !hideControls && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={commit}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              'bg-pitch-600 hover:bg-pitch-700 text-white',
            )}
          >
            <Check className="w-3.5 h-3.5" />
            {confirmLabel}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                'bg-turf-200 dark:bg-turf-700 hover:bg-turf-300 dark:hover:bg-turf-600',
                'text-turf-700 dark:text-turf-300',
              )}
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Re-export helpers needed by consumers
export { decomposeSeconds, inferPeriod }