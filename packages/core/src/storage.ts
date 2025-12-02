import type { StorageKeys, VigiloState, DisplayMode, TodoStatus, VigiloStorage, Pos } from './types'

/**
 * The prefix for all localStorage keys used by Vigilo.
 * @internal
 */
const STORAGE_PREFIX = 'vigilo-state-'

/**
 * Creates a set of namespaced localStorage keys for a specific Vigilo instance.
 * This prevents state from multiple instances on the same page from colliding.
 * @param instanceKey - A unique key for the Vigilo instance.
 * @returns A `StorageKeys` object with namespaced keys.
 * @internal
 */
function createStorageKeys(instanceKey: string): StorageKeys {
  return {
    pos: `${STORAGE_PREFIX}pos-${instanceKey}`,
    col: `${STORAGE_PREFIX}col-${instanceKey}`,
    con: `${STORAGE_PREFIX}con-${instanceKey}`,
    mode: `${STORAGE_PREFIX}mode-${instanceKey}`,
    hidden: `${STORAGE_PREFIX}hidden-${instanceKey}`,
    lines: `${STORAGE_PREFIX}lines-${instanceKey}`,
    badges: `${STORAGE_PREFIX}badges-${instanceKey}`,
    lineColor: `${STORAGE_PREFIX}lineColor-${instanceKey}`,
    lineOpacity: `${STORAGE_PREFIX}lineOpacity-${instanceKey}`,
    componentOpacity: `${STORAGE_PREFIX}componentOpacity-${instanceKey}`,
    statuses: `${STORAGE_PREFIX}statuses-${instanceKey}`,
  }
}

/**
 * Creates a `VigiloStorage` adapter that uses the browser's `localStorage`.
 * This is the default persistence mechanism for Vigilo.
 * @param instanceKey - A unique key to namespace the storage for this Vigilo instance.
 * @returns A `VigiloStorage` object that interacts with `localStorage`.
 */
