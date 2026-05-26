export type AppUpdateEvent = {
  updateNow: () => void | Promise<void>
}

type UpdateListener = (event: AppUpdateEvent) => void

const listeners = new Set<UpdateListener>()
let pendingUpdate: AppUpdateEvent | null = null

export function notifyAppUpdateAvailable(updateNow: AppUpdateEvent['updateNow'] = () => {
  window.location.reload()
}) {
  pendingUpdate = { updateNow }
  for (const listener of listeners) listener(pendingUpdate)
}

export function subscribeToAppUpdates(listener: UpdateListener): () => void {
  listeners.add(listener)
  if (pendingUpdate) listener(pendingUpdate)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('subtime:update-available', () => {
    notifyAppUpdateAvailable()
  })
}
