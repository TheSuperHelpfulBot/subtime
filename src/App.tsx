import { writeJson } from './storage/appStorage'

export default function App() {
  return (
    <main className="welcome">
      <div className="welcome-inner">
        <h1>Simple Subs</h1>
        <p className="tagline">Substitution scheduling made simple.</p>
        <button
          type="button"
          className="cta"
          onClick={() => writeJson('onboarding', { startedAt: Date.now() })}
        >
          Get started
        </button>
      </div>
    </main>
  )
}
