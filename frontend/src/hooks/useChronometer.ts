import { useState, useEffect, useCallback, useRef } from 'react'
import { MatchPeriod } from '../types'

export type ChronometerStatus = 'idle' | 'running' | 'paused' | 'stopped'

export function useChronometer() {
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<ChronometerStatus>('idle')
  const [period, setPeriod] = useState<MatchPeriod>(MatchPeriod.FIRST_HALF)
  const [minuteSecond, setMinuteSecond] = useState(0)
  const [additionalMinuteSecond, setAdditionalMinuteSecond] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

// Atualiza as trincas de tempo de forma centralizada toda vez que o elapsed ou o period mudar
  useEffect(() => {
    let calcMinSec = 0
    let calcAdd = 0

    // O cálculo obedece ao estado explícito atual do MatchPeriod
    switch (period) {
      case MatchPeriod.FIRST_HALF:
        calcMinSec = Math.min(elapsed, 2700)
        calcAdd = Math.max(0, elapsed - 2700)
        break
      case MatchPeriod.HALF_TIME:
        calcMinSec = 2700
        calcAdd = 0
        break
      case MatchPeriod.SECOND_HALF:
        calcMinSec = Math.min(elapsed, 5400)
        calcAdd = Math.max(0, elapsed - 5400)
        break
      case MatchPeriod.EXTRA_FIRST:
        calcMinSec = Math.min(elapsed, 6300)
        calcAdd = Math.max(0, elapsed - 6300)
        break
      case MatchPeriod.EXTRA_SECOND:
        calcMinSec = Math.min(elapsed, 7200)
        calcAdd = Math.max(0, elapsed - 7200)
        break
      default:
        calcMinSec = elapsed
        calcAdd = 0
    }

    setMinuteSecond(calcMinSec)
    setAdditionalMinuteSecond(calcAdd)
  }, [elapsed, period])

  // Inicia o cronômetro com um tempo base e define o estado inicial
  const initialize = useCallback((startSeconds: number, autoStart: boolean = false) => {
    setElapsed(startSeconds)
    setStatus(autoStart ? 'running' : 'paused')
  }, [])

  // Alterna entre rodando e pausado
  const togglePlayPause = useCallback(() => {
    setStatus(prev => {
      if (prev === 'idle' || prev === 'stopped') return 'running'
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

  // Altera e fixa o período da partida manualmente de forma explícita
  const setMatchPeriod = useCallback((newPeriod: MatchPeriod) => {
    setPeriod(newPeriod)
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
    period,
    minuteSecond,
    additionalMinuteSecond,
    initialize,
    togglePlayPause,
    pause,
    seek,
    setTime,
    setMatchPeriod,
  }
}