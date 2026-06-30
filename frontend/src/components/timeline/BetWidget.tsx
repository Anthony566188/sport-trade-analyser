import React, { useState, useRef, useEffect, useCallback } from 'react'
import { LayoutGrid, CircleDollarSign, ChevronUp, Trash2, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { betService } from '../../services/betService'
import { matchTimeToDisplay } from '../../utils/time'
import type { BetType, Bet, Method, BetRequestPayload, BetExitRequestPayload } from '../../types'
import { MatchPeriod } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingBet {
  localId: string
  team: string
  type: BetType
  odd: string
  stake: string
  methodId: string
}

interface BetWidgetProps {
  matchId: number
  methods: Method[]
  chronometer: {
    period: MatchPeriod
    minuteSecond: number
    additionalMinuteSecond: number
  }
  pendingBets: PendingBet[]
  setPendingBets: React.Dispatch<React.SetStateAction<PendingBet[]>>
  confirmedBets: Bet[]
  onBetCreated: (bet: Bet) => void
  onBetDeleted: (betId: number) => void
  onBetExited: (bet: Bet) => void
}

const WIDGET_WIDTH = 380
const QUICK_STAKES: { label: string; value: number }[] = [
  { label: '1,00', value: 1 },
  { label: '2,50', value: 2.5 },
  { label: '5,00', value: 5 },
]

// ─── Pending Bet Card ─────────────────────────────────────────────────────────

interface PendingBetCardProps {
  bet: PendingBet
  methods: Method[]
  onChange: (updates: Partial<PendingBet>) => void
  onRemove: () => void
}

const PendingBetCard: React.FC<PendingBetCardProps> = ({ bet, methods, onChange, onRemove }) => {
  const isBack = bet.type === 'BACK'
  return (
    <div className="rounded-lg overflow-hidden border border-turf-700 text-xs">
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-2.5 py-1.5 border-b',
        isBack
          ? 'bg-blue-900/40 border-blue-700/50'
          : 'bg-red-900/40  border-red-700/50'
      )}>
        <span className={cn('font-semibold text-[11px]', isBack ? 'text-blue-300' : 'text-red-300')}>
          {isBack ? 'A favor (Back)' : 'Contra (Lay)'}
          <span className="text-turf-300 font-normal"> · {bet.team}</span>
        </span>
        <button
          onClick={onRemove}
          className="p-0.5 ml-2 text-turf-500 hover:text-red-400 transition-colors shrink-0"
          title="Remover aposta"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Fields */}
      <div className="bg-turf-900 px-2.5 py-2 space-y-2">
        {/* Odd + Stake */}
        <div className="flex gap-2">
          <div className="w-[72px] shrink-0">
            <p className="text-[9px] text-turf-500 uppercase tracking-wide mb-0.5">Odd</p>
            <input
              type="number"
              min="1.01"
              step="0.01"
              placeholder="1.01"
              value={bet.odd}
              onChange={e => onChange({ odd: e.target.value })}
              className="w-full px-2 py-1 rounded bg-turf-800 border border-turf-700 text-turf-100 text-[11px] focus:outline-none focus:ring-1 focus:ring-pitch-500"
            />
          </div>
          <div className="w-[72px] shrink-0">
            <p className="text-[9px] text-turf-500 uppercase tracking-wide mb-0.5">Stake</p>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={bet.stake}
              onChange={e => onChange({ stake: e.target.value })}
              className="w-full px-2 py-1 rounded bg-turf-800 border border-turf-700 text-turf-100 text-[11px] focus:outline-none focus:ring-1 focus:ring-pitch-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-turf-500 uppercase tracking-wide mb-0.5">Método</p>
            <select
              value={bet.methodId}
              onChange={e => onChange({ methodId: e.target.value })}
              className="w-full px-1.5 py-1 rounded bg-turf-800 border border-turf-700 text-turf-100 text-[11px] focus:outline-none focus:ring-1 focus:ring-pitch-500"
            >
              <option value="">Selecione...</option>
              {methods.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick stakes */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-turf-600 uppercase tracking-wide">Rápido:</span>
          {QUICK_STAKES.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => onChange({ stake: value.toString() })}
              className="px-2 py-0.5 rounded bg-turf-800 border border-turf-700 text-turf-300 text-[10px] hover:bg-turf-700 hover:border-turf-600 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Confirmed Bet Card ───────────────────────────────────────────────────────

interface ConfirmedBetCardProps {
  bet: Bet
  cashoutOdd: string
  isCashingOut: boolean
  isDeleting: boolean
  onCashoutOddChange: (val: string) => void
  onCashout: () => void
  onDelete: () => void
}

const ConfirmedBetCard: React.FC<ConfirmedBetCardProps> = ({
  bet, cashoutOdd, isCashingOut, isDeleting,
  onCashoutOddChange, onCashout, onDelete,
}) => {
  const isBack   = bet.type === 'BACK'
  const isClosed = bet.exit_odd !== null

  return (
    <div className="rounded-lg overflow-hidden border border-turf-700 text-xs">
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-2.5 py-1.5 border-b',
        isBack
          ? 'bg-blue-900/40 border-blue-700/50'
          : 'bg-red-900/40  border-red-700/50'
      )}>
        <span className={cn('font-semibold text-[11px]', isBack ? 'text-blue-300' : 'text-red-300')}>
          {isBack ? 'A favor (Back)' : 'Contra (Lay)'}
          <span className="text-turf-300 font-normal"> · {bet.team}</span>
        </span>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-0.5 ml-2 text-turf-500 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
          title="Remover aposta"
        >
          {isDeleting
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Trash2   className="w-3 h-3" />}
        </button>
      </div>

      {/* Details */}
      <div className="bg-turf-900 px-2.5 py-2 space-y-1.5">
        {/* Odd + Stake */}
        <div className="flex gap-3 text-[11px]">
          <span className="text-turf-500">Odd <span className="text-turf-200">{bet.entry_odd}</span></span>
          <span className="text-turf-500">Stake <span className="text-turf-200">R${bet.stake}</span></span>
        </div>

        {/* Entry time */}
        <p className="text-[10px] text-turf-500">
          Entrada:{' '}
          <span className="text-turf-300">
            {matchTimeToDisplay({
              period: bet.entry_period,
              minute_second: bet.entry_minute_second,
              additional_minute_second: bet.entry_additional_minute_second,
            })}
          </span>
        </p>

        {isClosed ? (
          /* Closed: show exit time + odd */
          <p className="text-[10px] text-turf-500">
            Saída:{' '}
            <span className="text-turf-300">
              {matchTimeToDisplay({
                period: bet.exit_period!,
                minute_second: bet.exit_minute_second!,
                additional_minute_second: bet.exit_additional_minute_second,
              })}
            </span>
            <span className="text-turf-600 ml-1.5">(Odd {bet.exit_odd})</span>
          </p>
        ) : (
          /* Open: cashout row */
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[9px] text-turf-600 uppercase tracking-wide shrink-0">Cashout:</span>
            <input
              type="number"
              min="1.01"
              step="0.01"
              placeholder="Odd saída"
              value={cashoutOdd}
              onChange={e => onCashoutOddChange(e.target.value)}
              className="w-20 px-2 py-0.5 rounded bg-turf-800 border border-turf-700 text-turf-100 text-[11px] focus:outline-none focus:ring-1 focus:ring-pitch-500"
            />
            <button
              onClick={onCashout}
              disabled={isCashingOut || !cashoutOdd || Number(cashoutOdd) <= 1}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-pitch-600 hover:bg-pitch-700 text-white text-[10px] font-medium disabled:opacity-50 transition-colors"
            >
              {isCashingOut && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              Cashout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BetWidget ────────────────────────────────────────────────────────────────

export const BetWidget: React.FC<BetWidgetProps> = ({
  matchId,
  methods,
  chronometer,
  pendingBets,
  setPendingBets,
  confirmedBets,
  onBetCreated,
  onBetDeleted,
  onBetExited,
}) => {
  const [isOpen,      setIsOpen]      = useState(false)
  const [leftPos,     setLeftPos]     = useState<number | null>(null)
  const [isDragging,  setIsDragging]  = useState(false)
  const [isPlacing,   setIsPlacing]   = useState(false)
  const [placeError,  setPlaceError]  = useState<string | null>(null)
  const [cashoutOdds, setCashoutOdds] = useState<Record<number, string>>({})
  const [cashingOut,  setCashingOut]  = useState<Record<number, boolean>>({})
  const [deletingMap, setDeletingMap] = useState<Record<number, boolean>>({})

  const widgetRef     = useRef<HTMLDivElement>(null)
  const dragState     = useRef({ startClientX: 0, startLeft: 0, hasMoved: false })
  const prevPendingLen = useRef(0)

  // Auto-open when a new pending bet is added
  useEffect(() => {
    if (pendingBets.length > prevPendingLen.current) setIsOpen(true)
    prevPendingLen.current = pendingBets.length
  }, [pendingBets.length])

  // ── Drag (preserved) ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = widgetRef.current?.getBoundingClientRect()
    if (!rect) return
    dragState.current = { startClientX: e.clientX, startLeft: rect.left, hasMoved: false }
    setLeftPos(rect.left)
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - dragState.current.startClientX
      if (Math.abs(delta) > 4) dragState.current.hasMoved = true
      const newLeft = dragState.current.startLeft + delta
      setLeftPos(Math.max(8, Math.min(newLeft, window.innerWidth - WIDGET_WIDTH - 8)))
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [isDragging])

  const handleHeaderClick = useCallback(() => {
    if (!dragState.current.hasMoved) setIsOpen(prev => !prev)
  }, [])

  // ── Pending operations ───────────────────────────────────────────────────────
  const updatePending = (localId: string, updates: Partial<PendingBet>) =>
    setPendingBets(prev => prev.map(b => b.localId === localId ? { ...b, ...updates } : b))

  const removePending = (localId: string) =>
    setPendingBets(prev => prev.filter(b => b.localId !== localId))

  const clearPending = () => { setPendingBets([]); setPlaceError(null) }

  // ── Place bets ───────────────────────────────────────────────────────────────
  const handlePlaceBets = async () => {
    setPlaceError(null)

    // Validation
    for (const bet of pendingBets) {
      if (!bet.methodId)                              { setPlaceError('Selecione um método para todas as apostas.'); return }
      if (!bet.odd || Number(bet.odd) <= 1)           { setPlaceError('Odd deve ser maior que 1 em todas as apostas.'); return }
      if (!bet.stake || Number(bet.stake) <= 0)       { setPlaceError('Stake deve ser maior que 0 em todas as apostas.'); return }
    }

    setIsPlacing(true)
    try {
      const created = await Promise.all(pendingBets.map(bet => {
        const payload: BetRequestPayload = {
          id_method:   Number(bet.methodId),
          id_match:    matchId,
          team:        bet.team,
          stake:       Number(bet.stake),
          entry_odd:   Number(bet.odd),
          type:        bet.type,
          entry_period:                    chronometer.period,
          entry_minute_second:             chronometer.minuteSecond,
          entry_additional_minute_second:  chronometer.additionalMinuteSecond ?? 0,
        }
        return betService.create(payload)
      }))
      created.forEach(b => onBetCreated(b))
      setPendingBets([])
    } catch (e) {
      setPlaceError(e instanceof Error ? e.message : 'Erro ao registrar apostas.')
    } finally {
      setIsPlacing(false)
    }
  }

  // ── Cashout ──────────────────────────────────────────────────────────────────
  const handleCashout = async (betId: number) => {
    const odd = Number(cashoutOdds[betId])
    if (!odd || odd <= 1) { alert('Odd de saída deve ser maior que 1.'); return }

    setCashingOut(prev => ({ ...prev, [betId]: true }))
    try {
      const payload: BetExitRequestPayload = {
        exit_odd:                       odd,
        exit_period:                    chronometer.period,
        exit_minute_second:             chronometer.minuteSecond,
        exit_additional_minute_second:  chronometer.additionalMinuteSecond ?? 0,
      }
      const updated = await betService.exit(betId, payload)
      onBetExited(updated)
      setCashoutOdds(prev => { const n = { ...prev }; delete n[betId]; return n })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao encerrar aposta.')
    } finally {
      setCashingOut(prev => { const n = { ...prev }; delete n[betId]; return n })
    }
  }

  // ── Delete confirmed bet ─────────────────────────────────────────────────────
  const handleDeleteConfirmed = async (betId: number) => {
    if (!confirm('Remover esta aposta? Esta ação não pode ser desfeita.')) return
    setDeletingMap(prev => ({ ...prev, [betId]: true }))
    try {
      await betService.delete(betId)
      onBetDeleted(betId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover aposta.')
    } finally {
      setDeletingMap(prev => { const n = { ...prev }; delete n[betId]; return n })
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const openBets     = confirmedBets.filter(b => b.exit_odd === null)
  const closedBets   = confirmedBets.filter(b => b.exit_odd !== null)
  const pendingCount = pendingBets.length
  const openCount    = openBets.length
  const closedCount  = closedBets.length
  const totalStake   = pendingBets.reduce((sum, b) => sum + (Number(b.stake) || 0), 0)
  const hasAny       = pendingCount > 0 || openCount > 0 || closedCount > 0

  const posStyle: React.CSSProperties = leftPos !== null ? { left: leftPos } : { right: 16 }

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-4 z-50 select-none"
      style={{ ...posStyle, width: WIDGET_WIDTH }}
    >

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="rounded-t-2xl border border-b-0 border-pitch-600/60 bg-turf-900 dark:bg-turf-950 flex flex-col overflow-hidden max-h-[58vh]">

          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3 min-h-0">

            {/* Empty state */}
            {!hasAny && (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-turf-600">
                <CircleDollarSign className="w-7 h-7 opacity-40" strokeWidth={1.5} />
                <p className="text-xs">Nenhuma seleção ainda.</p>
              </div>
            )}

            {/* ── Pending bets ── */}
            {pendingCount > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-semibold text-turf-500 uppercase tracking-wider px-0.5">
                  Selecionadas
                </p>
                {pendingBets.map(bet => (
                  <PendingBetCard
                    key={bet.localId}
                    bet={bet}
                    methods={methods}
                    onChange={u => updatePending(bet.localId, u)}
                    onRemove={() => removePending(bet.localId)}
                  />
                ))}
              </div>
            )}

            {/* ── Open confirmed bets ── */}
            {openCount > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-semibold text-turf-500 uppercase tracking-wider px-0.5">
                  Em Aberto
                </p>
                {openBets.map(bet => (
                  <ConfirmedBetCard
                    key={bet.id}
                    bet={bet}
                    cashoutOdd={cashoutOdds[bet.id] ?? ''}
                    isCashingOut={cashingOut[bet.id] ?? false}
                    isDeleting={deletingMap[bet.id] ?? false}
                    onCashoutOddChange={v => setCashoutOdds(prev => ({ ...prev, [bet.id]: v }))}
                    onCashout={() => handleCashout(bet.id)}
                    onDelete={() => handleDeleteConfirmed(bet.id)}
                  />
                ))}
              </div>
            )}

            {/* ── Closed confirmed bets ── */}
            {closedCount > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-semibold text-turf-500 uppercase tracking-wider px-0.5">
                  Encerradas
                </p>
                {closedBets.map(bet => (
                  <ConfirmedBetCard
                    key={bet.id}
                    bet={bet}
                    cashoutOdd={cashoutOdds[bet.id] ?? ''}
                    isCashingOut={cashingOut[bet.id] ?? false}
                    isDeleting={deletingMap[bet.id] ?? false}
                    onCashoutOddChange={v => setCashoutOdds(prev => ({ ...prev, [bet.id]: v }))}
                    onCashout={() => handleCashout(bet.id)}
                    onDelete={() => handleDeleteConfirmed(bet.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {placeError && (
            <p className="text-[10px] text-red-400 px-3 py-1 border-t border-turf-800">
              {placeError}
            </p>
          )}

          {/* Bottom action bar (only when there are pending bets) */}
          {pendingCount > 0 && (
            <div className="flex gap-2 p-2 border-t border-turf-800 shrink-0">
              <button
                onClick={clearPending}
                className="flex-1 py-1.5 rounded-lg bg-turf-700 hover:bg-turf-600 text-turf-200 text-xs font-medium transition-colors"
              >
                Cancelar apostas
              </button>
              <button
                onClick={handlePlaceBets}
                disabled={isPlacing}
                className="flex-1 py-1.5 rounded-lg bg-pitch-600 hover:bg-pitch-700 text-white text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
              >
                {isPlacing && <Loader2 className="w-3 h-3 animate-spin" />}
                Colocar {pendingCount} aposta{pendingCount !== 1 ? 's' : ''}{' '}
                R${totalStake.toFixed(2).replace('.', ',')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Header / Handle ─────────────────────────────────────────────────── */}
      <div
        onMouseDown={handleMouseDown}
        onClick={handleHeaderClick}
        className={cn(
          'flex items-center gap-2.5 px-4 py-2.5',
          'bg-pitch-600 text-white',
          isOpen ? 'rounded-b-2xl' : 'rounded-2xl',
          'shadow-lg shadow-pitch-900/30 transition-all duration-150',
        )}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        role="button"
        aria-expanded={isOpen}
        aria-label="Painel de Apostas"
      >
        <LayoutGrid       className="w-4 h-4 opacity-70 shrink-0" />
        <CircleDollarSign className="w-4 h-4 opacity-70 shrink-0" />
        <span className="text-sm font-semibold flex-1 tracking-wide">Apostas</span>

        {/* Counters */}
        <div className="flex items-center gap-1">
          {pendingCount > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {pendingCount}
            </span>
          )}
          {openCount > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold leading-none">
              {openCount}
            </span>
          )}
          {closedCount > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-emerald-400 text-turf-900 text-[10px] font-bold leading-none">
              {closedCount}
            </span>
          )}
        </div>

        <ChevronUp
          className={cn('w-4 h-4 shrink-0 transition-transform duration-200 ml-0.5', isOpen && 'rotate-180')}
        />
      </div>
    </div>
  )
}