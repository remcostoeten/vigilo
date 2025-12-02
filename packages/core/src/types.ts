/** Pixel coordinates for overlay positioning */
export type Pos = {
  x: number
  y: number
}

export type TodoStatus = 'todo' | 'working' | 'done'

/** Individual task metadata surfaced inside Vigilo */
export type TodoItem = {
  text: string
  action?: string
  info?: string
  description?: string
  notes?: string
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

/** Group of related todo items shown inside the overlay */
export type CategoryConfig<ID extends string = string, Item extends TodoItem = TodoItem> = {
  id: ID
  displayName?: string
  items: Item[]
}

export type Connection = {
  todoIndex: number
  targetSelector?: string
  targetLabel?: string
  targetPosition?: Pos
}

export type DisplayMode = 'full' | 'compact' | 'minimal'

export type UndoSnapshot = {
  displayMode: DisplayMode
  isHidden: boolean
}

/** Config shared between core and React entry points */
export type VigiloConfig<CategoryId extends string = string> = {
  category: CategoryId
  instanceId?: string
}

export type StorageKeys = {
  pos: string
  col: string
  con: string
  mode: string
  hidden: string
  lines: string
  badges: string
  lineColor: string
  lineOpacity: string
  componentOpacity: string
  statuses: string
}

export type VigiloState = {
  position: Pos
  connections: Connection[]
  displayMode: DisplayMode
  isHidden: boolean
  showLines: boolean
  showBadges: boolean
  lineColor: string
  lineOpacity: number
  componentOpacity: number
  statuses: Map<number, TodoStatus>
}

export interface VigiloStorage {
  loadState(): Partial<VigiloState>
  savePosition(position: Pos): void
  saveConnections(connections: Connection[]): void
  saveDisplayMode(mode: DisplayMode): void
  saveHidden(isHidden: boolean): void
  saveShowLines(showLines: boolean): void
  saveShowBadges(showBadges: boolean): void
  saveLineColor(color: string): void
  saveLineOpacity(opacity: number): void
  saveComponentOpacity(opacity: number): void
  saveStatuses(statuses: Map<number, TodoStatus>): void
}
