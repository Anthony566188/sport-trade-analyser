import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, AlertCircle, Target } from 'lucide-react'
import api from '../services/api'
import { Spinner } from '../components/ui/Spinner'
import { cn } from '../utils/cn'
import type { Criterion } from '../types'

export const CriteriaPage: React.FC = () => {
  const [criteria, setCriteria]   = useState<Criterion[]>([])
  const [loading,  setLoading]    = useState(true)
  const [error,    setError]      = useState<string | null>(null)

  // Inline add
  const [addTitle, setAddTitle]   = useState('')
  const [addDesc,  setAddDesc]    = useState('')
  const [adding,   setAdding]     = useState(false)
  const [addErr,   setAddErr]     = useState<string | null>(null)

  // Inline edit
  const [editId,    setEditId]    = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc,  setEditDesc]  = useState('')
  const [saving,    setSaving]    = useState(false)

  const [deleting, setDeleting]   = useState<number | null>(null)

  useEffect(() => {
    api.get<Criterion[]>('/criterion')
      .then(r => setCriteria(r.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Erro ao carregar.'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!addTitle.trim()) { setAddErr('Título obrigatório.'); return }
    setAdding(true); setAddErr(null)
    try {
      const { data } = await api.post<Criterion>('/criterion', {
        title: addTitle.trim(),
        description: addDesc.trim() || undefined,
      })
      setCriteria(p => [...p, data])
      setAddTitle(''); setAddDesc('')
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : 'Erro ao criar.')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (c: Criterion) => {
    setEditId(c.id); setEditTitle(c.title); setEditDesc(c.description ?? '')
  }

  const handleSave = async () => {
    if (!editTitle.trim() || editId == null) return
    setSaving(true)
    try {
      const { data } = await api.put<Criterion>(`/criterion/${editId}`, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
      })
      setCriteria(p => p.map(c => c.id === editId ? data : c))
      setEditId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remover critério?')) return
    setDeleting(id)
    try {
      await api.delete(`/criterion/${id}`)
      setCriteria(p => p.filter(c => c.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-xl font-bold text-turf-900 dark:text-turf-100">Critérios de Análise</h1>
        <p className="text-sm text-turf-500 dark:text-turf-400 mt-0.5">
          Critérios que podem ser associados a eventos na timeline.
        </p>
      </div>

      {/* ── Formulário de adição ── */}
      <div className="p-4 rounded-xl border border-turf-200 dark:border-turf-700 bg-white dark:bg-turf-800/50 space-y-3">
        <p className="text-xs font-semibold text-turf-500 dark:text-turf-400 uppercase tracking-wide">Novo Critério</p>
        <input
          value={addTitle}
          onChange={e => setAddTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Título *"
          className={fieldCls}
        />
        <textarea
          value={addDesc}
          onChange={e => setAddDesc(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={2}
          className={cn(fieldCls, 'resize-none')}
        />
        {addErr && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {addErr}
          </p>
        )}
        <button
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-pitch-600 hover:bg-pitch-700 text-white transition-colors disabled:opacity-50"
        >
          {adding ? <Spinner size="sm" className="border-white border-t-transparent" /> : <Plus className="w-4 h-4" />}
          Adicionar
        </button>
      </div>

      {/* ── Lista ── */}
      {loading && (
        <div className="flex items-center gap-2 py-8 text-turf-400 text-sm">
          <Spinner /> Carregando...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && criteria.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-turf-400 dark:text-turf-500">
          <Target className="w-8 h-8" strokeWidth={1.5} />
          <p className="text-sm">Nenhum critério cadastrado ainda.</p>
        </div>
      )}

      <ul className="space-y-2">
        {criteria.map(c => (
          <li key={c.id} className="p-4 rounded-xl border border-turf-100 dark:border-turf-800 bg-white dark:bg-turf-800/40">
            {editId === c.id ? (
              <div className="space-y-2">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className={fieldCls}
                />
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={2}
                  className={cn(fieldCls, 'resize-none')}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pitch-600 text-white hover:bg-pitch-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Spinner size="sm" className="border-white border-t-transparent" /> : <Check className="w-3.5 h-3.5" />}
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-turf-500 hover:bg-turf-100 dark:hover:bg-turf-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-turf-900 dark:text-turf-100">{c.title}</p>
                  {c.description && (
                    <p className="text-xs text-turf-400 dark:text-turf-500 mt-0.5 line-clamp-2">{c.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(c)}
                    className="p-1.5 rounded-lg text-turf-300 dark:text-turf-600 hover:text-pitch-500 hover:bg-pitch-50 dark:hover:bg-pitch-950/20 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="p-1.5 rounded-lg text-turf-300 dark:text-turf-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    {deleting === c.id ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

const fieldCls = cn(
  'w-full rounded-lg border px-3 py-2 text-sm',
  'bg-white dark:bg-turf-800',
  'border-turf-200 dark:border-turf-700',
  'text-turf-900 dark:text-turf-100',
  'placeholder:text-turf-400 dark:placeholder:text-turf-500',
  'focus:outline-none focus:ring-2 focus:ring-pitch-500 focus:border-transparent',
)