export function createLocalStorageVigiloStorage(instanceKey: string): VigiloStorage {
  const keys = createStorageKeys(instanceKey)

  return {
    loadState(): Partial<VigiloState> {
      const state: Partial<VigiloState> = {}

      try {
        const savedPos = localStorage.getItem(keys.pos)
        const savedCon = localStorage.getItem(keys.con)
        const savedCol = localStorage.getItem(keys.col)
        const savedMode = localStorage.getItem(keys.mode)
        const savedLines = localStorage.getItem(keys.lines)
        const savedBadges = localStorage.getItem(keys.badges)
        const savedHidden = localStorage.getItem(keys.hidden)
        const savedStatuses = localStorage.getItem(keys.statuses)
        const savedLineColor = localStorage.getItem(keys.lineColor)
        const savedLineOpacity = localStorage.getItem(keys.lineOpacity)
        const savedComponentOpacity = localStorage.getItem(keys.componentOpacity)

        if (savedPos) {
          try {
            state.position = JSON.parse(savedPos)
          } catch {
            // ignore malformed position
          }
        }

        if (savedCon) {
          try {
            state.connections = JSON.parse(savedCon)
          } catch {
            // ignore malformed connections
          }
        }

        if (savedMode) {
          try {
            const parsed = JSON.parse(savedMode) as DisplayMode
            if (parsed === 'full' || parsed === 'compact' || parsed === 'minimal') {
              state.displayMode = parsed
            }
          } catch {
            // ignore malformed mode
          }
        } else if (savedCol) {
          try {
            const collapsed = JSON.parse(savedCol) as boolean
            state.displayMode = collapsed ? 'compact' : 'full'
          } catch {
            // ignore malformed collapsed flag
          }
        }

        if (savedHidden) {
          try {
            state.isHidden = JSON.parse(savedHidden)
          } catch {
            // ignore malformed hidden flag
          }
        }

        if (savedLines) {
          try {
            state.showLines = JSON.parse(savedLines)
          } catch {
            // ignore malformed lines flag
          }
        }

        if (savedBadges) {
          try {
            state.showBadges = JSON.parse(savedBadges)
          } catch {
            // ignore malformed badges flag
          }
        }

        if (savedLineColor) {
          try {
            state.lineColor = JSON.parse(savedLineColor)
          } catch {
            // ignore malformed line color
          }
        }

        if (savedLineOpacity) {
          try {
            const opacity = JSON.parse(savedLineOpacity)
            if (typeof opacity === 'number' && opacity >= 0 && opacity <= 1) {
              state.lineOpacity = opacity
            }
          } catch {
            // ignore malformed line opacity
          }
        }

        if (savedComponentOpacity) {
          try {
            const opacity = JSON.parse(savedComponentOpacity)
            if (typeof opacity === 'number' && opacity >= 0 && opacity <= 1) {
              state.componentOpacity = opacity
            }
          } catch {
            // ignore malformed component opacity
          }
        }

        if (savedStatuses) {
          try {
            const parsed = JSON.parse(savedStatuses) as Record<string, TodoStatus>
            const statusMap = new Map<number, TodoStatus>()
            for (const [key, value] of Object.entries(parsed)) {
              const index = parseInt(key, 10)
              if (!isNaN(index) && (value === 'todo' || value === 'working' || value === 'done')) {
                statusMap.set(index, value)
              }
            }
            state.statuses = statusMap
          } catch {
            // ignore malformed statuses
          }
        }
      } catch (e) {
        console.error('Vigilo storage read error', e)
      }

      return state
    },

    savePosition(position: Pos): void {
      try {
        localStorage.setItem(keys.pos, JSON.stringify(position))
      } catch (e) {
        console.error('Vigilo position write error', e)
      }
    },

    saveConnections(connections: unknown[]): void {
      try {
        localStorage.setItem(keys.con, JSON.stringify(connections))
      } catch (e) {
        console.error('Vigilo connections write error', e)
      }
    },

    saveDisplayMode(mode: DisplayMode): void {
      try {
        localStorage.setItem(keys.mode, JSON.stringify(mode))
      } catch (e) {
        console.error('Vigilo mode write error', e)
      }
    },

    saveHidden(isHidden: boolean): void {
      try {
        localStorage.setItem(keys.hidden, JSON.stringify(isHidden))
      } catch (e) {
        console.error('Vigilo hidden write error', e)
      }
    },

    saveShowLines(showLines: boolean): void {
      try {
        localStorage.setItem(keys.lines, JSON.stringify(showLines))
      } catch (e) {
        console.error('Vigilo lines write error', e)
      }
    },

    saveShowBadges(showBadges: boolean): void {
      try {
        localStorage.setItem(keys.badges, JSON.stringify(showBadges))
      } catch (e) {
        console.error('Vigilo badges write error', e)
      }
    },

    saveLineColor(color: string): void {
      try {
        localStorage.setItem(keys.lineColor, JSON.stringify(color))
      } catch (e) {
        console.error('Vigilo line color write error', e)
      }
    },

    saveLineOpacity(opacity: number): void {
      try {
        localStorage.setItem(keys.lineOpacity, JSON.stringify(opacity))
      } catch (e) {
        console.error('Vigilo line opacity write error', e)
      }
    },

    saveComponentOpacity(opacity: number): void {
      try {
        localStorage.setItem(keys.componentOpacity, JSON.stringify(opacity))
      } catch (e) {
        console.error('Vigilo component opacity write error', e)
      }
    },

    saveStatuses(statuses: Map<number, TodoStatus>): void {
      try {
        const statusObj: Record<string, TodoStatus> = {}
        for (const [idx, stat] of Array.from(statuses.entries())) {
          statusObj[idx.toString()] = stat
        }
        localStorage.setItem(keys.statuses, JSON.stringify(statusObj))
      } catch (e) {
        console.error('Vigilo status write error', e)
      }
    },
  }
}
