/**
 * Represents a 2D position with x and y coordinates.
 * Used for positioning the Vigilo overlay on the screen.
 */
export type Pos = {
  /** The horizontal coordinate. */
  x: number
  /** The vertical coordinate. */
  y: number
}

/**
 * Defines the possible statuses for a `TodoItem`.
 */
export type TodoStatus = 'todo' | 'working' | 'done'

/**
 * Represents a single task item within a Vigilo category.
 * This is the core data structure for a task.
 */
export type TodoItem = {
  /** The main text content of the task. */
  text: string
  /** An optional short action label (e.g., 'fix', 'add', 'feat'). */
  action?: string
  /** Optional short informational text displayed with the task. */
  info?: string
  /** A longer, more detailed description of the task. */
  description?: string
  /** Additional notes or comments for the task. */
  notes?: string
  /** The priority level of the task. */
  priority?: 'low' | 'medium' | 'high'
  /** An array of tags for categorizing or filtering tasks. */
  tags?: string[]
  /** The creation timestamp of the task in ISO 8601 format. */
  createdAt?: string
  /** The last updated timestamp of the task in ISO 8601 format. */
  updatedAt?: string
}

/**
 * Defines a group of related todo items, forming a category in the Vigilo overlay.
 * @template ID - The type of the category identifier, defaults to `string`.
 * @template Item - The type of the todo items in the category, defaults to `TodoItem`.
 */
export type CategoryConfig<ID extends string = string, Item extends TodoItem = TodoItem> = {
  /** A unique identifier for the category. */
  id: ID
  /** An optional display name for the category. If not provided, the `id` is used. */
  displayName?: string
  /** An array of todo items belonging to this category. */
  items: Item[]
}

/**
 * Represents a connection between a `TodoItem` and an element in the DOM or a free-roam position.
 */
export type Connection = {
  /** The index of the `TodoItem` this connection belongs to. */
  todoIndex: number
  /** A CSS selector to identify the target DOM element. Mutually exclusive with `targetPosition`. */
  targetSelector?: string
  /** A descriptive label for the target element, extracted from the DOM. */
  targetLabel?: string
  /** The absolute x/y coordinates for a "freeroam" connection. Mutually exclusive with `targetSelector`. */
  targetPosition?: Pos
}

/**
 * Defines the display modes for the Vigilo panel.
 * - `full`: Shows all details.
 * - `compact`: A smaller version with less detail.
 * - `minimal`: A minimal dot that expands on hover.
 */
export type DisplayMode = 'full' | 'compact' | 'minimal'

/**
 * A snapshot of the Vigilo state used for the undo functionality.
 */
export type UndoSnapshot = {
  /** The display mode at the time of the snapshot. */
  displayMode: DisplayMode
  /** The visibility state at the time of the snapshot. */
  isHidden: boolean
}

/**
 * Base configuration for a Vigilo instance.
 * @template CategoryId - The type of the category identifier.
 */
export type VigiloConfig<CategoryId extends string = string> = {
  /** The ID of the category to be displayed in this Vigilo instance. */
  category: CategoryId
  /** An optional unique identifier for the Vigilo instance, used for namespacing storage. Defaults to the `category` id. */
  instanceId?: string
}

/**
 * A set of keys used for namespacing data in `localStorage`.
 */
export type StorageKeys = {
  /** Key for the panel's position. */
  pos: string
  /** Legacy key for the collapsed state. */
  col: string
  /** Key for the connections data. */
  con: string
  /** Key for the display mode. */
  mode: string
  /** Key for the hidden state. */
  hidden: string
  /** Key for the line visibility state. */
  lines: string
  /** Key for the badge visibility state. */
  badges: string
  /** Key for the line color. */
  lineColor: string
  /** Key for the line opacity. */
  lineOpacity: string
  /** Key for the component opacity. */
  componentOpacity: string
  /** Key for the task statuses. */
  statuses: string
}

/**
* Represents the complete state of a Vigilo instance.
*/
export type VigiloState = {
  /** The current position of the Vigilo panel. */
  position: Pos
  /** An array of all connections. */
  connections: Connection[]
  /** The current display mode of the panel. */
  displayMode: DisplayMode
  /** Whether the panel is currently hidden. */
  isHidden: boolean
  /** Whether to show the connection lines. */
  showLines: boolean
  /** Whether to show the action badges on tasks. */
  showBadges: boolean
  /** The color of the connection lines. */
  lineColor: string
  /** The opacity of the connection lines (0 to 1). */
  lineOpacity: number
  /** The overall opacity of the component (0.1 to 1). */
  componentOpacity: number
  /** A map of task statuses, with the key being the task index. */
  statuses: Map<number, TodoStatus>
}

/**
 * Defines the contract for a storage adapter, allowing for pluggable persistence.
 * Any storage mechanism (localStorage, database via API, etc.) can be used by implementing this interface.
 */
export interface VigiloStorage {
  /**
   * Loads the partial state from the storage.
   * Should return an empty object if no state is found.
   * @returns A partial `VigiloState` object.
   */
  loadState(): Partial<VigiloState>

  /**
   * Saves the panel's position.
   * @param position - The new position to save.
   */
  savePosition(position: Pos): void

  /**
   * Saves the connections array.
   * @param connections - The array of connections to save.
   */
  saveConnections(connections: Connection[]): void

  /**
   * Saves the current display mode.
   * @param mode - The display mode to save.
   */
  saveDisplayMode(mode: DisplayMode): void

  /**
   * Saves the hidden state of the panel.
   * @param isHidden - Whether the panel is hidden.
   */
  saveHidden(isHidden: boolean): void

  /**
   * Saves the visibility state of the connection lines.
   * @param showLines - Whether the lines are shown.
   */
  saveShowLines(showLines: boolean): void

  /**
   * Saves the visibility state of the task badges.
   * @param showBadges - Whether the badges are shown.
   */
  saveShowBadges(showBadges: boolean): void

  /**
   * Saves the color of the connection lines.
   * @param color - The color to save.
   */
  saveLineColor(color: string): void

  /**
   * Saves the opacity of the connection lines.
   * @param opacity - The opacity value (0 to 1).
   */
  saveLineOpacity(opacity: number): void

  /**
   * Saves the overall opacity of the component.
   * @param opacity - The opacity value (0.1 to 1).
   */
  saveComponentOpacity(opacity: number): void

  /**
   * Saves the map of task statuses.
   * @param statuses - The map of statuses to save.
   */
  saveStatuses(statuses: Map<number, TodoStatus>): void
}
