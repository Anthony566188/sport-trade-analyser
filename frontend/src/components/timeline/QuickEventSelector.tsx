import React, { useState, useCallback } from 'react'
import { Loader2, AlertCircle, Zap } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useFrequentSelections } from '../../hooks/useFrequentSelections'
import { timelineEventService } from '../../services/timelineEventService'
import { EVENT_TYPE_LABELS } from '../../types'
import type { 
  FrequentSelectionResponse, 
  TimelineEventRequestPayload, 
  MatchPeriod, 
  EventType 
} from '../../types'
// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickEventSelectorProps {
  timelineId:         number
  teamHome:           string
  teamAway:           string
  currentPeriod:      MatchPeriod
  minuteSecond:       number
  additionalMinuteSecond: number
  onEventCreated:     (event: Awaited<ReturnType<typeof timelineEventService.create>>) => void
}

// ─── QuickSelectionItem ───────────────────────────────────────────────────────

interface QuickSelectionItemProps {
  selection:  FrequentSelectionResponse
  team:       string
  registering: string | null   // key of item currently registering
  onClick:    (selection: FrequentSelectionResponse, team: string) => void
}

/** Chave única por item (para controle de loading individual) */
const itemKey = (s: FrequentSelectionResponse, team: string) =>
  `${team}::${s.id_criterion ?? ''}::${s.event ?? ''}`

const QuickSelectionItem: React.FC<QuickSelectionItemProps> = ({
  selection, team, registering, onClick,
}) => {
  const key       = itemKey(selection, team)
  const isBusy    = registering === key
  
  // Resgata o label em PT-BR se existir um evento; caso contrário (ex: string não mapeada), faz fallback para a original
  const eventLabel = selection.event 
    ? EVENT_TYPE_LABELS[selection.event as EventType] ?? selection.event 
    : null;
    
  const label     = selection.title ?? eventLabel ?? '—'

  return (
    <button
      onClick={() => onClick(selection, team)}
      disabled={isBusy}
      title={label}
      className={cn(
        // layout
        'flex items-center gap-1.5 w-full text-left',
        'px-1 py-1 rounded-md',
        // tipografia
        'text-xs text-turf-300 dark:text-turf-400 truncate',
        // hover: mudança de cor + leve zoom
        'transition-all duration-150 ease-out',
        'hover:text-turf-100 dark:hover:text-turf-100',
        'hover:bg-turf-700/50 dark:hover:bg-turf-700/40',
        'hover:scale-[1.03] origin-left',
        // disabled
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
      )}
    >
      {isBusy
        ? <Loader2 className="w-3 h-3 shrink-0 animate-spin text-pitch-400" />
        : <span className="w-3 h-3 shrink-0" />
      }
      <span className="truncate">{label}</span>
    </button>
  )
}

// ─── TeamColumn ───────────────────────────────────────────────────────────────

interface TeamColumnProps {
  team:        string
  selections:  FrequentSelectionResponse[]
  registering: string | null
  onSelect:    (selection: FrequentSelectionResponse, team: string) => void
}

const TeamColumn: React.FC<TeamColumnProps> = ({ team, selections, registering, onSelect }) => (
  <div className={cn(
    'flex-1 min-w-0 rounded-xl border',
    'border-turf-700/60 dark:border-turf-700/40',
    'bg-turf-850 dark:bg-turf-900/60',
    'p-3',
  )}>
    {/* Team header */}
    <p className={cn(
      'text-[12px] font-bold uppercase tracking-widest',
      'text-turf-300 dark:text-turf-400',
      'mb-2 pb-1.5 border-b border-turf-700/40',
      'truncate',
      'text-center',
    )}>
      {team}
    </p>

    {/* Items */}
    <ul className="space-y-0.5" role="list" aria-label={`Seleções rápidas para ${team}`}>
      {selections.map((sel, i) => (
        <li key={i}>
          <QuickSelectionItem
            selection={sel}
            team={team}
            registering={registering}
            onClick={onSelect}
          />
        </li>
      ))}
    </ul>
  </div>
)

// ─── QuickEventSelector ───────────────────────────────────────────────────────

export const QuickEventSelector: React.FC<QuickEventSelectorProps> = ({
  timelineId,
  teamHome,
  teamAway,
  currentPeriod,
  minuteSecond,
  additionalMinuteSecond,
  onEventCreated,
}) => {
  const { selections, loading, error } = useFrequentSelections()
  const [registering, setRegistering]  = useState<string | null>(null)
  const [lastError,   setLastError]    = useState<string | null>(null)

  const handleSelect = useCallback(async (
    selection: FrequentSelectionResponse,
    team: string,
  ) => {
    const key = itemKey(selection, team)
    setRegistering(key)
    setLastError(null)

    const payload: TimelineEventRequestPayload = {
      id_timeline:              timelineId,
      event:                    selection.event as any ?? null,
      id_criterion:             selection.id_criterion ?? null,
      match_period:             currentPeriod,
      minute_second:            minuteSecond,
      additional_minute_second: additionalMinuteSecond ?? 0,
      team,
    }

    try {
      const created = await timelineEventService.create(payload)
      onEventCreated(created)
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Erro ao registrar evento.')
    } finally {
      setRegistering(null)
    }
  }, [timelineId, currentPeriod, minuteSecond, additionalMinuteSecond, onEventCreated])

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-turf-500 dark:text-turf-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Carregando seleções rápidas…
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400 py-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {error}
      </div>
    )
  }

  // ── Empty ──
  if (selections.length === 0) return null

  return (
    <div className="space-y-2">
      {/* ── Header ── */}
      <div className="flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-turf-500 dark:text-turf-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-turf-500 dark:text-turf-500">
          Registro Rápido
        </span>
      </div>

      {/* ── Columns ── */}
      <div className="flex gap-3">
        <TeamColumn
          team={teamHome}
          selections={selections}
          registering={registering}
          onSelect={handleSelect}
        />
        <TeamColumn
          team={teamAway}
          selections={selections}
          registering={registering}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Inline error after failed registration ── */}
      {lastError && (
        <p className="text-[10px] text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {lastError}
        </p>
      )}
    </div>
  )
}