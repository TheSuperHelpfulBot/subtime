import type { GameTimerRunStatus } from './gameTimer'

export function shouldKeepScreenAwake(runStatus: GameTimerRunStatus): boolean {
  return runStatus === 'running'
}

export async function requestScreenWakeLock(): Promise<WakeLockSentinel | null> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return null
  }

  try {
    return await navigator.wakeLock.request('screen')
  } catch {
    return null
  }
}

export function releaseScreenWakeLock(lock: WakeLockSentinel | null | undefined): void {
  if (!lock) return
  void lock.release().catch(() => {})
}
