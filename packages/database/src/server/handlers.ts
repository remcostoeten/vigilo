import { NextRequest, NextResponse } from 'next/server'
import type { Pos, Connection, DisplayMode, TodoStatus } from '@remcostoeten/vigilo-core'
import type { VigiloPrismaQueries } from './prisma'
import type { VigiloDrizzleQueries } from './drizzle'

export interface VigiloQueryHandler {
  loadState(instanceKey: string): Promise<any>
  savePosition(instanceKey: string, position: Pos): Promise<any>
  saveConnections(instanceKey: string, connections: Connection[]): Promise<any>
  saveDisplayMode(instanceKey: string, displayMode: DisplayMode): Promise<any>
  saveHidden(instanceKey: string, isHidden: boolean): Promise<any>
  saveShowLines(instanceKey: string, showLines: boolean): Promise<any>
  saveShowBadges(instanceKey: string, showBadges: boolean): Promise<any>
  saveLineColor(instanceKey: string, lineColor: string): Promise<any>
  saveLineOpacity(instanceKey: string, lineOpacity: number): Promise<any>
  saveComponentOpacity(instanceKey: string, componentOpacity: number): Promise<any>
  saveStatuses(instanceKey: string, statuses: Map<number, TodoStatus>): Promise<any>
}

/**
 * Generic Next.js API route handlers for Vigilo state management
 */
export class VigiloApiHandlers {
  constructor(private queries: VigiloQueryHandler) {}

  /**
   * GET /api/vigilo/state/[instanceKey]
   * Load complete state for an instance
   */
  async handleLoadState(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const state = await this.queries.loadState(params.instanceKey)
      
      if (!state) {
        return NextResponse.json({}, { status: 404 })
      }

      return NextResponse.json(state)
    } catch (error) {
      console.error('Failed to load Vigilo state:', error)
      return NextResponse.json(
        { error: 'Failed to load state' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/position/[instanceKey]
   * Save panel position
   */
  async handleSavePosition(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { x, y } = body

      if (typeof x !== 'number' || typeof y !== 'number') {
        return NextResponse.json(
          { error: 'Invalid position: x and y must be numbers' },
          { status: 400 }
        )
      }

      await this.queries.savePosition(params.instanceKey, { x, y })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo position:', error)
      return NextResponse.json(
        { error: 'Failed to save position' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/connections/[instanceKey]
   * Save connections
   */
  async handleSaveConnections(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { connections } = body

      if (!Array.isArray(connections)) {
        return NextResponse.json(
          { error: 'Invalid connections: must be an array' },
          { status: 400 }
        )
      }

      await this.queries.saveConnections(params.instanceKey, connections)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo connections:', error)
      return NextResponse.json(
        { error: 'Failed to save connections' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/display-mode/[instanceKey]
   * Save display mode
   */
  async handleSaveDisplayMode(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { displayMode } = body

      if (!['full', 'compact', 'minimal'].includes(displayMode)) {
        return NextResponse.json(
          { error: 'Invalid display mode' },
          { status: 400 }
        )
      }

      await this.queries.saveDisplayMode(params.instanceKey, displayMode)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo display mode:', error)
      return NextResponse.json(
        { error: 'Failed to save display mode' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/hidden/[instanceKey]
   * Save hidden state
   */
  async handleSaveHidden(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { isHidden } = body

      if (typeof isHidden !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid hidden state: must be boolean' },
          { status: 400 }
        )
      }

      await this.queries.saveHidden(params.instanceKey, isHidden)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo hidden state:', error)
      return NextResponse.json(
        { error: 'Failed to save hidden state' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/show-lines/[instanceKey]
   * Save show lines setting
   */
  async handleSaveShowLines(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { showLines } = body

      if (typeof showLines !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid showLines: must be boolean' },
          { status: 400 }
        )
      }

      await this.queries.saveShowLines(params.instanceKey, showLines)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo show lines:', error)
      return NextResponse.json(
        { error: 'Failed to save show lines' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/show-badges/[instanceKey]
   * Save show badges setting
   */
  async handleSaveShowBadges(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { showBadges } = body

      if (typeof showBadges !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid showBadges: must be boolean' },
          { status: 400 }
        )
      }

      await this.queries.saveShowBadges(params.instanceKey, showBadges)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo show badges:', error)
      return NextResponse.json(
        { error: 'Failed to save show badges' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/line-color/[instanceKey]
   * Save line color
   */
  async handleSaveLineColor(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { lineColor } = body

      if (typeof lineColor !== 'string') {
        return NextResponse.json(
          { error: 'Invalid lineColor: must be string' },
          { status: 400 }
        )
      }

      await this.queries.saveLineColor(params.instanceKey, lineColor)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo line color:', error)
      return NextResponse.json(
        { error: 'Failed to save line color' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/line-opacity/[instanceKey]
   * Save line opacity
   */
  async handleSaveLineOpacity(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { lineOpacity } = body

      if (typeof lineOpacity !== 'number' || lineOpacity < 0 || lineOpacity > 1) {
        return NextResponse.json(
          { error: 'Invalid lineOpacity: must be number between 0 and 1' },
          { status: 400 }
        )
      }

      await this.queries.saveLineOpacity(params.instanceKey, lineOpacity)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo line opacity:', error)
      return NextResponse.json(
        { error: 'Failed to save line opacity' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/component-opacity/[instanceKey]
   * Save component opacity
   */
  async handleSaveComponentOpacity(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { componentOpacity } = body

      if (typeof componentOpacity !== 'number' || componentOpacity < 0.1 || componentOpacity > 1) {
        return NextResponse.json(
          { error: 'Invalid componentOpacity: must be number between 0.1 and 1' },
          { status: 400 }
        )
      }

      await this.queries.saveComponentOpacity(params.instanceKey, componentOpacity)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo component opacity:', error)
      return NextResponse.json(
        { error: 'Failed to save component opacity' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/vigilo/statuses/[instanceKey]
   * Save task statuses
   */
  async handleSaveStatuses(request: NextRequest, { params }: { params: { instanceKey: string } }) {
    try {
      const body = await request.json()
      const { statuses } = body

      if (!statuses || typeof statuses !== 'object') {
        return NextResponse.json(
          { error: 'Invalid statuses: must be object' },
          { status: 400 }
        )
      }

      const statusMap = new Map<number, TodoStatus>()
      for (const [key, value] of Object.entries(statuses)) {
        const index = parseInt(key, 10)
        if (!isNaN(index) && ['todo', 'working', 'done'].includes(value as string)) {
          statusMap.set(index, value as TodoStatus)
        }
      }

      await this.queries.saveStatuses(params.instanceKey, statusMap)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to save Vigilo statuses:', error)
      return NextResponse.json(
        { error: 'Failed to save statuses' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper function to create API handlers with Prisma queries
 */
export function createVigiloApiHandlers(queries: VigiloPrismaQueries | VigiloDrizzleQueries) {
  return new VigiloApiHandlers(queries)
}
