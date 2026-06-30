import React, { useState, useRef, useEffect, useCallback } from 'react'
import { LayoutGrid, CircleDollarSign, ChevronUp, Receipt } from 'lucide-react'
import { cn } from '../../utils/cn'

const WIDGET_WIDTH = 360

export const BetWidget: React.FC = () => {
  const [isOpen, setIsOpen]     = useState(false)
  const [leftPos, setLeftPos]   = useState<number | null>(null) // null → usa CSS right:16px
  const [isDragging, setIsDragging] = useState(false)

  const widgetRef  = useRef<HTMLDivElement>(null)
  const dragState  = useRef({ startClientX: 0, startLeft: 0, hasMoved: false })

  // ── Inicia arrasto ───────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = widgetRef.current?.getBoundingClientRect()
    if (!rect) return

    dragState.current = {
      startClientX: e.clientX,
      startLeft: rect.left,
      hasMoved: false,
    }

    // Fixa posição em `left` para poder arrastar
    setLeftPos(rect.left)
    setIsDragging(true)
  }, [])

  // ── Listeners globais de movimento/soltura ───────────────────────────────
  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragState.current.startClientX

      if (Math.abs(delta) > 4) {
        dragState.current.hasMoved = true
      }

      const newLeft = dragState.current.startLeft + delta
      const maxLeft = window.innerWidth - WIDGET_WIDTH - 8
      setLeftPos(Math.max(8, Math.min(newLeft, maxLeft)))
    }

    const onMouseUp = () => setIsDragging(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [isDragging])

  // ── Clique no header: abre/fecha somente se não arrastou ─────────────────
  const handleHeaderClick = useCallback(() => {
    if (!dragState.current.hasMoved) {
      setIsOpen(prev => !prev)
    }
  }, [])

  // ── Posição: usa `left` após arrasto, senão `right` padrão ───────────────
  const positionStyle: React.CSSProperties =
    leftPos !== null ? { left: leftPos } : { right: 16 }

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-4 z-50 select-none"
      style={{ ...positionStyle, width: WIDGET_WIDTH }}
    >
      {/* ── Corpo (estado expandido) ── */}
      {isOpen && (
        <div
          className={cn(
            'rounded-t-2xl border border-b-0 border-pitch-600/60',
            'bg-turf-900 dark:bg-turf-950',
            'overflow-hidden',
          )}
        >
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            {/* Ícone vazio */}
            <div className="p-3 rounded-xl bg-turf-800 text-turf-500">
              <Receipt className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-turf-500 dark:text-turf-400">
              Nenhuma seleção ainda.
            </p>
          </div>
        </div>
      )}

      {/* ── Header / Handle ── */}
      <div
        onMouseDown={handleMouseDown}
        onClick={handleHeaderClick}
        className={cn(
          'flex items-center gap-2.5 px-4 py-3',
          'bg-pitch-600 text-white',
          isOpen ? 'rounded-b-2xl' : 'rounded-2xl',
          'shadow-lg shadow-pitch-900/30',
          'transition-all duration-150',
        )}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        aria-expanded={isOpen}
        aria-label="Painel de Apostas"
        role="button"
      >
        {/* Ícones de identidade */}
        <LayoutGrid       className="w-4 h-4 opacity-80 shrink-0" />
        <CircleDollarSign className="w-4 h-4 opacity-80 shrink-0" />

        <span className="text-sm font-semibold flex-1 tracking-wide">
          Apostas
        </span>

        {/* Seta indica que o painel abre para cima */}
        <ChevronUp
          className={cn(
            'w-4 h-4 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </div>
    </div>
  )
}