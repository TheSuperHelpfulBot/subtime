import { useCallback, useState } from 'react'
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
    <div className="load-saved" data-testid="load-saved-screen">
      <h2 className="load-saved-title">Load Saved Game Type</h2>
      <p className="timer-config-lead">
        Choose a saved setup or create a new game type.
      </p>

      <button type="button" className="cta load-saved-create" onClick={onCreateNew}>
        Create New Game Type
      </button>

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
                <div className="game-types-item-actions">
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => onStartGame(gt)}
                  >
                    Start game
                  </button>
                  <button type="button" className="btn-text" onClick={() => onEdit(gt)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-text danger"
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
    </div>
  )
}
