import { useState, useEffect, useCallback, useRef } from 'react'

export type ChronometerStatus = 'idle' | 'running' | 'paused'

export function useChronometer() {
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<ChronometerStatus>('idle')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inicia o cronômetro com um tempo base, mas o deixa pausado pronto para o play
  const initialize = useCallback((startSeconds: number, autoStart: boolean = false) => {
    setElapsed(startSeconds)
    setStatus(autoStart ? 'running' : 'paused')
  }, [])

  // Alterna entre rodando e pausado
  const togglePlayPause = useCallback(() => {
    setStatus(prev => {
      if (prev === 'idle') return 'running'
      return prev === 'running' ? 'paused' : 'running'
    })
  }, [])

  // Força a pausa (usado ao encerrar a timeline)
  const pause = useCallback(() => {
    setStatus('paused')
  }, [])

  // Avança ou recua os segundos, garantindo que não fique negativo
  const seek = useCallback((delta: number) => {
    setElapsed(prev => Math.max(0, prev + delta))
  }, [])

  // Define o tempo manualmente (usado no input de edição manual)
  const setTime = useCallback((seconds: number) => {
    setElapsed(Math.max(0, seconds))
  }, [])

  // Efeito que controla o loop do cronômetro baseado no status
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    // Cleanup para evitar vazamento de memória quando o componente desmontar
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [status])

  return {
    elapsed,
    status,
    initialize,
    togglePlayPause,
    pause,
    seek,
    setTime,
  }
}