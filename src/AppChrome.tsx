import { useEffect, useRef, useState } from 'react'
import { subscribeToAppUpdates, type AppUpdateEvent } from './pwaUpdate'
import { APP_VERSION_INFO, formatAppVersionLabel, formatBuildTime } from './version'

function AppMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  return (
    <>
      <div className="app-menu" ref={menuRef}>
        <button
          type="button"
          className="app-menu-button"
          aria-label="Open app menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>
        {menuOpen ? (
          <div className="app-menu-popover" role="menu">
            <button
              type="button"
              role="menuitem"
              className="app-menu-item"
              onClick={() => {
                setMenuOpen(false)
                setAboutOpen(true)
              }}
            >
              About
            </button>
          </div>
        ) : null}
      </div>

      {aboutOpen ? (
        <div className="app-modal-backdrop" role="presentation">
          <section
            className="app-about-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
          >
            <h2 id="about-title">About Simple Subs</h2>
            <dl className="app-about-details">
              <div>
                <dt>Version</dt>
                <dd>Version {APP_VERSION_INFO.version}</dd>
              </div>
              <div>
                <dt>Build</dt>
                <dd>{formatBuildTime(APP_VERSION_INFO.buildTime)}</dd>
              </div>
              <div>
                <dt>Commit</dt>
                <dd>{formatAppVersionLabel(APP_VERSION_INFO)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setAboutOpen(false)}
            >
              Close
            </button>
          </section>
        </div>
      ) : null}
    </>
  )
}

function UpdateAvailablePrompt() {
  const [updateEvent, setUpdateEvent] = useState<AppUpdateEvent | null>(null)

  useEffect(() => subscribeToAppUpdates(setUpdateEvent), [])

  if (!updateEvent) return null

  return (
    <aside
      className="update-available-prompt"
      data-testid="update-available-prompt"
      role="status"
    >
      <div>
        <p className="update-available-title">Update available</p>
        <p className="update-available-copy">
          A newer version is ready. Update when you are not in the middle of a game.
        </p>
      </div>
      <div className="update-available-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setUpdateEvent(null)}
        >
          Later
        </button>
        <button
          type="button"
          className="cta update-now"
          onClick={() => {
            void updateEvent.updateNow()
          }}
        >
          Update now
        </button>
      </div>
    </aside>
  )
}

export default function AppChrome() {
  return (
    <>
      <AppMenu />
      <UpdateAvailablePrompt />
    </>
  )
}
