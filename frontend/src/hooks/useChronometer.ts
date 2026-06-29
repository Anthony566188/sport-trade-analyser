import { useState, useEffect, useCallback, useRef } from 'react'
import { MatchPeriod } from '../types'

export type ChronometerStatus = 'idle' | 'running' | 'paused' | 'stopped'
export type PhaseTransitionAction = 'END_1H' | 'START_2H' | 'END_2H' | 'START_E1' | 'END_E1' | 'START_E2' | 'END_E2'

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

  // Função de transição explícita (Dirigida pela UI)
  const transitionPeriod = useCallback((action: PhaseTransitionAction) => {
    switch (action) {
      case 'END_1H':
        setPeriod(MatchPeriod.HALF_TIME)
        setStatus('paused')
        break
      case 'START_2H':
        setPeriod(MatchPeriod.SECOND_HALF)
        setElapsed(2700) // 45:00
        setStatus('running')
        break
      case 'END_2H':
        setStatus('paused')
        break
      case 'START_E1':
        setPeriod(MatchPeriod.EXTRA_FIRST)
        setElapsed(5400) // 90:00
        setStatus('running')
        break
      case 'END_E1':
        setStatus('paused')
        break
      case 'START_E2':
        setPeriod(MatchPeriod.EXTRA_SECOND)
        setElapsed(6300) // 105:00
        setStatus('running')
        break
      case 'END_E2':
        setStatus('paused')
        break
    }
  }, [])

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
    transitionPeriod,
  }
}