import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { Pos, Connection, DisplayMode, TodoStatus } from '@remcostoeten/vigilo-core'
import type { VigiloPrismaQueries } from '../server/prisma'
import type { VigiloDrizzleQueries } from '../server/drizzle'

const t = initTRPC.create()

// Zod schemas for validation
const PositionSchema = z.object({
  x: z.number(),
  y: z.number()
})

const ConnectionSchema = z.object({
  todoIndex: z.number(),
  targetSelector: z.string().optional(),
  targetLabel: z.string().optional(),
  targetPosition: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
})

const DisplayModeSchema = z.enum(['full', 'compact', 'minimal'])

const StatusSchema = z.enum(['todo', 'working', 'done'])

const StatusesSchema = z.record(z.string(), StatusSchema)

/**
 * tRPC router for Vigilo state management
 */
export function createVigiloRouter(queries: VigiloPrismaQueries | VigiloDrizzleQueries) {
  return t.router({
    // Get complete state
    getState: t.procedure
      .input(z.object({ instanceKey: z.string() }))
      .query(async ({ input }) => {
        return await queries.loadState(input.instanceKey)
      }),

    // Position operations
    savePosition: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        position: PositionSchema
      }))
      .mutation(async ({ input }) => {
        await queries.savePosition(input.instanceKey, input.position)
        return { success: true }
      }),

    // Connection operations
    saveConnections: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        connections: z.array(ConnectionSchema)
      }))
      .mutation(async ({ input }) => {
        await queries.saveConnections(input.instanceKey, input.connections)
        return { success: true }
      }),

    // Display mode operations
    saveDisplayMode: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        displayMode: DisplayModeSchema
      }))
      .mutation(async ({ input }) => {
        await queries.saveDisplayMode(input.instanceKey, input.displayMode)
        return { success: true }
      }),

    // Hidden state operations
    saveHidden: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        isHidden: z.boolean()
      }))
      .mutation(async ({ input }) => {
        await queries.saveHidden(input.instanceKey, input.isHidden)
        return { success: true }
      }),

    // Show lines operations
    saveShowLines: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        showLines: z.boolean()
      }))
      .mutation(async ({ input }) => {
        await queries.saveShowLines(input.instanceKey, input.showLines)
        return { success: true }
      }),

    // Show badges operations
    saveShowBadges: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        showBadges: z.boolean()
      }))
      .mutation(async ({ input }) => {
        await queries.saveShowBadges(input.instanceKey, input.showBadges)
        return { success: true }
      }),

    // Line color operations
    saveLineColor: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        lineColor: z.string()
      }))
      .mutation(async ({ input }) => {
        await queries.saveLineColor(input.instanceKey, input.lineColor)
        return { success: true }
      }),

    // Line opacity operations
    saveLineOpacity: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        lineOpacity: z.number().min(0).max(1)
      }))
      .mutation(async ({ input }) => {
        await queries.saveLineOpacity(input.instanceKey, input.lineOpacity)
        return { success: true }
      }),

    // Component opacity operations
    saveComponentOpacity: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        componentOpacity: z.number().min(0.1).max(1)
      }))
      .mutation(async ({ input }) => {
        await queries.saveComponentOpacity(input.instanceKey, input.componentOpacity)
        return { success: true }
      }),

    // Statuses operations
    saveStatuses: t.procedure
      .input(z.object({
        instanceKey: z.string(),
        statuses: StatusesSchema
      }))
      .mutation(async ({ input }) => {
        const statusMap = new Map<number, TodoStatus>()
        for (const [key, value] of Object.entries(input.statuses)) {
          const index = parseInt(key, 10)
          if (!isNaN(index)) {
            statusMap.set(index, value)
          }
        }
        await queries.saveStatuses(input.instanceKey, statusMap)
        return { success: true }
      })
  })
}

export type VigiloRouter = ReturnType<typeof createVigiloRouter>
