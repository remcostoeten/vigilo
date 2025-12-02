import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and } from 'drizzle-orm'
import type { Pos, Connection, DisplayMode, TodoStatus } from '@remcostoeten/vigilo-core'

// Import the generated schema (users need to generate this with our CLI)
import {
  vigiloInstance,
  vigiloPosition,
  vigiloConnection,
  vigiloSettings,
  vigiloStatus
} from './drizzle-schema' // Users will import their generated schema

export interface VigiloDrizzleDB {
  select: {
    from: (table: any) => any
  }
  insert: (table: any) => any
  update: (table: any) => any
  delete: (table: any) => any
}

export class VigiloDrizzleQueries {
  constructor(private db: VigiloDrizzleDB) {}

  /**
   * Get or create an instance
   */
  async getOrCreateInstance(instanceKey: string, userId?: string) {
    const existing = await this.db.select().from(vigiloInstance).where(eq(vigiloInstance.instanceKey, instanceKey)).limit(1)
    
    if (existing.length > 0) {
      return existing[0]
    }

    const inserted = await this.db.insert(vigiloInstance).values({
      instanceKey,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()
    
    return inserted[0]
  }

  /**
   * Load complete state for an instance
   */
  async loadState(instanceKey: string) {
    const instance = await this.db.select().from(vigiloInstance).where(eq(vigiloInstance.instanceKey, instanceKey)).limit(1)
    
    if (instance.length === 0) return null

    const instanceId = instance[0].id

    const [positions, connections, settings, statuses] = await Promise.all([
      this.db.select().from(vigiloPosition).where(eq(vigiloPosition.instanceId, instanceId)),
      this.db.select().from(vigiloConnection).where(eq(vigiloConnection.instanceId, instanceId)),
      this.db.select().from(vigiloSettings).where(eq(vigiloSettings.instanceId, instanceId)),
      this.db.select().from(vigiloStatus).where(eq(vigiloStatus.instanceId, instanceId))
    ])

    return {
      position: positions[0] ? { x: positions[0].x, y: positions[0].y } : undefined,
      connections: connections.map(conn => ({
        todoIndex: conn.todoIndex,
        targetSelector: conn.targetSelector || undefined,
        targetLabel: conn.targetLabel || undefined,
        targetPosition: (conn.targetPositionX !== null && conn.targetPositionY !== null) 
          ? { x: conn.targetPositionX, y: conn.targetPositionY } 
          : undefined
      })),
      displayMode: settings[0]?.displayMode as DisplayMode || undefined,
      isHidden: settings[0]?.isHidden,
      showLines: settings[0]?.showLines,
      showBadges: settings[0]?.showBadges,
      lineColor: settings[0]?.lineColor,
      lineOpacity: settings[0]?.lineOpacity,
      componentOpacity: settings[0]?.componentOpacity,
      statuses: new Map(statuses.map(s => [s.todoIndex, s.status as TodoStatus]))
    }
  }

  /**
   * Save position
   */
  async savePosition(instanceKey: string, position: Pos) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    const existing = await this.db.select().from(vigiloPosition).where(eq(vigiloPosition.instanceId, instance.id)).limit(1)
    
    if (existing.length > 0) {
      await this.db.update(vigiloPosition)
        .set({ x: position.x, y: position.y, updatedAt: new Date() })
        .where(eq(vigiloPosition.instanceId, instance.id))
    } else {
      await this.db.insert(vigiloPosition).values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        x: position.x,
        y: position.y,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return true
  }

  /**
   * Save connections (replaces all connections for instance)
   */
  async saveConnections(instanceKey: string, connections: Connection[]) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    // Delete existing connections
    await this.db.delete(vigiloConnection).where(eq(vigiloConnection.instanceId, instance.id))

    // Insert new connections
    if (connections.length > 0) {
      await this.db.insert(vigiloConnection).values(
        connections.map(conn => ({
          id: crypto.randomUUID(),
          instanceId: instance.id,
          todoIndex: conn.todoIndex,
          targetSelector: conn.targetSelector || null,
          targetLabel: conn.targetLabel || null,
          targetPositionX: conn.targetPosition?.x || null,
          targetPositionY: conn.targetPosition?.y || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      )
    }

    return true
  }

  /**
   * Save display mode
   */
  async saveDisplayMode(instanceKey: string, displayMode: DisplayMode) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    const existing = await this.db.select().from(vigiloSettings).where(eq(vigiloSettings.instanceId, instance.id)).limit(1)
    
    if (existing.length > 0) {
      await this.db.update(vigiloSettings)
        .set({ displayMode, updatedAt: new Date() })
        .where(eq(vigiloSettings.instanceId, instance.id))
    } else {
      await this.db.insert(vigiloSettings).values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        displayMode,
        isHidden: false,
        showLines: true,
        showBadges: true,
        lineColor: '#3b82f6',
        lineOpacity: 0.5,
        componentOpacity: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return true
  }

  /**
   * Save hidden state
   */
  async saveHidden(instanceKey: string, isHidden: boolean) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    const existing = await this.db.select().from(vigiloSettings).where(eq(vigiloSettings.instanceId, instance.id)).limit(1)
    
    if (existing.length > 0) {
      await this.db.update(vigiloSettings)
        .set({ isHidden, updatedAt: new Date() })
        .where(eq(vigiloSettings.instanceId, instance.id))
    } else {
      await this.db.insert(vigiloSettings).values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        displayMode: 'full',
        isHidden,
        showLines: true,
        showBadges: true,
        lineColor: '#3b82f6',
        lineOpacity: 0.5,
        componentOpacity: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return true
  }

  /**
   * Save show lines setting
   */
  async saveShowLines(instanceKey: string, showLines: boolean) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    const existing = await this.db.select().from(vigiloSettings).where(eq(vigiloSettings.instanceId, instance.id)).limit(1)
    
    if (existing.length > 0) {
      await this.db.update(vigiloSettings)
        .set({ showLines, updatedAt: new Date() })
        .where(eq(vigiloSettings.instanceId, instance.id))
    } else {
      await this.db.insert(vigiloSettings).values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        displayMode: 'full',
        isHidden: false,
        showLines,
        showBadges: true,
        lineColor: '#3b82f6',
        lineOpacity: 0.5,
        componentOpacity: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return true
  }

  /**
   * Save show badges setting
   */
  async saveShowBadges(instanceKey: string, showBadges: boolean) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    const existing = await this.db.select().from(vigiloSettings).where(eq(vigiloSettings.instanceId, instance.id)).limit(1)
    
    if (existing.length > 0) {
      await this.db.update(vigiloSettings)
        .set({ showBadges, updatedAt: new Date() })
        .where(eq(vigiloSettings.instanceId, instance.id))
    } else {
      await this.db.insert(vigiloSettings).values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        displayMode: 'full',
        isHidden: false,
        showLines: true,
        showBadges,
        lineColor: '#3b82f6',
        lineOpacity: 0.5,
        componentOpacity: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return true
  }

  /**
   * Save line color
   */
  async saveLineColor(instanceKey: string, lineColor: string) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    const existing = await this.db.select().from(vigiloSettings).where(eq(vigiloSettings.instanceId, instance.id)).limit(1)
    
    if (existing.length > 0) {
      await this.db.update(vigiloSettings)
        .set({ lineColor, updatedAt: new Date() })
        .where(eq(vigiloSettings.instanceId, instance.id))
    } else {
      await this.db.insert(vigiloSettings).values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        displayMode: 'full',
        isHidden: false,
        showLines: true,
        showBadges: true,
        lineColor,
        lineOpacity: 0.5,
        componentOpacity: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return true
  }

  /**
   * Save line opacity
   */
  async saveLineOpacity(instanceKey: string, lineOpacity: number) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    const existing = await this.db.select().from(vigiloSettings).where(eq(vigiloSettings.instanceId, instance.id)).limit(1)
    
    if (existing.length > 0) {
      await this.db.update(vigiloSettings)
        .set({ lineOpacity, updatedAt: new Date() })
        .where(eq(vigiloSettings.instanceId, instance.id))
    } else {
      await this.db.insert(vigiloSettings).values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        displayMode: 'full',
        isHidden: false,
        showLines: true,
        showBadges: true,
        lineColor: '#3b82f6',
        lineOpacity,
        componentOpacity: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return true
  }

  /**
   * Save component opacity
   */
  async saveComponentOpacity(instanceKey: string, componentOpacity: number) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    const existing = await this.db.select().from(vigiloSettings).where(eq(vigiloSettings.instanceId, instance.id)).limit(1)
    
    if (existing.length > 0) {
      await this.db.update(vigiloSettings)
        .set({ componentOpacity, updatedAt: new Date() })
        .where(eq(vigiloSettings.instanceId, instance.id))
    } else {
      await this.db.insert(vigiloSettings).values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        displayMode: 'full',
        isHidden: false,
        showLines: true,
        showBadges: true,
        lineColor: '#3b82f6',
        lineOpacity: 0.5,
        componentOpacity,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return true
  }

  /**
   * Save statuses (replaces all statuses for instance)
   */
  async saveStatuses(instanceKey: string, statuses: Map<number, TodoStatus>) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    // Delete existing statuses
    await this.db.delete(vigiloStatus).where(eq(vigiloStatus.instanceId, instance.id))

    // Insert new statuses
    const statusData = Array.from(statuses.entries()).map(([todoIndex, status]) => ({
      id: crypto.randomUUID(),
      instanceId: instance.id,
      todoIndex,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    if (statusData.length > 0) {
      await this.db.insert(vigiloStatus).values(statusData)
    }

    return true
  }
}

/**
 * Helper function to create VigiloDrizzleQueries with a Drizzle instance
 */
export function createVigiloDrizzleQueries(db: VigiloDrizzleDB) {
  return new VigiloDrizzleQueries(db)
}
