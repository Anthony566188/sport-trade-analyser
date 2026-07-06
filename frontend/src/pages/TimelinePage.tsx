import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Plus, Zap, Target, Trash2, AlertCircle
} from 'lucide-react'

// Serviços extraídos
import { timelineService } from '../services/timelineService'
import { timelineEventService } from '../services/timelineEventService'
import { matchService } from '../services/matchService'
import { criterionService } from '../services/criterionService'
import { methodService } from '../services/methodService'
import { betService } from '../services/betService'

import { Spinner } from '../components/ui/Spinner'
import { TimelineControls } from '../components/timeline/TimelineControls'
import { CreateTimelinePainel } from '../components/timeline/CreateTimelinePainel'
import { TimeEditor } from '../components/timeline/TimeEditor'
import { QuickEventSelector } from '../components/timeline/QuickEventSelector'
import { BetWidget } from '../components/timeline/BetWidget'
import type { PendingBet } from '../components/timeline/BetWidget'
import { useChronometer } from '../hooks/useChronometer'
import { useTimelineSort } from '../hooks/useTimelineSort'
import type { UnifiedTimelineItem } from '../hooks/useTimelineSort'
import { matchTimeToDisplay, formatChronometerTime } from '../utils/time'
import { cn } from '../utils/cn'
import {
  MatchPeriod,
  EVENT_TYPE_LABELS
} from '../types'
import type {
  Match, Timeline, TimelineEvent, EventType,
  Criterion, Method, BetType, Bet, 
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
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([])  // Apostas ainda não confirmadas
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [methods,  setMethods]  = useState<Method[]>([])
  const [loading,        setLoading]        = useState(true)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // ── Cronômetro ──
  const chronometer = useChronometer()

  // ── Painel de novo evento ──
  const [showPanel,  setShowPanel]  = useState(false)
  const [eventMode,  setEventMode]  = useState<'event' | 'criterion'>('event')
  const [selEvent,   setSelEvent]   = useState<EventType | ''>('')
  const [selTeam,    setSelTeam]    = useState('')
  const [selCrit,    setSelCrit]    = useState<number | ''>('')
  const [addingEvt,  setAddingEvt]  = useState(false)
  const [panelError, setPanelError] = useState<string | null>(null)

  // Unificamos agora apenas os eventos (as apostas não aparecem mais no feed linear)
  const sortedItems = useTimelineSort(events, [])

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [matchData, tlData, fetchedBets] = await Promise.all([
          matchService.getById(matchId),
          timelineService.getByMatchId(matchId).catch(() => null),
          // Traz todas as apostas já atreladas a esta partida. 
          // O .catch evita quebrar a tela se houver erro
          betService.getByMatchId(matchId).catch(() => []), 
        ])
        setMatch(matchData)

        const tl = tlData ?? null
        setTimeline(tl)

        // Populando cache de apostas a partir do novo endpoint
        const newBets: Record<number, Bet> = {};
        fetchedBets.forEach((b: Bet) => { newBets[b.id] = b });
        setBets(newBets);

        if (tl) {
          const locationState = location.state as { autoStartTimeline?: boolean } | null
          const autoStart = locationState?.autoStartTimeline ?? false

          const totalElapsed = tl.minute_second_started + (tl.additional_minute_second_started || 0)
          chronometer.initialize(totalElapsed, autoStart)
          chronometer.setMatchPeriod(tl.match_period_started)
          
          const [fetchedEvents, criteriaData, methodsData] = await Promise.all([
            timelineEventService.getByTimelineId(tl.id),
            criterionService.getAll(),
            methodService.getAll(),
          ])
          
          setEvents(fetchedEvents)
          setCriteria(criteriaData)
          setMethods(methodsData)

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

  // ── Adicionar aposta pendente (via botões Back/Lay) ───────────────────────
  const addPendingBet = useCallback((team: string, type: BetType) => {
    const newBet: PendingBet = {
      localId:  `${Date.now()}-${Math.random()}`,
      team,
      type,
      odd:      '',
      stake:    '',
      methodId: '',
    }
    setPendingBets(prev => [...prev, newBet])
  }, [])

  // ── Criar timeline (separado da partida) ──────────────────────────────────
  const handleCreateTimeline = useCallback(async (
    baseSeconds: number,
    additionalSeconds: number,
    period: MatchPeriod,
  ) => {
    const payload: TimelineRequestPayload = {
      id_match:                          matchId,
      match_period_started:              period,
      minute_second_started:             baseSeconds,
      additional_minute_second_started:  additionalSeconds,
    }

    const tl = await timelineService.create(payload)
    setTimeline(tl)
    // Inicializa o cronômetro com o elapsed total e o período inferido
    chronometer.initialize(baseSeconds + additionalSeconds, true)
    chronometer.setMatchPeriod(period)

    const fetchedEvents = await timelineEventService.getByTimelineId(tl.id)
    setEvents(fetchedEvents)
  }, [matchId, chronometer])

  // ── Encerrar timeline — abre painel de confirmação ───────────────────────
  const handleStopTimeline = useCallback(() => {
    if (!timeline) return
    setShowStopConfirm(true)
  }, [timeline])

  // ── Confirma o encerramento com o tempo revisado pelo usuário ─────────────
  const handleConfirmStop = useCallback(async (
    baseSeconds: number,
    additionalSeconds: number,
    period: MatchPeriod,
  ) => {
    if (!timeline) return
    try {
      await timelineService.stop(timeline.id, {
        match_period_finished:             period,
        minute_second_finished:            baseSeconds,
        additional_minute_second_finished: additionalSeconds,
      })
      chronometer.pause()
      setTimeline(prev => prev
        ? {
            ...prev,
            match_period_finished: period,
            minute_second_finished: baseSeconds,
            additional_minute_second_finished: additionalSeconds
          }
        : prev
      )
      setShowStopConfirm(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao encerrar timeline.')
    }
  }, [timeline, chronometer])

  // ── Reset de campos do painel ao trocar de modo ───────────────────────────
  const handleSetEventMode = (mode: 'event' | 'criterion') => {
    setEventMode(mode)
    setPanelError(null)
    setSelEvent('')
    setSelCrit('')
  }

  // ── Núcleo de persistência: recebe tudo explicitamente ───────────────────
  const handleAutoRegister = async (
    team:        string,
    event:       EventType | null,
    criterionId: number | null,
  ) => {
    if (!timeline) return

    setAddingEvt(true)
    setPanelError(null)

    const payload: TimelineEventRequestPayload = {
      id_timeline:              timeline.id,
      event:                    event,
      id_criterion:             criterionId,
      match_period:             chronometer.period,
      minute_second:            chronometer.minuteSecond,
      additional_minute_second: chronometer.additionalMinuteSecond ?? 0,
      team,
    }

    try {
      const newEvent = await timelineEventService.create(payload)
      setEvents(prev => [newEvent, ...prev])
      setShowPanel(false)
      handleSetEventMode('event')
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : 'Erro ao registrar.')
    } finally {
      setAddingEvt(false)
    }
  }

  // ── Registrar evento / critério (fallback manual) ─────────────────────────
  const handleAddEvent = async () => {
    if (!selTeam) { setPanelError('Selecione o time.'); return }
    if (eventMode === 'event') {
      if (!selEvent) { setPanelError('Selecione o tipo de evento.'); return }
      await handleAutoRegister(selTeam, selEvent, null)
    } else {
      if (!selCrit) { setPanelError('Selecione um critério.'); return }
      await handleAutoRegister(selTeam, null, Number(selCrit))
    }
  }

  // ── Deletar evento ────────────────────────────────────────────────────────
  const handleDeleteEvent = async (evtId: number) => {
    if (!confirm('Remover este evento? Esta ação não pode ser desfeita.')) return
    try {
      await timelineEventService.delete(evtId)
      setEvents(prev => prev.filter(e => e.id !== evtId))
    } catch (e) {
     alert(e instanceof Error ? e.message : 'Erro ao remover evento.')
    }
  }

  // ── Labels do feed ────────────────────────────────────────────────────────
  const getItemLabel = (item: UnifiedTimelineItem): string => {
    if (item.type === 'EVENT') {
      const evt = item.payload as TimelineEvent
      if (evt.event)        return EVENT_TYPE_LABELS[evt.event]
      if (evt.id_criterion) return criteria.find(c => c.id === evt.id_criterion)?.title ?? 'Critério'
      return 'Evento'
    }
    return ''
  }

  const getItemIcon = (item: UnifiedTimelineItem): string => {
    if (item.type === 'EVENT') {
      const evt = item.payload as TimelineEvent
      if (evt.event)        return EVENT_ICONS[evt.event] ?? '📌'
      if (evt.id_criterion) return '🎯'
      return '📌'
    }
    return ''
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

      {/* ── Painel de Odds de Match (Estático) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
        {/* Time da Casa */}
        <div className="flex-1 flex items-center justify-between p-3 rounded-xl border border-turf-200 dark:border-turf-700 bg-white dark:bg-turf-800/40">
          <span className="font-semibold text-sm sm:text-base text-turf-900 dark:text-turf-100 truncate mr-2">
            {match.team_home}
          </span>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => addPendingBet(match.team_home, 'BACK')} className="px-4 py-1.5 rounded-lg text-sm font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors">
              Back
            </button>
            <button type="button" onClick={() => addPendingBet(match.team_home, 'LAY')} className="px-4 py-1.5 rounded-lg text-sm font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
              Lay
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-between p-3 rounded-xl border border-turf-200 dark:border-turf-700 bg-white dark:bg-turf-800/40">
          <span className="font-semibold text-sm sm:text-base text-turf-900 dark:text-turf-100 truncate mr-2">
            {match.team_away}
          </span>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => addPendingBet(match.team_away, 'BACK')} className="px-4 py-1.5 rounded-lg text-sm font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors">
              Back
            </button>
            <button type="button" onClick={() => addPendingBet(match.team_away, 'LAY')} className="px-4 py-1.5 rounded-lg text-sm font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
              Lay
            </button>
          </div>
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
            {formatChronometerTime(chronometer.elapsed, chronometer.period)}
          </span>
          <span className="badge bg-turf-200 dark:bg-turf-700 text-turf-500 dark:text-turf-400">
            Encerrada
          </span>
        </div>
      ) : (
        <TimelineControls
          elapsed={chronometer.elapsed}
          status={chronometer.status}
          period={chronometer.period}
          onTogglePlayPause={chronometer.togglePlayPause}
          onSeek={chronometer.seek}
          onSetTime={chronometer.setTime}
          onChangePeriod={chronometer.setMatchPeriod}
          onPhaseTransition={chronometer.transitionPeriod}
          onStop={handleStopTimeline}
        />
      )}

      {/* Stop confirmation panel */}
      {showStopConfirm && !isClosed && (
        <div className={cn(
          'rounded-2xl p-5 border',
          'border-red-200 dark:border-red-900/60',
          'bg-red-50 dark:bg-red-950/10',
        )}>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
            Encerrar Timeline
          </p>
          <p className="text-xs text-red-500 dark:text-red-500 mb-4">
            Confirme o tempo final da partida. Voce pode ajusta-lo antes de encerrar.
          </p>
          <TimeEditor
            variant="block"
            initialBaseSeconds={chronometer.minuteSecond}
            initialAdditionalSeconds={chronometer.additionalMinuteSecond}
            onConfirm={({ baseSeconds, additionalSeconds, period }) =>
              handleConfirmStop(baseSeconds, additionalSeconds, period)
            }
            onCancel={() => setShowStopConfirm(false)}
            confirmLabel="Confirmar Encerramento"
            autoFocus
          />
        </div>
      )}

      {/* ── Registro rápido de eventos ── */}
      {timeline && !isClosed && match && (
        <QuickEventSelector
          timelineId={timeline.id}
          teamHome={match.team_home}
          teamAway={match.team_away}
          currentPeriod={chronometer.period}
          minuteSecond={chronometer.minuteSecond}
          additionalMinuteSecond={chronometer.additionalMinuteSecond}
          onEventCreated={newEvent => setEvents(prev => [newEvent, ...prev])}
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
              <div>
                <label className="field-label">Time</label>
                <div className="flex gap-2">
                  {[match.team_home, match.team_away].map(team => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => setSelTeam(team)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors truncate',
                        selTeam === team
                          ? 'border-pitch-500 bg-pitch-50 dark:bg-pitch-950/30 text-pitch-700 dark:text-pitch-300'
                          : 'border-turf-200 dark:border-turf-700 text-turf-600 dark:text-turf-300 hover:border-turf-400 dark:hover:border-turf-500',
                      )}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modo Evento */}
              {eventMode === 'event' && (
                <div>
                  <label className="field-label">
                    Tipo de Evento
                    {!selTeam && (
                      <span className="ml-2 text-[10px] font-normal text-amber-500 dark:text-amber-400 normal-case">
                        — selecione um time primeiro
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="group" aria-label="Tipos de evento">
                    {(Object.keys(EVENT_ICONS) as EventType[]).map(evt => (
                      <button
                        key={evt}
                        type="button"
                        role="radio"
                        aria-checked={selEvent === evt}
                        disabled={addingEvt}
                        onClick={() => {
                          setSelEvent(evt)
                          if (selTeam) {
                            handleAutoRegister(selTeam, evt, null)
                          } else {
                            setPanelError('Selecione o time antes de registrar.')
                          }
                        }}
                        className={cn(
                          'flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium border transition-colors',
                          selEvent === evt
                            ? 'border-pitch-500 bg-pitch-50 dark:bg-pitch-950/30 text-pitch-700 dark:text-pitch-300'
                            : 'border-turf-200 dark:border-turf-700 text-turf-500 dark:text-turf-400 hover:border-turf-300',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
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
                  <label className="field-label" htmlFor="sel-criterion">
                    Critério
                    {!selTeam && (
                      <span className="ml-2 text-[10px] font-normal text-amber-500 dark:text-amber-400 normal-case">
                        — selecione um time primeiro
                      </span>
                    )}
                  </label>
                  {criteria.length === 0 ? (
                    <p className="text-xs text-turf-400 dark:text-turf-500 py-2">
                      Nenhum critério cadastrado.{' '}
                      <Link to="/criteria" className="text-pitch-600 dark:text-pitch-400 underline">Criar critério →</Link>
                    </p>
                  ) : (
                    <select
                      id="sel-criterion"
                      value={selCrit}
                      disabled={addingEvt}
                      onChange={e => {
                        const id = e.target.value ? Number(e.target.value) : ''
                        setSelCrit(id)
                        if (id && selTeam) {
                          handleAutoRegister(selTeam, null, Number(id))
                        } else if (id && !selTeam) {
                          setPanelError('Selecione o time antes de registrar.')
                        }
                      }}
                      className="field-select disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecione um critério...</option>
                      {criteria.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  )}
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
                  Registrar às {formatChronometerTime(chronometer.elapsed, chronometer.period)}
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
            const evt = item.payload as TimelineEvent

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
                    </p>
                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {evt && (
                        <button onClick={() => handleDeleteEvent(evt.id)} title="Remover Evento" className="p-1 text-turf-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {evt && <p className="text-xs text-turf-400 dark:text-turf-500 mb-1">{evt.team}</p>}
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

      {/* ── Widget flutuante de Apostas ── */}
      <BetWidget
        matchId={matchId}
        methods={methods}
        chronometer={{
          period:                  chronometer.period,
          minuteSecond:            chronometer.minuteSecond,
          additionalMinuteSecond:  chronometer.additionalMinuteSecond,
        }}
        pendingBets={pendingBets}
        setPendingBets={setPendingBets}
        confirmedBets={Object.values(bets)}
        onBetCreated={bet => setBets(prev => ({ ...prev, [bet.id]: bet }))}
        onBetDeleted={betId => setBets(prev => { const n = { ...prev }; delete n[betId]; return n })}
        onBetExited={bet => setBets(prev => ({ ...prev, [bet.id]: bet }))}
      />

    </div>
  )
}