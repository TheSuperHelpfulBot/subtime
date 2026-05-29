import { useEffect, useRef } from 'react'
import { playBoxingRoundEndBell, playBoxingRoundStartBell } from './boxingBell'
import { subRecommendationAlertTransition } from './subRecommendationAlert'

/** Plays boxing bells when recommended sub pairs appear or disappear during play. */
export function useSubRecommendationBell(hasPairs: boolean, enabled: boolean) {
  const hadPairsRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      hadPairsRef.current = hasPairs
      return
    }

    const alert = subRecommendationAlertTransition(hadPairsRef.current, hasPairs)
    hadPairsRef.current = hasPairs

    if (alert === 'start') playBoxingRoundStartBell()
    else if (alert === 'end') playBoxingRoundEndBell()
  }, [hasPairs, enabled])
}
