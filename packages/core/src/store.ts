import type {
  Connection,
  DisplayMode,
  Pos,
  TodoStatus,
  VigiloState,
  VigiloStorage,
} from './types'
import { createLocalStorageVigiloStorage } from './storage'
import { hydrateState } from './state'

type Listener = () => void

type PositionOptions = {
  persist?: boolean
}

export type VigiloStore = {
  getState: () => VigiloState
  subscribe: (listener: Listener) => () => void
  setPosition: (position: Pos, options?: PositionOptions) => void
  setConnections: (connections: Connection[]) => void
  setDisplayMode: (mode: DisplayMode) => void
  setHidden: (isHidden: boolean) => void
  setShowLines: (showLines: boolean) => void
  setShowBadges: (showBadges: boolean) => void
  setLineColor: (color: string) => void
  setLineOpacity: (opacity: number) => void
  setComponentOpacity: (opacity: number) => void
  setStatuses: (statuses: Map<number, TodoStatus>) => void
  setStatus: (index: number, status: TodoStatus) => void
  resetStatuses: () => void
}

type VigiloStoreOptions = {
  storage?: VigiloStorage
  overrides?: Partial<VigiloState>
}

/**
 * Creates a lightweight store for Vigilo state that persists via localStorage.
 */
export function createVigiloStore(
  instanceKey: string,
  options?: VigiloStoreOptions
): VigiloStore {
  const storage = options?.storage ?? createLocalStorageVigiloStorage(instanceKey)
  
  let state = hydrateState(storage, options?.overrides)

  const listeners = new Set<Listener>()

  function emit() {
    listeners.forEach((listener) => listener())
  }

  function setState(next: VigiloState) {
    state = next
    emit()
  }

  function update(partial: Partial<VigiloState>) {
    setState({
      ...state,
      ...partial,
    })
  }

  function setPosition(position: Pos, options?: PositionOptions) {
    update({ position: { ...position } })
    if (options?.persist === false) return
    storage.savePosition(position)
  }

  function setConnections(connections: Connection[]) {
    update({ connections: [...connections] })
    storage.saveConnections(connections)
  }

  function setDisplayMode(mode: DisplayMode) {
    update({ displayMode: mode })
    storage.saveDisplayMode(mode)
  }

  function setHidden(isHidden: boolean) {
    update({ isHidden })
    storage.saveHidden(isHidden)
  }

  function setShowLines(showLines: boolean) {
    update({ showLines })
    storage.saveShowLines(showLines)
  }

  function setShowBadges(showBadges: boolean) {
    update({ showBadges })
    storage.saveShowBadges(showBadges)
  }

  function setLineColor(color: string) {
    update({ lineColor: color })
    storage.saveLineColor(color)
  }

  function setLineOpacity(opacity: number) {
    update({ lineOpacity: opacity })
    storage.saveLineOpacity(opacity)
  }

  function setComponentOpacity(opacity: number) {
    update({ componentOpacity: opacity })
    storage.saveComponentOpacity(opacity)
  }

  function setStatuses(statuses: Map<number, TodoStatus>) {
    update({ statuses: new Map(statuses) })
    storage.saveStatuses(statuses)
  }

  function setStatus(index: number, status: TodoStatus) {
    const next = new Map(state.statuses)
    next.set(index, status)
    setStatuses(next)
  }

  function resetStatuses() {
    setStatuses(new Map())
  }

  return {
    getState: () => state,
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    setPosition,
    setConnections,
    setDisplayMode,
    setHidden,
    setShowLines,
    setShowBadges,
    setLineColor,
    setLineOpacity,
    setComponentOpacity,
    setStatuses,
    setStatus,
    resetStatuses,
  }
}
