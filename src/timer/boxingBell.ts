let sharedContext: AudioContext | null = null

function audioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  )
}

function ensureAudioContext(): AudioContext | null {
  const AudioCtx = audioContextConstructor()
  if (!AudioCtx) return null
  sharedContext ??= new AudioCtx()
  return sharedContext
}

/** Resume audio after a user gesture so later bells can play on mobile. */
export function primeBoxingBellAudio(): void {
  const ctx = ensureAudioContext()
  if (!ctx) return
  void ctx.resume()
}

function playStrike(
  ctx: AudioContext,
  startTime: number,
  frequency: number,
  volume: number,
): void {
  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)

  const strikeDuration = 1.35
  masterGain.gain.setValueAtTime(0, startTime)
  masterGain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + strikeDuration)

  const partials: Array<[ratio: number, amplitude: number]> = [
    [1, 1],
    [2.17, 0.55],
    [3.37, 0.28],
    [4.55, 0.14],
    [5.71, 0.07],
  ]

  for (const [ratio, amplitude] of partials) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency * ratio
    const partialGain = ctx.createGain()
    partialGain.gain.value = amplitude
    osc.connect(partialGain)
    partialGain.connect(masterGain)
    osc.start(startTime)
    osc.stop(startTime + strikeDuration + 0.05)
  }
}

/** Round-start bell: two quick strikes when sub recommendations appear. */
export function playBoxingRoundStartBell(): void {
  const ctx = ensureAudioContext()
  if (!ctx) return
  void ctx.resume()

  const now = ctx.currentTime
  playStrike(ctx, now + 0.05, 880, 0.42)
  playStrike(ctx, now + 0.42, 880, 0.42)
}

/** Round-end bell: three strikes when sub recommendations clear. */
export function playBoxingRoundEndBell(): void {
  const ctx = ensureAudioContext()
  if (!ctx) return
  void ctx.resume()

  const now = ctx.currentTime
  const gap = 0.36
  playStrike(ctx, now + 0.05, 660, 0.4)
  playStrike(ctx, now + 0.05 + gap, 660, 0.4)
  playStrike(ctx, now + 0.05 + gap * 2, 660, 0.4)
}
