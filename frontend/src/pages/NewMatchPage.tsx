import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Flag, Trophy, ChevronDown,
  AlertCircle, CheckCircle2, ToggleLeft, ToggleRight,
} from 'lucide-react'
import api from '../services/api'
import { fetchChampionships } from '../services/teamService'
import { TeamSearchInput } from '../components/team/TeamSearchInput'
import { Spinner } from '../components/ui/Spinner'
import { cn } from '../utils/cn'
import type { Team, Championship } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayLocal() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export const NewMatchPage: React.FC = () => {
  const navigate = useNavigate()

  // ── Form state ──
  const [isFriendly, setIsFriendly]           = useState(false)
  const [isNeutralField, setIsNeutralField]    = useState(false)
  const [homeTeam, setHomeTeam]                = useState<Team | null>(null)
  const [awayTeam, setAwayTeam]                = useState<Team | null>(null)
  const [homeGoals, setHomeGoals]              = useState(0)
  const [awayGoals, setAwayGoals]              = useState(0)
  const [date, setDate]                        = useState(todayLocal())
  const [championshipId, setChampionshipId]    = useState<number | ''>('')
  const [championships, setChampionships]      = useState<Championship[]>([])
  const [chapLoading, setChapLoading]          = useState(false)

  // ── Timeline initial seconds ──
  const [tlMinutes, setTlMinutes]              = useState(0)
  const [tlSeconds, setTlSeconds]              = useState(0)

  // ── Submission ──
  const [submitting, setSubmitting]            = useState(false)
  const [apiError, setApiError]                = useState<string | null>(null)
  const [success, setSuccess]                  = useState(false)

  // Carrega campeonatos ao montar (se modo oficial)
  useEffect(() => {
    if (isFriendly) return
    setChapLoading(true)
    fetchChampionships()
      .then(setChampionships)
      .catch(() => setChampionships([]))
      .finally(() => setChapLoading(false))
  }, [isFriendly])

  // Limpa campeonato ao virar amistoso
  useEffect(() => {
    if (isFriendly) setChampionshipId('')
  }, [isFriendly])

  // Limpa times ao trocar modo (campeonato/amistoso muda o endpoint de busca)
  const handleToggleFriendly = () => {
    setIsFriendly(prev => !prev)
    setHomeTeam(null)
    setAwayTeam(null)
  }

  const handleSubmit = async () => {
    // ── Validações client-side ──
    if (!homeTeam || !awayTeam) {
      setApiError('Selecione os dois times.')
      return
    }
    if (!isFriendly && !championshipId) {
      setApiError('Selecione um campeonato para partida oficial.')
      return
    }
    if (homeTeam.name === awayTeam.name) {
      setApiError('Os dois times não podem ser iguais.')
      return
    }

    setSubmitting(true)
    setApiError(null)

    const initialSeconds = tlMinutes * 60 + tlSeconds

    try {
      // 1. Cria a partida
      const { data: match } = await api.post('/matches', {
        team_home:        homeTeam.name,
        team_away:        awayTeam.name,
        home_goals:       homeGoals,
        away_goals:       awayGoals,
        championship:     isFriendly ? null : (championships.find(c => c.id === championshipId)?.name ?? null),
        date,
        is_friendly:      isFriendly,
        is_neutral_field: isNeutralField,
      })

      // 2. Cria a timeline associada
      await api.post('/timeline', {
        id_match:               match.id,
        minute_second_started:  initialSeconds,
      })

      setSuccess(true)
      setTimeout(() => navigate('/'), 1200)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao criar partida.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedChampionship = championships.find(c => c.id === championshipId)

  return (
    <div className="max-w-xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-turf-100 dark:hover:bg-turf-800 transition-colors text-turf-500 dark:text-turf-400"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-turf-900 dark:text-turf-100">Nova Partida</h1>
          <p className="text-xs text-turf-500 dark:text-turf-400 mt-0.5">Preencha os dados e inicie a timeline</p>
        </div>
      </div>

      {/* ── Toggles ── */}
      <div className="flex flex-wrap gap-4">
        <ToggleButton
          icon={<Flag className="w-3.5 h-3.5" />}
          label="Amistoso"
          active={isFriendly}
          onToggle={handleToggleFriendly}
        />
        <ToggleButton
          icon={<Trophy className="w-3.5 h-3.5" />}
          label="Campo Neutro"
          active={isNeutralField}
          onToggle={() => setIsNeutralField(p => !p)}
        />
      </div>

      {/* ── Campeonato (só no modo oficial) ── */}
      {!isFriendly && (
        <section className="space-y-2">
          <label className="text-xs font-medium text-turf-500 dark:text-turf-400 uppercase tracking-wide block">
            Campeonato <span className="text-red-400">*</span>
          </label>
          {chapLoading ? (
            <div className="flex items-center gap-2 text-sm text-turf-400 py-2">
              <Spinner size="sm" /> Carregando campeonatos...
            </div>
          ) : (
            <div className="relative">
              <select
                value={championshipId}
                onChange={e => {
                  setChampionshipId(e.target.value ? Number(e.target.value) : '')
                  setHomeTeam(null)
                  setAwayTeam(null)
                }}
                className={cn(
                  'w-full appearance-none rounded-lg border-2 px-3 py-2.5 text-sm',
                  'bg-white dark:bg-turf-800',
                  'border-turf-200 dark:border-turf-700',
                  'text-turf-900 dark:text-turf-100',
                  'focus:outline-none focus:border-pitch-500',
                  'transition-colors pr-9',
                )}
              >
                <option value="">Selecione um campeonato...</option>
                {championships.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-turf-400 pointer-events-none" />
            </div>
          )}
        </section>
      )}

      {/* ── Seleção de Times ── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-turf-500 dark:text-turf-400 uppercase tracking-widest border-b border-turf-100 dark:border-turf-800 pb-2">
          Times
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TeamSearchInput
            championshipId={!isFriendly && selectedChampionship ? selectedChampionship.id : undefined}
            label={isNeutralField ? 'Time A' : 'Time Mandante'}
            placeholder="Buscar time..."
            selectedTeam={homeTeam}
            onSelect={setHomeTeam}
            disabled={!isFriendly && !championshipId}
          />
          <TeamSearchInput
            championshipId={!isFriendly && selectedChampionship ? selectedChampionship.id : undefined}
            label={isNeutralField ? 'Time B' : 'Time Visitante'}
            placeholder="Buscar time..."
            selectedTeam={awayTeam}
            onSelect={setAwayTeam}
            disabled={!isFriendly && !championshipId}
          />
        </div>

        {/* Placar inicial */}
        {homeTeam && awayTeam && (
          <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-xl bg-turf-50 dark:bg-turf-800/40 border border-turf-100 dark:border-turf-700">
            <GoalInput
              label={homeTeam.name}
              value={homeGoals}
              onChange={setHomeGoals}
            />
            <span className="font-mono font-bold text-lg text-turf-400 dark:text-turf-500 select-none">×</span>
            <GoalInput
              label={awayTeam.name}
              value={awayGoals}
              onChange={setAwayGoals}
              align="right"
            />
          </div>
        )}
      </section>

      {/* ── Data da Partida ── */}
      <section className="space-y-2">
        <label className="text-xs font-medium text-turf-500 dark:text-turf-400 uppercase tracking-wide block">
          Data da Partida
        </label>
        <input
          type="date"
          value={date}
          min={todayLocal()}
          onChange={e => setDate(e.target.value)}
          className={cn(
            'w-full rounded-lg border-2 px-3 py-2.5 text-sm',
            'bg-white dark:bg-turf-800',
            'border-turf-200 dark:border-turf-700',
            'text-turf-900 dark:text-turf-100',
            'focus:outline-none focus:border-pitch-500 transition-colors',
          )}
        />
      </section>

      {/* ── Tempo inicial da Timeline ── */}
      <section className="space-y-2">
        <label className="text-xs font-medium text-turf-500 dark:text-turf-400 uppercase tracking-wide block">
          Tempo Inicial da Timeline
        </label>
        <p className="text-xs text-turf-400 dark:text-turf-500">
          Se a partida já começou, informe o tempo atual para sincronizar a timeline.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={120}
              value={tlMinutes}
              onChange={e => setTlMinutes(Math.max(0, Math.min(120, Number(e.target.value))))}
              className={cn(
                'w-16 text-center rounded-lg border-2 px-2 py-2.5 text-sm font-mono',
                'bg-white dark:bg-turf-800 border-turf-200 dark:border-turf-700',
                'text-turf-900 dark:text-turf-100',
                'focus:outline-none focus:border-pitch-500',
              )}
            />
            <span className="text-xs text-turf-400">min</span>
          </div>
          <span className="text-turf-300 font-bold">:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={59}
              value={tlSeconds}
              onChange={e => setTlSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
              className={cn(
                'w-16 text-center rounded-lg border-2 px-2 py-2.5 text-sm font-mono',
                'bg-white dark:bg-turf-800 border-turf-200 dark:border-turf-700',
                'text-turf-900 dark:text-turf-100',
                'focus:outline-none focus:border-pitch-500',
              )}
            />
            <span className="text-xs text-turf-400">seg</span>
          </div>
          <span className="text-xs text-turf-300 dark:text-turf-600 ml-1">
            = {tlMinutes * 60 + tlSeconds}s
          </span>
        </div>
      </section>

      {/* ── Erro / Sucesso ── */}
      {apiError && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {apiError}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl border border-pitch-200 dark:border-pitch-900 bg-pitch-50 dark:bg-pitch-950/20 text-pitch-700 dark:text-pitch-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Partida criada! Redirecionando...
        </div>
      )}

      {/* ── Submit ── */}
      <button
        onClick={handleSubmit}
        disabled={submitting || success}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold',
          'bg-pitch-600 hover:bg-pitch-700 text-white',
          'shadow-sm transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {submitting && <Spinner size="sm" className="border-white border-t-transparent" />}
        {submitting ? 'Criando partida...' : 'Criar Partida e Iniciar Timeline'}
      </button>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ToggleBtnProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onToggle: () => void
}

const ToggleButton: React.FC<ToggleBtnProps> = ({ icon, label, active, onToggle }) => (
  <button
    onClick={onToggle}
    className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all duration-150',
      active
        ? 'border-pitch-500 bg-pitch-50 dark:bg-pitch-950/30 text-pitch-700 dark:text-pitch-400'
        : 'border-turf-200 dark:border-turf-700 text-turf-500 dark:text-turf-400 hover:border-turf-300 dark:hover:border-turf-600',
    )}
  >
    {icon}
    {label}
    {active
      ? <ToggleRight className="w-4 h-4 text-pitch-500" />
      : <ToggleLeft  className="w-4 h-4 text-turf-300 dark:text-turf-600" />}
  </button>
)

interface GoalInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  align?: 'left' | 'right'
}

const GoalInput: React.FC<GoalInputProps> = ({ label, value, onChange, align = 'left' }) => (
  <div className={cn('flex flex-col items-center gap-1', align === 'right' && 'items-end')}>
    <span className="text-[10px] text-turf-400 dark:text-turf-500 font-medium truncate max-w-[80px]">
      {label}
    </span>
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-6 h-6 rounded flex items-center justify-center bg-turf-100 dark:bg-turf-700 text-turf-600 dark:text-turf-300 text-lg leading-none hover:bg-turf-200 dark:hover:bg-turf-600 transition-colors"
      >−</button>
      <span className="w-8 text-center font-mono font-bold text-lg text-turf-900 dark:text-turf-100">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded flex items-center justify-center bg-turf-100 dark:bg-turf-700 text-turf-600 dark:text-turf-300 text-lg leading-none hover:bg-turf-200 dark:hover:bg-turf-600 transition-colors"
      >+</button>
    </div>
  </div>
)
