import { PrismaClient } from '@prisma/client'
import type { Pos, Connection, DisplayMode, TodoStatus } from '@remcostoeten/vigilo-core'

export interface VigiloPrismaClient {
  vigiloInstance: {
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    upsert: (args: any) => Promise<any>
  }
  vigiloPosition: {
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    upsert: (args: any) => Promise<any>
  }
  vigiloConnection: {
    findMany: (args: any) => Promise<any[]>
    createMany: (args: any) => Promise<any>
    deleteMany: (args: any) => Promise<any>
    upsert: (args: any) => Promise<any>
  }
  vigiloSettings: {
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    upsert: (args: any) => Promise<any>
  }
  vigiloStatus: {
    findMany: (args: any) => Promise<any[]>
    createMany: (args: any) => Promise<any>
    deleteMany: (args: any) => Promise<any>
    upsert: (args: any) => Promise<any>
  }
}

export class VigiloPrismaQueries {
  constructor(private prisma: VigiloPrismaClient) {}

  /**
   * Get or create an instance
   */
  async getOrCreateInstance(instanceKey: string, userId?: string) {
    return await this.prisma.vigiloInstance.upsert({
      where: { instanceKey },
      update: { updatedAt: new Date() },
      create: { instanceKey, userId }
    })
  }

  /**
   * Load complete state for an instance
   */
  async loadState(instanceKey: string) {
    const instance = await this.prisma.vigiloInstance.findUnique({
      where: { instanceKey },
      include: {
        positions: true,
        connections: true,
        settings: true,
        statuses: true
      }
    })

    if (!instance) return null

    return {
      position: instance.positions[0] ? { x: instance.positions[0].x, y: instance.positions[0].y } : undefined,
      connections: instance.connections.map((conn: any) => ({
        todoIndex: conn.todoIndex,
        targetSelector: conn.targetSelector || undefined,
        targetLabel: conn.targetLabel || undefined,
        targetPosition: (conn.targetPositionX !== null && conn.targetPositionY !== null) 
          ? { x: conn.targetPositionX, y: conn.targetPositionY } 
          : undefined
      })),
      displayMode: instance.settings[0]?.displayMode as DisplayMode || undefined,
      isHidden: instance.settings[0]?.isHidden,
      showLines: instance.settings[0]?.showLines,
      showBadges: instance.settings[0]?.showBadges,
      lineColor: instance.settings[0]?.lineColor,
      lineOpacity: instance.settings[0]?.lineOpacity,
      componentOpacity: instance.settings[0]?.componentOpacity,
      statuses: new Map(instance.statuses.map(s => [s.todoIndex, s.status as TodoStatus]))
    }
  }

  /**
   * Save position
   */
  async savePosition(instanceKey: string, position: Pos) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    return await this.prisma.vigiloPosition.upsert({
      where: { instanceId: instance.id },
      update: { x: position.x, y: position.y, updatedAt: new Date() },
      create: { instanceId: instance.id, x: position.x, y: position.y }
    })
  }

  /**
   * Save connections (replaces all connections for instance)
   */
  async saveConnections(instanceKey: string, connections: Connection[]) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    // Delete existing connections
    await this.prisma.vigiloConnection.deleteMany({
      where: { instanceId: instance.id }
    })

    // Create new connections
    if (connections.length > 0) {
      await this.prisma.vigiloConnection.createMany({
        data: connections.map(conn => ({
          instanceId: instance.id,
          todoIndex: conn.todoIndex,
          targetSelector: conn.targetSelector || null,
          targetLabel: conn.targetLabel || null,
          targetPositionX: conn.targetPosition?.x || null,
          targetPositionY: conn.targetPosition?.y || null
        }))
      })
    }

    return true
  }

  /**
   * Save display mode
   */
  async saveDisplayMode(instanceKey: string, displayMode: DisplayMode) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    return await this.prisma.vigiloSettings.upsert({
      where: { instanceId: instance.id },
      update: { displayMode, updatedAt: new Date() },
      create: { instanceId: instance.id, displayMode }
    })
  }

  /**
   * Save hidden state
   */
  async saveHidden(instanceKey: string, isHidden: boolean) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    return await this.prisma.vigiloSettings.upsert({
      where: { instanceId: instance.id },
      update: { isHidden, updatedAt: new Date() },
      create: { instanceId: instance.id, isHidden }
    })
  }

  /**
   * Save show lines setting
   */
  async saveShowLines(instanceKey: string, showLines: boolean) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    return await this.prisma.vigiloSettings.upsert({
      where: { instanceId: instance.id },
      update: { showLines, updatedAt: new Date() },
      create: { instanceId: instance.id, showLines }
    })
  }

  /**
   * Save show badges setting
   */
  async saveShowBadges(instanceKey: string, showBadges: boolean) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    return await this.prisma.vigiloSettings.upsert({
      where: { instanceId: instance.id },
      update: { showBadges, updatedAt: new Date() },
      create: { instanceId: instance.id, showBadges }
    })
  }

  /**
   * Save line color
   */
  async saveLineColor(instanceKey: string, lineColor: string) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    return await this.prisma.vigiloSettings.upsert({
      where: { instanceId: instance.id },
      update: { lineColor, updatedAt: new Date() },
      create: { instanceId: instance.id, lineColor }
    })
  }

  /**
   * Save line opacity
   */
  async saveLineOpacity(instanceKey: string, lineOpacity: number) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    return await this.prisma.vigiloSettings.upsert({
      where: { instanceId: instance.id },
      update: { lineOpacity, updatedAt: new Date() },
      create: { instanceId: instance.id, lineOpacity }
    })
  }

  /**
   * Save component opacity
   */
  async saveComponentOpacity(instanceKey: string, componentOpacity: number) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    return await this.prisma.vigiloSettings.upsert({
      where: { instanceId: instance.id },
      update: { componentOpacity, updatedAt: new Date() },
      create: { instanceId: instance.id, componentOpacity }
    })
  }

  /**
   * Save statuses (replaces all statuses for instance)
   */
  async saveStatuses(instanceKey: string, statuses: Map<number, TodoStatus>) {
    const instance = await this.getOrCreateInstance(instanceKey)
    
    // Delete existing statuses
    await this.prisma.vigiloStatus.deleteMany({
      where: { instanceId: instance.id }
    })

    // Create new statuses
    const statusData = Array.from(statuses.entries()).map(([todoIndex, status]) => ({
      instanceId: instance.id,
      todoIndex,
      status
    }))

    if (statusData.length > 0) {
      await this.prisma.vigiloStatus.createMany({
        data: statusData
      })
    }

    return true
  }
}

/**
 * Helper function to create VigiloPrismaQueries with a PrismaClient
 */
export function createVigiloPrismaQueries(prisma: PrismaClient) {
  return new VigiloPrismaQueries(prisma)
}
