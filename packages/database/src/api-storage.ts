import type { VigiloStorage, VigiloState, Pos, Connection, DisplayMode, TodoStatus } from '@remcostoeten/vigilo-core'

export interface ApiStorageConfig {
  /** Base URL for your API endpoints */
  baseUrl: string
  /** Instance identifier for namespacing */
  instanceId: string
  /** Optional authentication token */
  token?: string
  /** Optional custom headers */
  headers?: Record<string, string>
  /** Request timeout in milliseconds ( defaults to 5000 ) */
  timeout?: number
}

export interface VigiloApiEndpoints {
  loadState: string
  savePosition: string
  saveConnections: string
  saveDisplayMode: string
  saveHidden: string
  saveShowLines: string
  saveShowBadges: string
  saveLineColor: string
  saveLineOpacity: string
  saveComponentOpacity: string
  saveStatuses: string
}

/**
 * Creates a VigiloStorage adapter that communicates with a REST API.
 * This allows users to persist Vigilo state in their own database.
 * 
 * @example
 * ```tsx
 * const storage = createApiVigiloStorage({
 *   baseUrl: 'https://your-app.com/api/vigilo',
 *   instanceId: 'development-tasks',
 *   token: user.authToken
 * })
 * 
 * <Vigilo storage={storage} category="dev" categories={devCategories} />
 * ```
 */
export function createApiVigiloStorage(config: ApiStorageConfig): VigiloStorage {
  const {
    baseUrl,
    instanceId,
    token,
    headers = {},
    timeout = 5000
  } = config

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  }

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  const endpoints: VigiloApiEndpoints = {
    loadState: `${baseUrl}/state/${instanceId}`,
    savePosition: `${baseUrl}/position/${instanceId}`,
    saveConnections: `${baseUrl}/connections/${instanceId}`,
    saveDisplayMode: `${baseUrl}/display-mode/${instanceId}`,
    saveHidden: `${baseUrl}/hidden/${instanceId}`,
    saveShowLines: `${baseUrl}/show-lines/${instanceId}`,
    saveShowBadges: `${baseUrl}/show-badges/${instanceId}`,
    saveLineColor: `${baseUrl}/line-color/${instanceId}`,
    saveLineOpacity: `${baseUrl}/line-opacity/${instanceId}`,
    saveComponentOpacity: `${baseUrl}/component-opacity/${instanceId}`,
    saveStatuses: `${baseUrl}/statuses/${instanceId}`
  }

  async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  return {
    async loadState(): Promise<Partial<VigiloState>> {
      try {
        const response = await fetchWithTimeout(endpoints.loadState)
        
        if (!response.ok) {
          if (response.status === 404) {
            // No state exists yet, return empty
            return {}
          }
          throw new Error(`Failed to load state: ${response.statusText}`)
        }

        const data = await response.json()
        return {
          position: data.position,
          connections: data.connections || [],
          displayMode: data.displayMode,
          isHidden: data.isHidden,
          showLines: data.showLines,
          showBadges: data.showBadges,
          lineColor: data.lineColor,
          lineOpacity: data.lineOpacity,
          componentOpacity: data.componentOpacity,
          statuses: data.statuses ? new Map(data.statuses) : new Map()
        }
      } catch (error) {
        console.error('Vigilo API storage load error:', error)
        // Return empty state on error to allow app to continue
        return {}
      }
    },

    async savePosition(position: Pos): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.savePosition, {
          method: 'POST',
          body: JSON.stringify({ x: position.x, y: position.y })
        })
      } catch (error) {
        console.error('Vigilo API storage position write error:', error)
      }
    },

    async saveConnections(connections: Connection[]): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.saveConnections, {
          method: 'POST',
          body: JSON.stringify({ connections })
        })
      } catch (error) {
        console.error('Vigilo API storage connections write error:', error)
      }
    },

    async saveDisplayMode(mode: DisplayMode): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.saveDisplayMode, {
          method: 'POST',
          body: JSON.stringify({ displayMode: mode })
        })
      } catch (error) {
        console.error('Vigilo API storage display mode write error:', error)
      }
    },

    async saveHidden(isHidden: boolean): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.saveHidden, {
          method: 'POST',
          body: JSON.stringify({ isHidden })
        })
      } catch (error) {
        console.error('Vigilo API storage hidden write error:', error)
      }
    },

    async saveShowLines(showLines: boolean): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.saveShowLines, {
          method: 'POST',
          body: JSON.stringify({ showLines })
        })
      } catch (error) {
        console.error('Vigilo API storage lines write error:', error)
      }
    },

    async saveShowBadges(showBadges: boolean): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.saveShowBadges, {
          method: 'POST',
          body: JSON.stringify({ showBadges })
        })
      } catch (error) {
        console.error('Vigilo API storage badges write error:', error)
      }
    },

    async saveLineColor(color: string): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.saveLineColor, {
          method: 'POST',
          body: JSON.stringify({ lineColor: color })
        })
      } catch (error) {
        console.error('Vigilo API storage line color write error:', error)
      }
    },

    async saveLineOpacity(opacity: number): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.saveLineOpacity, {
          method: 'POST',
          body: JSON.stringify({ lineOpacity: opacity })
        })
      } catch (error) {
        console.error('Vigilo API storage line opacity write error:', error)
      }
    },

    async saveComponentOpacity(opacity: number): Promise<void> {
      try {
        await fetchWithTimeout(endpoints.saveComponentOpacity, {
          method: 'POST',
          body: JSON.stringify({ componentOpacity: opacity })
        })
      } catch (error) {
        console.error('Vigilo API storage component opacity write error:', error)
      }
    },

    async saveStatuses(statuses: Map<number, TodoStatus>): Promise<void> {
      try {
        const statusObj: Record<string, TodoStatus> = {}
        for (const [idx, stat] of Array.from(statuses.entries())) {
          statusObj[idx.toString()] = stat
        }
        await fetchWithTimeout(endpoints.saveStatuses, {
          method: 'POST',
          body: JSON.stringify({ statuses: statusObj })
        })
      } catch (error) {
        console.error('Vigilo API storage statuses write error:', error)
      }
    }
  }
}
