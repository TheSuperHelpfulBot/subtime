import { useState } from 'react'
import TimerConfigForm from './timer/TimerConfigForm'
import { writeJson } from './storage/appStorage'

export default function App() {
  const [phase, setPhase] = useState<'welcome' | 'timer'>('welcome')

  if (phase === 'timer') {
    return (
      <main className="welcome">
        <div className="welcome-inner timer-layout">
          <TimerConfigForm />
        </div>
      </main>
    )
  }

  return (
    <main className="welcome">
      <div className="welcome-inner">
        <h1>Simple Subs</h1>
        <p className="tagline">Substitution scheduling made simple.</p>
        <button
          type="button"
          className="cta"
          onClick={() => {
            writeJson('onboarding', { startedAt: Date.now() })
            setPhase('timer')
          }}
        >
          Get started
        </button>
      </div>
    </main>
  )
}
