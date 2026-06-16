import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Zap, Target,
  Layers, Trash2, AlertCircle,
} from 'lucide-react'
import api from '../services/api'
import { betService } from '../services/betService'
import { Spinner } from '../components/ui/Spinner'
import { TimelineControls } from '../components/timeline/TimelineControls'
import { CreateTimelinePainel } from '../components/timeline/CreateTimelinePainel'
import { useChronometer } from '../hooks/useChronometer'
import { secondsToDisplay } from '../utils/time'
import { cn } from '../utils/cn'
import type {
  Match, Timeline, TimelineEvent, EventType,
  Criterion, Method, BetType,
} from '../types'
import { EVENT_TYPE_LABELS } from '../types'

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
  const matchId = Number(id)

  // ── Dados remotos ──
  const [match,    setMatch]    = useState<Match    | null>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [events,   setEvents]   = useState<TimelineEvent[]>([])
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

  // ── Aposta ──
  const [betMethodId, setBetMethodId] = useState<number | ''>('')
  const [betStake,    setBetStake]    = useState('')
  const [betEntryOdd, setBetEntryOdd] = useState('')
  const [betType,     setBetType]     = useState<BetType>('BACK')

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          api.get<Match>(`/matches/${matchId}`),
          // timeline pode não existir — capturamos o erro sem quebrar
          api.get<Timeline>(`/timeline/match/${matchId}`).catch(() => null),
        ])
        setMatch(mRes.data)

        const tl = tRes?.data ?? null
        setTimeline(tl)

        if (tl) {
          // Inicializa o cronômetro com o tempo base da timeline
          chronometer.initialize(tl.minute_second_started)

          // Carrega eventos, critérios e métodos em paralelo
          const [evRes, crRes, mtRes] = await Promise.all([
            api.get<TimelineEvent[]>(`/timeline-event/timeline/${tl.id}`),
            api.get<Criterion[]>('/criterion'),
            api.get<Method[]>('/method'),
          ])
          setEvents(evRes.data)
          setCriteria(crRes.data)
          setMethods(mtRes.data)
        } else {
          // Mesmo sem timeline, carregamos critérios e métodos
          const [crRes, mtRes] = await Promise.all([
            api.get<Criterion[]>('/criterion'),
            api.get<Method[]>('/method'),
          ])
          setCriteria(crRes.data)
          setMethods(mtRes.data)
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
    const { data: tl } = await api.post<Timeline>('/timeline', {
      id_match:              matchId,
      minute_second_started: startSeconds,
    })
    setTimeline(tl)
    // Inicializa o cronômetro no modo pausado (pronto para play)
    chronometer.initialize(startSeconds, true)

    // Carrega eventos (vazio) para garantir o estado limpo
    const [evRes] = await Promise.all([
      api.get<TimelineEvent[]>(`/timeline-event/timeline/${tl.id}`),
    ])
    setEvents(evRes.data)
  }, [matchId, chronometer])

  // ── Encerrar timeline ─────────────────────────────────────────────────────
  const handleStopTimeline = useCallback(async () => {
    if (!timeline || !confirm('Encerrar a timeline? Esta ação não pode ser desfeita.')) return
    try {
      await api.put(`/timeline/stop/${timeline.id}`, null, {
        params: { minute_second_finished: chronometer.elapsed },
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
    if (!selTeam)  { setPanelError('Selecione o time.'); return }

    setAddingEvt(true)
    setPanelError(null)

    // Regra do backend: minute_second ∈ [0, 2700]
    // additional_minute_second só existe se minute_second === 2700
    const minuteSecond           = Math.min(chronometer.elapsed, 2700)
    const additionalMinuteSecond = chronometer.elapsed > 2700
      ? chronometer.elapsed - 2700
      : null

    try {
      let newEvent: TimelineEvent | null = null

      if (eventMode === 'bet') {
        if (!betMethodId)                          { setPanelError('Selecione o método.');        setAddingEvt(false); return }
        if (!betStake || Number(betStake) <= 0)    { setPanelError('Informe um stake válido.');   setAddingEvt(false); return }
        if (!betEntryOdd || Number(betEntryOdd) <= 1) { setPanelError('Informe uma odd válida (> 1).'); setAddingEvt(false); return }

        // Passo 1 — cria a aposta
        const bet = await betService.create({
          id_method:  Number(betMethodId),
          stake:      Number(betStake),
          entry_odd:  Number(betEntryOdd),
          type:       betType,
        })

        // Passo 2 — vincula à timeline
        const { data } = await api.post<TimelineEvent>('/timeline-event', {
          id_timeline:              timeline.id,
          id_bet:                   bet.id,
          id_criterion:             null,
          event:                    null,
          minute_second:            minuteSecond,
          additional_minute_second: additionalMinuteSecond,
          team:                     selTeam,
        })
        newEvent = data

      } else if (eventMode === 'event') {
        if (!selEvent) { setPanelError('Selecione o tipo de evento.'); setAddingEvt(false); return }

        const { data } = await api.post<TimelineEvent>('/timeline-event', {
          id_timeline:              timeline.id,
          event:                    selEvent,
          id_criterion:             null,
          id_bet:                   null,
          minute_second:            minuteSecond,
          additional_minute_second: additionalMinuteSecond,
          team:                     selTeam,
        })
        newEvent = data

      } else if (eventMode === 'criterion') {
        if (!selCrit) { setPanelError('Selecione um critério.'); setAddingEvt(false); return }

        const { data } = await api.post<TimelineEvent>('/timeline-event', {
          id_timeline:              timeline.id,
          id_criterion:             selCrit,
          event:                    null,
          id_bet:                   null,
          minute_second:            minuteSecond,
          additional_minute_second: additionalMinuteSecond,
          team:                     selTeam,
        })
        newEvent = data
      }

      if (newEvent) {
        setEvents(prev => [newEvent!, ...prev])
      }

      // Fecha e reseta o painel
      setShowPanel(false)
      setSelEvent(''); setSelCrit(''); setSelTeam('')
      setBetMethodId(''); setBetStake(''); setBetEntryOdd(''); setBetType('BACK')

    } catch (e) {
      setPanelError(e instanceof Error ? e.message : 'Erro ao registrar.')
    } finally {
      setAddingEvt(false)
    }
  }

  // ── Deletar evento ────────────────────────────────────────────────────────
  const handleDeleteEvent = async (evtId: number) => {
    try {
      await api.delete(`/timeline-event/${evtId}`)
      setEvents(prev => prev.filter(e => e.id !== evtId))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover.')
    }
  }

  // ── Labels do feed ────────────────────────────────────────────────────────
  const getEventLabel = (evt: TimelineEvent): string => {
    if (evt.event)        return EVENT_TYPE_LABELS[evt.event]
    if (evt.id_criterion) return criteria.find(c => c.id === evt.id_criterion)?.title ?? 'Critério'
    if (evt.id_bet)       return `Aposta #${evt.id_bet}`
    return 'Evento'
  }

  const getEventIcon = (evt: TimelineEvent): string => {
    if (evt.event)        return EVENT_ICONS[evt.event] ?? '📌'
    if (evt.id_criterion) return '🎯'
    if (evt.id_bet)       return '📊'
    return '📌'
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
        /* Partida sem timeline → painel de criação */
        <CreateTimelinePainel onConfirm={handleCreateTimeline} />
      ) : isClosed ? (
        /* Timeline encerrada → display estático */
        <div className={cn(
          'rounded-2xl p-5 flex items-center gap-4 border',
          'bg-turf-50 dark:bg-turf-800/40 border-turf-200 dark:border-turf-700',
        )}>
          <span className="font-mono text-3xl font-bold text-turf-500 dark:text-turf-400 tracking-tight">
            {secondsToDisplay(chronometer.elapsed)}
          </span>
          <span className="badge bg-turf-200 dark:bg-turf-700 text-turf-500 dark:text-turf-400">
            Encerrada
          </span>
        </div>
      ) : (
        /* Timeline ativa → controles completos */
        <TimelineControls
          elapsed={chronometer.elapsed}
          status={chronometer.status}
          onTogglePlayPause={chronometer.togglePlayPause}
          onSeek={chronometer.seek}
          onSetTime={chronometer.setTime}
          onStop={handleStopTimeline}
        />
      )}

      {/* ── Registrar evento (só quando timeline ativa e não encerrada) ── */}
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

              {/* Modo Evento: grade de tipos */}
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
                      <Link to="/criteria" className="text-pitch-600 dark:text-pitch-400 underline">
                        Criar critério →
                      </Link>
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
                        <Link to="/settings" className="text-pitch-600 dark:text-pitch-400 underline">
                          Criar método →
                        </Link>
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
                        id="bet-stake"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Ex: 10.00"
                        value={betStake}
                        onChange={e => setBetStake(e.target.value)}
                        className="field-select"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="bet-odd">Odd de Entrada</label>
                      <input
                        id="bet-odd"
                        type="number"
                        min="1.01"
                        step="0.01"
                        placeholder="Ex: 1.85"
                        value={betEntryOdd}
                        onChange={e => setBetEntryOdd(e.target.value)}
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
                  onClick={handleAddEvent}
                  disabled={addingEvt}
                  aria-label={`Registrar evento às ${secondsToDisplay(chronometer.elapsed)}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-pitch-600 hover:bg-pitch-700 text-white transition-colors disabled:opacity-50"
                >
                  {addingEvt && <Spinner size="sm" className="border-white border-t-transparent" />}
                  Registrar às {secondsToDisplay(chronometer.elapsed)}
                </button>
                <button
                  onClick={() => { setShowPanel(false); setPanelError(null) }}
                  className="px-3 py-2 rounded-lg text-sm text-turf-500 hover:bg-turf-100 dark:hover:bg-turf-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Feed de eventos ── */}
      {events.length > 0 ? (
        <ul className="space-y-2" aria-label="Eventos da timeline">
          {events.map(evt => (
            <li
              key={evt.id}
              className="group flex items-center gap-3 py-2.5 px-4 rounded-xl border border-turf-100 dark:border-turf-800 bg-white dark:bg-turf-800/40 hover:border-turf-200 dark:hover:border-turf-700 transition-colors"
            >
              <span className="font-mono text-xs text-turf-400 dark:text-turf-500 w-12 shrink-0">
                {secondsToDisplay(evt.minute_second + (evt.additional_minute_second ?? 0))}
              </span>
              <span className="text-lg shrink-0" aria-hidden>{getEventIcon(evt)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-turf-900 dark:text-turf-100">
                  {getEventLabel(evt)}
                </p>
                <p className="text-xs text-turf-400 dark:text-turf-500">{evt.team}</p>
              </div>
              <button
                onClick={() => handleDeleteEvent(evt.id)}
                aria-label={`Remover evento de ${getEventLabel(evt)}`}
                className="opacity-0 group-hover:opacity-100 text-turf-300 dark:text-turf-600 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : timeline ? (
        <div className="py-12 text-center text-sm text-turf-400 dark:text-turf-500">
          Nenhum evento registrado ainda.
        </div>
      ) : null}
    </div>
  )
}