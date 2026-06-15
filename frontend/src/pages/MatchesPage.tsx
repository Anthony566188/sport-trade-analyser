import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Calendar, Trash2, ChevronRight,
  Shield, Clock, AlertCircle,
} from 'lucide-react'
import api from '../services/api'
import { Spinner } from '../components/ui/Spinner'
import { cn } from '../utils/cn'
import type { Match } from '../types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayLocal() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MatchesPage: React.FC = () => {
  const [date, setDate]       = useState(todayLocal())
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Busca partidas filtradas pela data selecionada
  const fetchMatches = async (d: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<Match[]>(`/matches/date/${d}`)
      setMatches(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar partidas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMatches(date) }, [date])

  const handleDelete = async (id: number) => {
    if (!confirm('Remover esta partida?')) return
    setDeleting(id)
    try {
      await api.delete(`/matches/${id}`)
      setMatches(prev => prev.filter(m => m.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-turf-900 dark:text-turf-100">Partidas</h1>
          <p className="text-sm text-turf-500 dark:text-turf-400 mt-0.5">
            Gerencie e acompanhe seus jogos em tempo real
          </p>
        </div>
        <Link
          to="/matches/new"
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-pitch-600 hover:bg-pitch-700 text-white',
            'shadow-sm transition-colors duration-150',
          )}
        >
          <Plus className="w-4 h-4" />
          Nova Partida
        </Link>
      </div>

      {/* ── Filtro de data ── */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-turf-400 shrink-0" />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className={cn(
            'text-sm rounded-lg border px-3 py-1.5',
            'bg-white dark:bg-turf-800',
            'border-turf-300 dark:border-turf-600',
            'text-turf-900 dark:text-turf-100',
            'focus:outline-none focus:ring-2 focus:ring-pitch-500',
          )}
        />
        <span className="text-xs text-turf-400 dark:text-turf-500">
          {date === todayLocal() ? '— Hoje' : `— ${formatDateBR(date)}`}
        </span>
      </div>

      {/* ── Estados ── */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-turf-400">
          <Spinner />
          <span className="text-sm">Carregando partidas...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-turf-100 dark:bg-turf-800 flex items-center justify-center">
            <Shield className="w-6 h-6 text-turf-300 dark:text-turf-600" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-turf-500 dark:text-turf-400">
            Nenhuma partida em <span className="font-semibold">{formatDateBR(date)}</span>.
          </p>
          <Link
            to="/matches/new"
            className="text-xs text-pitch-600 dark:text-pitch-400 hover:underline font-medium"
          >
            Criar a primeira partida →
          </Link>
        </div>
      )}

      {/* ── Lista de partidas ── */}
      {!loading && matches.length > 0 && (
        <ul className="space-y-3">
          {matches.map(match => (
            <li key={match.id}>
              <div className={cn(
                'group flex items-center gap-3 p-4 rounded-xl border',
                'bg-white dark:bg-turf-800/60',
                'border-turf-200 dark:border-turf-700',
                'hover:border-pitch-400 dark:hover:border-pitch-600',
                'transition-all duration-150',
              )}>
                {/* Escudo placeholder */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Times + placar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-turf-900 dark:text-turf-100 truncate">
                        {match.team_home}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded font-mono text-xs font-bold',
                        'bg-turf-100 dark:bg-turf-700 text-turf-700 dark:text-turf-200',
                      )}>
                        {match.home_goals} : {match.away_goals}
                      </span>
                      <span className="font-semibold text-sm text-turf-900 dark:text-turf-100 truncate">
                        {match.team_away}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {match.is_friendly ? (
                        <span className="badge bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                          Amistoso
                        </span>
                      ) : (
                        <span className="badge bg-pitch-100 dark:bg-pitch-950/40 text-pitch-700 dark:text-pitch-400 truncate max-w-[160px]">
                          {match.championship}
                        </span>
                      )}
                      {match.is_neutral_field && (
                        <span className="badge bg-turf-100 dark:bg-turf-700 text-turf-500 dark:text-turf-400">
                          Campo neutro
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Ver timeline */}
                  <Link
                    to={`/timeline/${match.id}`}
                    aria-label="Abrir timeline"
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                      'bg-pitch-50 dark:bg-pitch-950/30 text-pitch-600 dark:text-pitch-400',
                      'hover:bg-pitch-100 dark:hover:bg-pitch-950/60 transition-colors',
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Timeline
                    <ChevronRight className="w-3 h-3" />
                  </Link>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(match.id)}
                    disabled={deleting === match.id}
                    aria-label="Remover partida"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      'text-turf-300 dark:text-turf-600',
                      'hover:text-red-500 dark:hover:text-red-400',
                      'hover:bg-red-50 dark:hover:bg-red-950/20',
                    )}
                  >
                    {deleting === match.id
                      ? <Spinner size="sm" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
