import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, Plus, Zap, Target,
  Layers, Trash2, StopCircle, AlertCircle,
} from 'lucide-react'
import api from '../services/api'
import { Spinner } from '../components/ui/Spinner'
import { cn } from '../utils/cn'
import type { Match, Timeline, TimelineEvent, EventType, Criterion } from '../types'
import { EVENT_TYPE_LABELS } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function secondsToDisplay(s: number): string {
  const extra = s > 2700 ? s - 2700 : 0
  const base  = Math.min(s, 2700)
  const m = Math.floor(base / 60).toString().padStart(2, '0')
  const sec = (base % 60).toString().padStart(2, '0')
  return extra > 0 ? `45+${Math.ceil(extra / 60)}'` : `${m}:${sec}`
}

const EVENT_ICONS: Record<EventType, string> = {
  YELLOW_CARD: '🟨',
  RED_CARD: '🟥',
  GOAL: '⚽',
  CORNER: '🚩',
  FOUL_DEFENSIVE_HALF: '🛡️',   // Escudo para defesa
  FOUL_ATTACKING_HALF: '⚔️',   // Espadas para ataque
  ANNULLED_GOAL: '❌',         // X para anulado
  HIT_WOODWORK: '🥅',          // Trave
  GOALKEEPER_SAVE: '🧤',       // Luvas para defesa
  PENALTY: '🎯',               // Alvo para pênalti
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const matchId = Number(id)

  const [match,    setMatch]    = useState<Match | null>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [events,   setEvents]   = useState<TimelineEvent[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // Cronômetro local
  const [elapsed, setElapsed]   = useState(0)
  const [running, setRunning]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Painel de novo evento
  const [showPanel,  setShowPanel]  = useState(false)
  const [eventMode,  setEventMode]  = useState<'event' | 'criterion' | 'bet'>('event')
  const [selEvent,   setSelEvent]   = useState<EventType | ''>('')
  const [selTeam,    setSelTeam]    = useState('')
  const [selCrit,    setSelCrit]    = useState<number | ''>('')
  const [addingEvt,  setAddingEvt]  = useState(false)
  const [panelError, setPanelError] = useState<string | null>(null)

  // Carga inicial
  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          api.get<Match>(`/matches/${matchId}`),
          api.get<Timeline>(`/timeline/match/${matchId}`),
        ])
        setMatch(mRes.data)
        const tl = tRes.data ?? null
        setTimeline(tl)
        if (tl) {
          setElapsed(tl.minute_second_started)
          const [evRes, crRes] = await Promise.all([
            api.get<TimelineEvent[]>(`/timeline-event/timeline/${tl.id}`), // Passando o ID na URL
            api.get<Criterion[]>('/criterion'),
          ])
          setEvents(evRes.data)
          setCriteria(crRes.data)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar timeline.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [matchId])

  // Timer
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  const handleStopTimeline = async () => {
    if (!timeline || !confirm('Encerrar a timeline?')) return
    try {
      await api.put(`/timeline/stop/${timeline.id}`, null, {
        params: { minute_second_finished: elapsed },
      })
      setRunning(false)
      setTimeline(prev => prev ? { ...prev, minute_second_finished: elapsed } : prev)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao encerrar.')
    }
  }

  const handleAddEvent = async () => {
    if (!timeline) return
    if (!selTeam) { setPanelError('Selecione o time.'); return }

    const payload: Record<string, unknown> = {
      id_timeline:   timeline.id,
      minute_second: Math.min(elapsed, 2700),
      team:          selTeam,
    }
    if (elapsed > 2700) payload.additional_minute_second = elapsed - 2700

    if (eventMode === 'event') {
      if (!selEvent) { setPanelError('Selecione o tipo de evento.'); return }
      payload.event = selEvent
    } else if (eventMode === 'criterion') {
      if (!selCrit) { setPanelError('Selecione um critério.'); return }
      payload.id_criterion = selCrit
    }

    setAddingEvt(true)
    setPanelError(null)
    try {
      const { data } = await api.post<TimelineEvent>('/timeline-event', payload)
      setEvents(prev => [data, ...prev])
      setShowPanel(false)
      setSelEvent('')
      setSelCrit('')
      setSelTeam('')
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : 'Erro ao registrar evento.')
    } finally {
      setAddingEvt(false)
    }
  }

  const handleDeleteEvent = async (evtId: number) => {
    try {
      await api.delete(`/timeline-event/${evtId}`)
      setEvents(prev => prev.filter(e => e.id !== evtId))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-turf-400">
        <Spinner /> <span className="text-sm">Carregando timeline...</span>
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
        <Link to="/" className="p-1.5 rounded-lg hover:bg-turf-100 dark:hover:bg-turf-800 transition-colors text-turf-500 dark:text-turf-400">
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

      {/* ── Cronômetro ── */}
      {timeline ? (
        <div className={cn(
          'rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between',
          'border',
          isClosed
            ? 'bg-turf-50 dark:bg-turf-800/40 border-turf-200 dark:border-turf-700'
            : 'bg-pitch-50 dark:bg-pitch-950/20 border-pitch-200 dark:border-pitch-900',
        )}>
          {/* Tempo */}
          <div className="flex items-center gap-3">
            <Clock className={cn('w-5 h-5', isClosed ? 'text-turf-400' : 'text-pitch-600 dark:text-pitch-400')} />
            <span className={cn('font-mono text-3xl font-bold tracking-tight', isClosed ? 'text-turf-500' : 'text-turf-900 dark:text-turf-100')}>
              {secondsToDisplay(elapsed)}
            </span>
            {isClosed && <span className="badge bg-turf-200 dark:bg-turf-700 text-turf-500 dark:text-turf-400">Encerrada</span>}
          </div>

          {/* Controles */}
          {!isClosed && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setElapsed(p => Math.max(0, p - 60))}
                className="btn-ctrl">−1min</button>
              <button
                onClick={() => setRunning(p => !p)}
                className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', running
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-pitch-600 hover:bg-pitch-700 text-white')}>
                {running ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={() => setElapsed(p => p + 60)}
                className="btn-ctrl">+1min</button>
              <button
                onClick={handleStopTimeline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                <StopCircle className="w-3.5 h-3.5" />
                Encerrar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-turf-300 dark:border-turf-700 text-sm text-turf-400 dark:text-turf-500 text-center">
          Nenhuma timeline criada para esta partida.
        </div>
      )}

      {/* ── Registrar evento ── */}
      {timeline && !isClosed && (
        <div>
          <button
            onClick={() => setShowPanel(p => !p)}
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
            <div className="mt-3 p-4 rounded-xl border border-turf-200 dark:border-turf-700 bg-white dark:bg-turf-800/60 space-y-4 animate-slide-down">
              {/* Modo */}
              <div className="flex gap-1">
                {([['event', 'Evento', <Zap key="z" className="w-3 h-3"/>], ['criterion', 'Critério', <Target key="t" className="w-3 h-3"/>], ['bet', 'Aposta', <Layers key="l" className="w-3 h-3"/>]] as const).map(
                  ([mode, label, icon]) => (
                    <button
                      key={mode}
                      onClick={() => setEventMode(mode as 'event'|'criterion'|'bet')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        eventMode === mode
                          ? 'bg-pitch-600 text-white'
                          : 'bg-turf-100 dark:bg-turf-700 text-turf-500 dark:text-turf-300 hover:bg-turf-200 dark:hover:bg-turf-600',
                      )}
                    >
                      {icon} {label}
                    </button>
                  )
                )}
              </div>

              {/* Time */}
              <div>
                <label className="field-label">Time</label>
                <select
                  value={selTeam}
                  onChange={e => setSelTeam(e.target.value)}
                  className="field-select"
                >
                  <option value="">Selecione...</option>
                  <option value={match.team_home}>{match.team_home}</option>
                  <option value={match.team_away}>{match.team_away}</option>
                </select>
              </div>

              {/* Tipo de evento */}
              {eventMode === 'event' && (
                <div>
                  <label className="field-label">Tipo de Evento</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {(Object.keys(EVENT_ICONS) as EventType[]).map(evt => (
                      <button
                        key={evt}
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

              {/* Critério */}
              {eventMode === 'criterion' && (
                <div>
                  <label className="field-label">Critério</label>
                  <select
                    value={selCrit}
                    onChange={e => setSelCrit(e.target.value ? Number(e.target.value) : '')}
                    className="field-select"
                  >
                    <option value="">Selecione um critério...</option>
                    {criteria.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {panelError && (
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {panelError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleAddEvent}
                  disabled={addingEvt}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-pitch-600 hover:bg-pitch-700 text-white transition-colors disabled:opacity-50"
                >
                  {addingEvt && <Spinner size="sm" className="border-white border-t-transparent" />}
                  Registrar às {secondsToDisplay(elapsed)}
                </button>
                <button
                  onClick={() => setShowPanel(false)}
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
        <ul className="space-y-2">
          {events.map(evt => (
            <li key={evt.id} className="group flex items-center gap-3 py-2.5 px-4 rounded-xl border border-turf-100 dark:border-turf-800 bg-white dark:bg-turf-800/40 hover:border-turf-200 dark:hover:border-turf-700 transition-colors">
              <span className="font-mono text-xs text-turf-400 dark:text-turf-500 w-12 shrink-0">
                {secondsToDisplay(evt.minute_second + (evt.additional_minute_second ?? 0))}
              </span>
              <span className="text-lg shrink-0">
                {evt.event ? EVENT_ICONS[evt.event] ?? '📌' : evt.id_criterion ? '🎯' : '📊'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-turf-900 dark:text-turf-100">
                  {evt.event ? EVENT_TYPE_LABELS[evt.event] : (evt.id_criterion ? criteria.find(c=>c.id===evt.id_criterion)?.title ?? 'Critério' : 'Aposta')}
                </p>
                <p className="text-xs text-turf-400 dark:text-turf-500">{evt.team}</p>
              </div>
              <button
                onClick={() => handleDeleteEvent(evt.id)}
                className="opacity-0 group-hover:opacity-100 text-turf-300 dark:text-turf-600 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-12 text-center text-sm text-turf-400 dark:text-turf-500">
          Nenhum evento registrado ainda.
        </div>
      )}
    </div>
  )
}
