import type { StorageKeys, VigiloState, VigiloStorage } from './types'

const DEFAULT_POSITION = { x: 20, y: 20 }
const DEFAULT_LINE_COLOR = '#3b82f6'
const DEFAULT_LINE_OPACITY = 0.6
const DEFAULT_COMPONENT_OPACITY = 1

export type VigiloStateOverrides = Partial<VigiloState>

/**
 * Creates a default Vigilo state shape that downstream frameworks can extend.
 */
export function createDefaultState(overrides?: VigiloStateOverrides): VigiloState {
  return {
    position: overrides?.position
      ? { ...overrides.position }
      : { ...DEFAULT_POSITION },
    connections: overrides?.connections
      ? [...overrides.connections]
      : [],
    displayMode: overrides?.displayMode ?? 'full',
    isHidden: overrides?.isHidden ?? false,
    showLines: overrides?.showLines ?? true,
    showBadges: overrides?.showBadges ?? true,
    lineColor: overrides?.lineColor ?? DEFAULT_LINE_COLOR,
    lineOpacity: overrides?.lineOpacity ?? DEFAULT_LINE_OPACITY,
    componentOpacity: overrides?.componentOpacity ?? DEFAULT_COMPONENT_OPACITY,
    statuses: overrides?.statuses
      ? new Map(overrides.statuses)
      : new Map(),
  }
}

/**
 * Hydrates persisted state from storage and merges it with runtime overrides.
 */
export function hydrateState(storage: VigiloStorage, overrides?: VigiloStateOverrides): VigiloState {
  const saved = storage.loadState()
  return createDefaultState({
    ...saved,
    ...overrides,
    statuses: overrides?.statuses ?? saved.statuses,
  })
}
