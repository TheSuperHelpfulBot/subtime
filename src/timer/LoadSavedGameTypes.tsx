import { useCallback, useState } from 'react'
import SetupScreenPanel, { SetupScreenBody, SetupScreenHeader } from '../SetupScreen'
import {
  deleteGameType,
  getGameTypes,
  type GameTypeRecord,
} from '../storage/gameTypesStorage'

export type LoadSavedGameTypesProps = {
  onCreateNew: () => void
  onEdit: (gameType: GameTypeRecord) => void
  onStartGame: (gameType: GameTypeRecord) => void
}

export default function LoadSavedGameTypes({
  onCreateNew,
  onEdit,
  onStartGame,
}: LoadSavedGameTypesProps) {
  const [items, setItems] = useState<GameTypeRecord[]>(() => getGameTypes())

  const refresh = useCallback(() => {
    setItems(getGameTypes())
  }, [])

  function handleDelete(id: string) {
    deleteGameType(id)
    refresh()
  }

  return (
    <SetupScreenPanel className="load-saved" testId="load-saved-screen">
      <SetupScreenHeader>
        <h2 className="screen-title">Load Saved Game Type</h2>
        <p className="screen-lead">Choose a saved setup or create a new game type.</p>
      </SetupScreenHeader>

      <SetupScreenBody>
        {items.length > 0 ? (
        <ul
          className="game-types-list load-saved-list"
          data-testid="saved-game-types"
          aria-label="Saved game types"
        >
          {items.map((gt) => (
            <li
              key={gt.id}
              className="game-types-item"
              data-testid={`saved-game-type-${gt.id}`}
            >
              <div className="game-types-item-main">
                <span className="game-types-item-name">{gt.name}</span>
                <div className="game-types-item-actions" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="cta"
                    onClick={() => onStartGame(gt)}
                  >
                    Select
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => onEdit(gt)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary danger-outline"
                    onClick={() => handleDelete(gt.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      
      ) : (
        <p className="game-types-empty" data-testid="saved-game-types-empty">
          No saved game types yet.
        </p>
      )}
      <p></p>
      <button type="button" className="cta" onClick={onCreateNew}>
        Create New Game Type
      </button>
      </SetupScreenBody>
    </SetupScreenPanel>
  )
}
