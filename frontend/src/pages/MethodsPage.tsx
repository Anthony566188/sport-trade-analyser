import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, AlertCircle, Settings } from 'lucide-react'
import api from '../services/api'
import { Spinner } from '../components/ui/Spinner'
import { cn } from '../utils/cn'
import type { Method } from '../types'

export const MethodsPage: React.FC = () => {
  const [methods,  setMethods]  = useState<Method[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // Add
  const [addName,  setAddName]  = useState('')
  const [adding,   setAdding]   = useState(false)
  const [addErr,   setAddErr]   = useState<string | null>(null)

  // Edit
  const [editId,   setEditId]   = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [saving,   setSaving]   = useState(false)

  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    api.get<Method[]>('/method')
      .then(r => setMethods(r.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Erro.'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!addName.trim()) { setAddErr('Nome obrigatório.'); return }
    setAdding(true); setAddErr(null)
    try {
      const { data } = await api.post<Method>('/method', { name: addName.trim() })
      setMethods(p => [...p, data])
      setAddName('')
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : 'Erro ao criar.')
    } finally {
      setAdding(false)
    }
  }

  const handleSave = async () => {
    if (!editName.trim() || editId == null) return
    setSaving(true)
    try {
      const { data } = await api.put<Method>(`/method/${editId}`, { name: editName.trim() })
      setMethods(p => p.map(m => m.id === editId ? data : m))
      setEditId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remover método?')) return
    setDeleting(id)
    try {
      await api.delete(`/method/${id}`)
      setMethods(p => p.filter(m => m.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro.')
    } finally {
      setDeleting(null)
    }
  }

  const field = cn(
    'w-full rounded-lg border px-3 py-2 text-sm',
    'bg-white dark:bg-turf-800 border-turf-200 dark:border-turf-700',
    'text-turf-900 dark:text-turf-100 placeholder:text-turf-400',
    'focus:outline-none focus:ring-2 focus:ring-pitch-500 focus:border-transparent',
  )

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-xl font-bold text-turf-900 dark:text-turf-100">Métodos de Aposta</h1>
        <p className="text-sm text-turf-500 dark:text-turf-400 mt-0.5">
          Crie e gerencie seus métodos de trading para associar às apostas.
        </p>
      </div>

      {/* ── Add ── */}
      <div className="p-4 rounded-xl border border-turf-200 dark:border-turf-700 bg-white dark:bg-turf-800/50 space-y-3">
        <p className="text-xs font-semibold text-turf-500 dark:text-turf-400 uppercase tracking-wide">Novo Método</p>
        <div className="flex gap-2">
          <input
            value={addName}
            onChange={e => setAddName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ex: Back Favorito HT"
            className={field}
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-pitch-600 hover:bg-pitch-700 text-white transition-colors disabled:opacity-50"
          >
            {adding ? <Spinner size="sm" className="border-white border-t-transparent" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>
        {addErr && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {addErr}
          </p>
        )}
      </div>

      {/* ── List ── */}
      {loading && <div className="flex items-center gap-2 py-8 text-turf-400 text-sm"><Spinner /> Carregando...</div>}
      {error   && <div className="text-red-500 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

      {!loading && methods.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-turf-400 dark:text-turf-500">
          <Settings className="w-8 h-8" strokeWidth={1.5} />
          <p className="text-sm">Nenhum método cadastrado ainda.</p>
        </div>
      )}

      <ul className="space-y-2">
        {methods.map(m => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-turf-100 dark:border-turf-800 bg-white dark:bg-turf-800/40">
            {editId === m.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  className={cn(field, 'flex-1')}
                  autoFocus
                />
                <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg bg-pitch-600 text-white hover:bg-pitch-700 transition-colors disabled:opacity-50">
                  {saving ? <Spinner size="sm" className="border-white border-t-transparent" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-turf-400 hover:bg-turf-100 dark:hover:bg-turf-700 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-turf-900 dark:text-turf-100">{m.name}</span>
                <button onClick={() => { setEditId(m.id); setEditName(m.name) }} className="p-1.5 rounded-lg text-turf-300 dark:text-turf-600 hover:text-pitch-500 hover:bg-pitch-50 dark:hover:bg-pitch-950/20 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id} className="p-1.5 rounded-lg text-turf-300 dark:text-turf-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  {deleting === m.id ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
