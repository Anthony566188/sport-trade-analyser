import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Plus, Zap, Target,
  Layers, Trash2, AlertCircle, CheckCircle, Edit2
} from 'lucide-react'

// Serviços extraídos
import { betService } from '../services/betService'
import { timelineService } from '../services/timelineService'
import { timelineEventService } from '../services/timelineEventService'
import { matchService } from '../services/matchService'
import { criterionService } from '../services/criterionService'
import { methodService } from '../services/methodService'

import { Spinner } from '../components/ui/Spinner'
import { TimelineControls } from '../components/timeline/TimelineControls'
import { CreateTimelinePainel } from '../components/timeline/CreateTimelinePainel'
import { useChronometer } from '../hooks/useChronometer'
import { useTimelineSort } from '../hooks/useTimelineSort'
import type { UnifiedTimelineItem } from '../hooks/useTimelineSort'
import { secondsToDisplay, matchTimeToDisplay } from '../utils/time'
import { cn } from '../utils/cn'
import {
  MatchPeriod,
  EVENT_TYPE_LABELS
} from '../types'
import type {
  Match, Timeline, TimelineEvent, EventType,
  Criterion, Method, BetType, Bet, 
  UpdateBetRequestPayload, BetRequestPayload, BetExitRequestPayload,
  TimelineRequestPayload, TimelineEventRequestPayload
} from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<EventType, string> = {
  YELLOW_CARD:          '🟨',
  RED_CARD:             '🟥',
  GOAL:                 '⚽',
  CORNER:               '🚩',
  FOUL_DEFENSIVE_HALF:  '🛡️',
  FOUL_ATTACKING_HALF:  '⚔️',
  ANNULLED_GOAL:        '❌',
  HIT_WOODWORK:         '🥅',
  GOALKEEPER_SAVE:      '🧤',
  PENALTY:              '🎯',
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TimelinePage: React.FC = () => {
  const { id }  = useParams<{ id: string }>()
  const location = useLocation()
  const matchId = Number(id)

  // ── Dados remotos ──
  const [match,    setMatch]    = useState<Match    | null>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [events,   setEvents]   = useState<TimelineEvent[]>([])
  const [bets,     setBets]     = useState<Record<number, Bet>>({}) // Cache local das apostas na timeline
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [methods,  setMethods]  = useState<Method[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // ── Cronômetro ──
  const chronometer = useChronometer()

  // ── Painel de novo evento ──
  const [showPanel,  setShowPanel]  = useState(false)
  const [eventMode,  setEventMode]  = useState<'event' | 'criterion' | 'bet'>('event')
  const [selEvent,   setSelEvent]   = useState<EventType | ''>('')
  const [selTeam,    setSelTeam]    = useState('')
  const [selCrit,    setSelCrit]    = useState<number | ''>('')
  const [addingEvt,  setAddingEvt]  = useState(false)
  const [panelError, setPanelError] = useState<string | null>(null)

  // ── Aposta (Criação) ──
  const [betMethodId, setBetMethodId] = useState<number | ''>('')
  const [betStake,    setBetStake]    = useState('')
  const [betEntryOdd, setBetEntryOdd] = useState('')
  const [betType,     setBetType]     = useState<BetType>('BACK')

  // ── Aposta (Edição) ──
  const [editingBet,  setEditingBet]  = useState<Bet | null>(null)
  const [editBetData, setEditBetData] = useState({ 
    id_method: '', stake: '', entry_odd: '', type: 'BACK' as BetType, exit_odd: '',
    exit_minute_second: null as number | null,
    exit_additional_minute_second: null as number | null 
  })

  // ── Aposta (Cashout) ──
  const [cashoutBet,      setCashoutBet]      = useState<Bet | null>(null)
  const [cashoutOddValue, setCashoutOddValue] = useState('')

  const sortedItems = useTimelineSort(events, Object.values(bets))

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [matchData, tlData] = await Promise.all([
          matchService.getById(matchId),
          timelineService.getByMatchId(matchId).catch(() => null),
        ])
        setMatch(matchData)

        const tl = tlData ?? null
        setTimeline(tl)

        if (tl) {
          const locationState = location.state as { autoStartTimeline?: boolean } | null
          const autoStart = locationState?.autoStartTimeline ?? false
          
          chronometer.initialize(tl.minute_second_started, autoStart)
          
          const [fetchedEvents, criteriaData, methodsData] = await Promise.all([
            timelineEventService.getByTimelineId(tl.id),
            criterionService.getAll(),
            methodService.getAll(),
          ])
          
          setEvents(fetchedEvents)
          setCriteria(criteriaData)
          setMethods(methodsData)

          const betIds = fetchedEvents.map(e => e.id_bet).filter((id): id is number => id != null)
          if (betIds.length > 0) {
            const betsData = await Promise.all(betIds.map(id => betService.getById(id).catch(() => null)))
            const newBets: Record<number, Bet> = {}
            betsData.forEach(b => { if (b) newBets[b.id] = b })
            setBets(newBets)
          }

        } else {
          const [criteriaData, methodsData] = await Promise.all([
            criterionService.getAll(),
            methodService.getAll(),
          ])
          setCriteria(criteriaData)
          setMethods(methodsData)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar timeline.')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  // ── Criar timeline (separado da partida) ──────────────────────────────────
  const handleCreateTimeline = useCallback(async (startSeconds: number) => {
    const payload: TimelineRequestPayload = {
      id_match: matchId,
      match_period_started: MatchPeriod.FIRST_HALF, // Placeholder
      minute_second_started: startSeconds,
      additional_minute_second_started: 0
    }

    const tl = await timelineService.create(payload)
    setTimeline(tl)
    chronometer.initialize(startSeconds, true)

    const fetchedEvents = await timelineEventService.getByTimelineId(tl.id)
    setEvents(fetchedEvents)
  }, [matchId, chronometer])

  // ── Encerrar timeline ─────────────────────────────────────────────────────
  const handleStopTimeline = useCallback(async () => {
    if (!timeline || !confirm('Encerrar a timeline? Esta ação não pode ser desfeita.')) return
    try {
      await timelineService.stop(timeline.id, {
        match_period: MatchPeriod.SECOND_HALF, // Placeholder (UX Pendente)
        minute_second_finished: chronometer.elapsed,
        additional_minute_second_finished: 0 
      })
      chronometer.pause()
      setTimeline(prev => prev
        ? { ...prev, minute_second_finished: chronometer.elapsed }
        : prev
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao encerrar.')
    }
  }, [timeline, chronometer])

  // ── Reset de campos do painel ao trocar de modo ───────────────────────────
  const handleSetEventMode = (mode: 'event' | 'criterion' | 'bet') => {
    setEventMode(mode)
    setPanelError(null)
    setSelEvent('')
    setSelCrit('')
    setBetMethodId('')
    setBetStake('')
    setBetEntryOdd('')
    setBetType('BACK')
  }

  // ── Registrar evento / critério / aposta ──────────────────────────────────
  const handleAddEvent = async () => {
    if (!timeline) return
    if (!selTeam && eventMode !== 'bet')  { setPanelError('Selecione o time.'); return }

    setAddingEvt(true)
    setPanelError(null)

    const minuteSecond = Math.min(chronometer.elapsed, 2700)
    const additionalMinuteSecond = chronometer.elapsed > 2700 ? chronometer.elapsed - 2700 : null
    const currentPeriod = MatchPeriod.FIRST_HALF // Placeholder para uso no novo backend (até os seletores UX existirem)

    try {
      let newEvent: TimelineEvent | null = null

      if (eventMode === 'bet') {
        if (!betMethodId)                             { setPanelError('Selecione o método.'); return }
        if (!betStake || Number(betStake) <= 0)       { setPanelError('Informe um stake válido.'); return }
        if (!betEntryOdd || Number(betEntryOdd) <= 1) { setPanelError('Informe uma odd válida (> 1).'); return }

        const betPayload: BetRequestPayload = {
          id_method:  Number(betMethodId),
          id_match:   matchId,
          stake:      Number(betStake),
          entry_odd:  Number(betEntryOdd),
          type:       betType,
          entry_period: currentPeriod,
          entry_minute_second: minuteSecond,
          entry_additional_minute_second: additionalMinuteSecond ?? 0,
        }
        
        const bet = await betService.create(betPayload)
        setBets(prev => ({ ...prev, [bet.id]: bet }))
        
        // NOTA ARQUITETURAL: A criação do evento de timeline vinculado foi removida para adequar à restrição do novo backend. 

      } else if (eventMode === 'event') {
        if (!selEvent) { setPanelError('Selecione o tipo de evento.'); return }

        const eventPayload: TimelineEventRequestPayload = {
          id_timeline: timeline.id,
          event: selEvent,
          id_criterion: null,
          match_period: currentPeriod,
          minute_second: minuteSecond,
          additional_minute_second: additionalMinuteSecond ?? 0,
          team: selTeam,
        }

        newEvent = await timelineEventService.create(eventPayload)

      } else if (eventMode === 'criterion') {
        if (!selCrit) { setPanelError('Selecione um critério.'); return }

        const criterionPayload: TimelineEventRequestPayload = {
          id_timeline: timeline.id,
          id_criterion: selCrit,
          event: null,
          match_period: currentPeriod,
          minute_second: minuteSecond,
          additional_minute_second: additionalMinuteSecond ?? 0,
          team: selTeam,
        }

        newEvent = await timelineEventService.create(criterionPayload)
      }

      if (newEvent) setEvents(prev => [newEvent!, ...prev])

      setShowPanel(false)
      handleSetEventMode('event')
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : 'Erro ao registrar.')
    } finally {
      setAddingEvt(false)
    }
  }

  // ── Deletar evento / aposta ───────────────────────────────────────────────
  const handleDeleteEvent = async (evtId: number) => {
    if (!confirm('Remover este evento? Esta ação não pode ser desfeita.')) return
    try {
      await timelineEventService.delete(evtId)
      setEvents(prev => prev.filter(e => e.id !== evtId))
    } catch (e) {
     alert(e instanceof Error ? e.message : 'Erro ao remover evento.')
    }
  }

  const handleDeleteBet = async (betId: number) => {
    if (!confirm('Remover esta aposta? Esta ação não pode ser desfeita.')) return
    try {
      await betService.delete(betId)
      setBets(prev => {
        const next = { ...prev }
        delete next[betId]
        return next
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover aposta.')
    }
  }

  // ── Editar Aposta ─────────────────────────────────────────────────────────
  const openEditBet = (bet: Bet) => {
    setEditingBet(bet)
    setEditBetData({
      id_method: bet.id_method.toString(),
      stake: bet.stake.toString(),
      entry_odd: bet.entry_odd.toString(),
      type: bet.type,
      exit_odd: bet.exit_odd !== null ? bet.exit_odd.toString() : '',
      exit_minute_second: bet.exit_minute_second ?? null,
      exit_additional_minute_second: bet.exit_additional_minute_second ?? null
    })
  }

  const handleUpdateBet = async () => {
    if (!editingBet) return
    try {
      const payload: UpdateBetRequestPayload = {
        id_method: Number(editBetData.id_method),
        id_match: matchId,
        stake: Number(editBetData.stake),
        entry_odd: Number(editBetData.entry_odd),
        type: editBetData.type,
        exit_odd: editBetData.exit_odd ? Number(editBetData.exit_odd) : null,
        entry_period: editingBet.entry_period || MatchPeriod.FIRST_HALF,
        entry_minute_second: editingBet.entry_minute_second || 0,
        entry_additional_minute_second: editingBet.entry_additional_minute_second || 0,
        exit_period: editingBet.exit_period ?? null,
        exit_minute_second: editBetData.exit_minute_second ?? null,
        exit_additional_minute_second: editBetData.exit_additional_minute_second ?? 0
      }
      const updated = await betService.update(editingBet.id, payload)
      setBets(prev => ({ ...prev, [updated.id]: updated }))
      setEditingBet(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar aposta.')
    }
  }

  // ── Cashout de Aposta ─────────────────────────────────────────────────────
  const openCashout = (bet: Bet) => {
    setCashoutBet(bet)
    setCashoutOddValue('')
  }

  const handleCashout = async () => {
    if (!cashoutBet || !cashoutOddValue) return
    try {
      const odd = Number(cashoutOddValue)
      if (odd <= 1) { alert('Odd deve ser maior que 1'); return }

      const elapsed = chronometer.elapsed
      const minuteSecond = Math.min(elapsed, 2700)
      const additional = elapsed > 2700 ? elapsed - 2700 : null

      const payload: BetExitRequestPayload = {
        exit_odd: odd,
        exit_period: MatchPeriod.FIRST_HALF, // Placeholder (UX Pendente)
        exit_minute_second: minuteSecond,
        exit_additional_minute_second: additional ?? 0
      }

      const updated = await betService.exit(cashoutBet.id, payload)
      setBets(prev => ({ ...prev, [updated.id]: updated }))
      setCashoutBet(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao encerrar aposta.')
    }
  }

  // ── Labels do feed ────────────────────────────────────────────────────────
  const getItemLabel = (item: UnifiedTimelineItem): string => {
    if (item.type === 'EVENT') {
      const evt = item.payload
      if (evt.event)        return EVENT_TYPE_LABELS[evt.event]
      if (evt.id_criterion) return criteria.find(c => c.id === evt.id_criterion)?.title ?? 'Critério'
      return 'Evento'
    } else {
      const b = item.payload
      const method = methods.find(m => m.id === b.id_method)
      return method ? `Aposta: ${method.name}` : `Aposta #${b.id}`
    }
  }

  const getItemIcon = (item: UnifiedTimelineItem): string => {
    if (item.type === 'EVENT') {
      const evt = item.payload
      if (evt.event)        return EVENT_ICONS[evt.event] ?? '📌'
      if (evt.id_criterion) return '🎯'
      return '📌'
    }
    return '💵'
  }

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-turf-400">
        <Spinner />
        <span className="text-sm">Carregando timeline...</span>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="flex items-center gap-2.5 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
        <AlertCircle className="w-4 h-4" /> {error ?? 'Partida não encontrada.'}
      </div>
    )
  }

  const isClosed = timeline?.minute_second_finished != null

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="p-1.5 rounded-lg hover:bg-turf-100 dark:hover:bg-turf-800 transition-colors text-turf-500 dark:text-turf-400"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-turf-900 dark:text-turf-100 truncate">
              {match.team_home} × {match.team_away}
            </h1>
            {match.is_friendly
              ? <span className="badge bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">Amistoso</span>
              : <span className="badge bg-pitch-100 dark:bg-pitch-950/30 text-pitch-700 dark:text-pitch-400">{match.championship}</span>
            }
          </div>
          <p className="text-xs text-turf-500 dark:text-turf-400 mt-0.5">{match.date}</p>
        </div>
      </div>

      {/* ── Cronômetro / Criar timeline ── */}
      {!timeline ? (
        <CreateTimelinePainel onConfirm={handleCreateTimeline} />
      ) : isClosed ? (
        <div className={cn(
          'rounded-2xl p-5 flex items-center gap-4 border',
          'bg-turf-50 dark:bg-turf-800/40 border-turf-200 dark:border-turf-700',
        )}>
          <span className="font-mono text-xl sm:text-2xl font-bold text-turf-500 dark:text-turf-400 tracking-tight">
            {secondsToDisplay(chronometer.elapsed)}
          </span>
          <span className="badge bg-turf-200 dark:bg-turf-700 text-turf-500 dark:text-turf-400">
            Encerrada
          </span>
        </div>
      ) : (
        <TimelineControls
          elapsed={chronometer.elapsed}
          status={chronometer.status}
          onTogglePlayPause={chronometer.togglePlayPause}
          onSeek={chronometer.seek}
          onSetTime={chronometer.setTime}
          onStop={handleStopTimeline}
        />
      )}

      {/* ── Registrar evento ── */}
      {timeline && !isClosed && (
        <div>
          <button
            onClick={() => setShowPanel(p => !p)}
            aria-expanded={showPanel}
            aria-controls="event-panel"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-150',
              showPanel
                ? 'border-pitch-500 bg-pitch-50 dark:bg-pitch-950/20 text-pitch-700 dark:text-pitch-400'
                : 'border-turf-200 dark:border-turf-700 text-turf-600 dark:text-turf-300 hover:border-pitch-400',
            )}
          >
            <Plus className="w-4 h-4" />
            Registrar Evento
          </button>

          {showPanel && (
            <div
              id="event-panel"
              role="region"
              aria-label="Painel de registro de evento"
              className="mt-3 p-4 rounded-xl border border-turf-200 dark:border-turf-700 bg-white dark:bg-turf-800/60 space-y-4"
            >
              {/* Seletor de modo */}
              <div className="flex gap-1" role="tablist" aria-label="Tipo de registro">
                {(
                  [
                    ['event',     'Evento',   <Zap    key="z" className="w-3 h-3" />],
                    ['criterion', 'Critério', <Target key="t" className="w-3 h-3" />],
                    ['bet',       'Aposta',   <Layers key="l" className="w-3 h-3" />],
                  ] as const
                ).map(([mode, label, icon]) => (
                  <button
                    key={mode}
                    role="tab"
                    aria-selected={eventMode === mode}
                    onClick={() => handleSetEventMode(mode)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      eventMode === mode
                        ? 'bg-pitch-600 text-white'
                        : 'bg-turf-100 dark:bg-turf-700 text-turf-500 dark:text-turf-300 hover:bg-turf-200 dark:hover:bg-turf-600',
                    )}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Seleção de Time */}
              {eventMode !== 'bet' && (
                <div>
                  <label className="field-label" htmlFor="sel-team">Time</label>
                  <select
                    id="sel-team"
                    value={selTeam}
                    onChange={e => setSelTeam(e.target.value)}
                    className="field-select"
                  >
                    <option value="">Selecione...</option>
                    <option value={match.team_home}>{match.team_home}</option>
                    <option value={match.team_away}>{match.team_away}</option>
                  </select>
                </div>
              )}

              {/* Modo Evento */}
              {eventMode === 'event' && (
                <div>
                  <label className="field-label">Tipo de Evento</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="group" aria-label="Tipos de evento">
                    {(Object.keys(EVENT_ICONS) as EventType[]).map(evt => (
                      <button
                        key={evt}
                        role="radio"
                        aria-checked={selEvent === evt}
                        onClick={() => setSelEvent(evt)}
                        className={cn(
                          'flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium border transition-colors',
                          selEvent === evt
                            ? 'border-pitch-500 bg-pitch-50 dark:bg-pitch-950/30 text-pitch-700 dark:text-pitch-300'
                            : 'border-turf-200 dark:border-turf-700 text-turf-500 dark:text-turf-400 hover:border-turf-300',
                        )}
                      >
                        <span className="text-base">{EVENT_ICONS[evt]}</span>
                        {EVENT_TYPE_LABELS[evt]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modo Critério */}
              {eventMode === 'criterion' && (
                <div>
                  <label className="field-label" htmlFor="sel-criterion">Critério</label>
                  {criteria.length === 0 ? (
                    <p className="text-xs text-turf-400 dark:text-turf-500 py-2">
                      Nenhum critério cadastrado.{' '}
                      <Link to="/criteria" className="text-pitch-600 dark:text-pitch-400 underline">Criar critério →</Link>
                    </p>
                  ) : (
                    <select
                      id="sel-criterion"
                      value={selCrit}
                      onChange={e => setSelCrit(e.target.value ? Number(e.target.value) : '')}
                      className="field-select"
                    >
                      <option value="">Selecione um critério...</option>
                      {criteria.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Modo Aposta */}
              {eventMode === 'bet' && (
                <div className="space-y-3">
                  <div>
                    <label className="field-label" htmlFor="sel-method">Método</label>
                    {methods.length === 0 ? (
                      <p className="text-xs text-turf-400 dark:text-turf-500 py-2">
                        Nenhum método cadastrado.{' '}
                        <Link to="/settings" className="text-pitch-600 dark:text-pitch-400 underline">Criar método →</Link>
                      </p>
                    ) : (
                      <select
                        id="sel-method"
                        value={betMethodId}
                        onChange={e => setBetMethodId(e.target.value ? Number(e.target.value) : '')}
                        className="field-select"
                      >
                        <option value="">Selecione o método...</option>
                        {methods.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="field-label">Tipo</label>
                    <div className="flex gap-2">
                      {(['BACK', 'LAY'] as BetType[]).map(t => (
                        <button
                          key={t}
                          aria-pressed={betType === t}
                          onClick={() => setBetType(t)}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-colors',
                            betType === t
                              ? t === 'BACK'
                                ? 'border-pitch-500 bg-pitch-50 dark:bg-pitch-950/30 text-pitch-700 dark:text-pitch-300'
                                : 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                              : 'border-turf-200 dark:border-turf-700 text-turf-500 dark:text-turf-400 hover:border-turf-300',
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label" htmlFor="bet-stake">Stake (R$)</label>
                      <input
                        id="bet-stake" type="number" min="0.01" step="0.01" placeholder="Ex: 10.00"
                        value={betStake} onChange={e => setBetStake(e.target.value)}
                        className="field-select"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="bet-odd">Odd de Entrada</label>
                      <input
                        id="bet-odd" type="number" min="1.01" step="0.01" placeholder="Ex: 1.85"
                        value={betEntryOdd} onChange={e => setBetEntryOdd(e.target.value)}
                        className="field-select"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Erro do painel */}
              {panelError && (
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {panelError}
                </p>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <button
                  onClick={handleAddEvent} disabled={addingEvt}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-pitch-600 hover:bg-pitch-700 text-white transition-colors disabled:opacity-50"
                >
                  {addingEvt && <Spinner size="sm" className="border-white border-t-transparent" />}
                  Registrar às {secondsToDisplay(chronometer.elapsed)}
                </button>
                <button
                  onClick={() => { setShowPanel(false); setPanelError(null) }}
                  className="px-3 py-2 rounded-lg text-sm text-turf-500 hover:bg-turf-100 dark:hover:bg-turf-700 transition-colors"
                >Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Feed de eventos ── */}
      {sortedItems.length > 0 ? (
        <ul className="space-y-3" aria-label="Eventos da timeline">
          {sortedItems.map(item => {
            const isEvent = item.type === 'EVENT'
            const evt = isEvent ? item.payload as TimelineEvent : null
            const betInfo = !isEvent ? item.payload as Bet : null

            return (
              <li
                key={item.sortId}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 py-3 px-4 rounded-xl border border-turf-100 dark:border-turf-800 bg-white dark:bg-turf-800/40 hover:border-turf-200 dark:hover:border-turf-700 transition-colors"
              >
                <span className="font-mono text-[10px] sm:text-xs text-turf-400 dark:text-turf-500 min-w-[120px] shrink-0">
                  {matchTimeToDisplay({
                    period: item.period,
                    minute_second: item.minute,
                    additional_minute_second: item.additional

                  })}
                </span>
                
                <span className="text-lg shrink-0 hidden sm:block" aria-hidden>{getItemIcon(item)}</span>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-turf-900 dark:text-turf-100 flex items-center gap-2">
                      <span className="sm:hidden">{getItemIcon(item)}</span>
                      {getItemLabel(item)}
                      {betInfo && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                          betInfo.type === 'BACK' ? 'bg-pitch-100 text-pitch-700 dark:bg-pitch-900 dark:text-pitch-400' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400'
                        )}>{betInfo.type}</span>
                      )}
                      {betInfo?.exit_odd && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-turf-200 text-turf-700 dark:bg-turf-700 dark:text-turf-300">
                          Encerrada
                        </span>
                      )}
                    </p>
                    {/* Botões de Ação para Apostas */}
                    <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {betInfo && betInfo.exit_odd === null && (
                        <button onClick={() => openCashout(betInfo)} title="Realizar Cashout" className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-pitch-50 text-pitch-600 hover:bg-pitch-100 dark:bg-pitch-900/50 dark:hover:bg-pitch-900">
                          <CheckCircle className="w-3.5 h-3.5" /> Cashout
                        </button>
                      )}
                      {betInfo && (
                        <button onClick={() => openEditBet(betInfo)} title="Editar Aposta" className="p-1 text-turf-400 hover:text-blue-500 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {evt && (
                        <button onClick={() => handleDeleteEvent(evt.id)} title="Remover Evento" className="p-1 text-turf-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {betInfo && (
                        <button onClick={() => handleDeleteBet(betInfo.id)} title="Remover Aposta" className="p-1 text-turf-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {evt && <p className="text-xs text-turf-400 dark:text-turf-500 mb-1">{evt.team}</p>}
                  
                  {/* Detalhes se for uma Aposta */}
                  {betInfo && (
                    <div className="mt-2 text-xs grid grid-cols-2 sm:flex sm:gap-6 gap-2 text-turf-600 dark:text-turf-400 bg-turf-50 dark:bg-turf-900/30 p-2 rounded-lg border border-turf-100 dark:border-turf-800">
                      <div><span className="font-semibold block text-turf-400 text-[10px] uppercase">Stake</span>R$ {betInfo.stake}</div>
                      <div><span className="font-semibold block text-turf-400 text-[10px] uppercase">Odd In</span>{betInfo.entry_odd}</div>
                      {betInfo.exit_odd && (
                        <>
                          <div><span className="font-semibold block text-turf-400 text-[10px] uppercase">Odd Out</span>{betInfo.exit_odd}</div>

                          {/* EXIBINDO O MOMENTO DA SAÍDA DA APOSTA */}
                          {betInfo.exit_period != null && betInfo.exit_minute_second != null && (
                            <div><span className="font-semibold block text-turf-400 text-[10px] uppercase">Saída aos</span>{matchTimeToDisplay({
                              period: betInfo.exit_period,
                              minute_second: betInfo.exit_minute_second,
                              additional_minute_second: betInfo.exit_additional_minute_second
                            })}</div>
                          )}
 
                          <div>
                            <span className="font-semibold block text-turf-400 text-[10px] uppercase">Lucro</span>
                            <span className={betInfo.profit_in_money && betInfo.profit_in_money >= 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                              R$ {betInfo.profit_in_money?.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : timeline ? (
        <div className="py-12 text-center text-sm text-turf-400 dark:text-turf-500">
          Nenhum evento registrado ainda.
        </div>
      ) : null}

      {/* ── MODAIS SOBREPOSTOS ── */}
      
      {/* Modal Cashout */}
      {cashoutBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-turf-900 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-turf-900 dark:text-turf-100">Encerrar Aposta (Cashout)</h3>
            <p className="text-sm text-turf-500 dark:text-turf-400">Aposta #{cashoutBet.id} — Stake R$ {cashoutBet.stake}</p>
            <div>
              <label className="field-label">Odd de Saída</label>
              <input type="number" step="0.01" min="1.01" value={cashoutOddValue} onChange={e => setCashoutOddValue(e.target.value)} className="field-select" autoFocus />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setCashoutBet(null)} className="px-4 py-2 text-sm text-turf-600 hover:bg-turf-100 dark:text-turf-400 rounded-lg">Cancelar</button>
              <button onClick={handleCashout} className="px-4 py-2 text-sm bg-pitch-600 hover:bg-pitch-700 text-white rounded-lg font-medium">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Aposta */}
      {editingBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-turf-900 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-turf-900 dark:text-turf-100">Editar Aposta #{editingBet.id}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="field-label">Método</label>
                <select value={editBetData.id_method} onChange={e => setEditBetData(d => ({ ...d, id_method: e.target.value }))} className="field-select">
                  <option value="">Selecione...</option>
                  {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label className="field-label">Tipo</label>
                <div className="flex gap-2">
                  {(['BACK', 'LAY'] as BetType[]).map(t => (
                    <button
                      key={t} onClick={() => setEditBetData(d => ({ ...d, type: t }))}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-colors',
                        editBetData.type === t ? (t === 'BACK' ? 'border-pitch-500 bg-pitch-50 text-pitch-700' : 'border-red-400 bg-red-50 text-red-600') : 'border-turf-200 text-turf-500'
                      )}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Stake (R$)</label>
                  <input type="number" step="0.01" min="0.01" value={editBetData.stake} onChange={e => setEditBetData(d => ({ ...d, stake: e.target.value }))} className="field-select" />
                </div>
                <div>
                  <label className="field-label">Odd In</label>
                  <input type="number" step="0.01" min="1.01" value={editBetData.entry_odd} onChange={e => setEditBetData(d => ({ ...d, entry_odd: e.target.value }))} className="field-select" />
                </div>
              </div>

              {/* Só exibe Exit Odd se ela já estava definida antes (já houve cashout) */}
              {editingBet.exit_odd !== null && (
                <div>
                  <label className="field-label">Odd Out (Cashout)</label>
                  <input type="number" step="0.01" min="1.01" value={editBetData.exit_odd} onChange={e => setEditBetData(d => ({ ...d, exit_odd: e.target.value }))} className="field-select" />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button onClick={() => setEditingBet(null)} className="px-4 py-2 text-sm text-turf-600 hover:bg-turf-100 dark:text-turf-400 rounded-lg">Cancelar</button>
              <button onClick={handleUpdateBet} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}