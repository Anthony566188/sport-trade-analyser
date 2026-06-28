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

// Atualiza as trincas de tempo de forma centralizada toda vez que o elapsed mudar
  useEffect(() => {
    // Regra de transição lógica baseada nos limites de PERIOD_BOUNDARIES do domínio backend
    if (elapsed <= 2700) {
      setPeriod(MatchPeriod.FIRST_HALF)
      setMinuteSecond(elapsed)
      setAdditionalMinuteSecond(0)
    } else {
      // Se ultrapassou 45 minutos (2700s), entra na regra de acréscimo do 1T ou avança para o 2T
      // Por compatibilidade com o fluxo linear da TimelinePage, calculamos o acréscimo provisório
      setPeriod(MatchPeriod.SECOND_HALF)
      if (elapsed <= 5400) {
        setMinuteSecond(elapsed)
        setAdditionalMinuteSecond(0)
      } else {
        setMinuteSecond(5400)
        setAdditionalMinuteSecond(elapsed - 5400)
      }
    }
  }, [elapsed])

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