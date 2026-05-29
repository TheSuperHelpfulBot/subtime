import { useEffect } from 'react'
import {
  releaseScreenWakeLock,
  requestScreenWakeLock,
  shouldKeepScreenAwake,
} from './screenWakeLock'
import type { GameTimerRunStatus } from './gameTimer'

/** Keeps the screen awake while the game clock is running (Screen Wake Lock API). */
export function useScreenWakeLockForTimer(runStatus: GameTimerRunStatus) {
  const active = shouldKeepScreenAwake(runStatus)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    let lock: WakeLockSentinel | null = null

    const acquire = async () => {
      const next = await requestScreenWakeLock()
      if (cancelled) {
        releaseScreenWakeLock(next)
        return
      }
      releaseScreenWakeLock(lock)
      lock = next
    }

    void acquire()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquire()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      releaseScreenWakeLock(lock)
      lock = null
    }
  }, [active])
}
