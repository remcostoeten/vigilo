import { NextRequest, NextResponse } from 'next/server'
import { createVigiloApiHandlers } from '@vigilo/database/server/handlers'
import { createVigiloDrizzleQueries } from '@vigilo/database/server/drizzle'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema' // User's generated Drizzle schema

// Initialize Drizzle (consider singleton pattern in production)
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })
const queries = createVigiloDrizzleQueries(db)
const handlers = createVigiloApiHandlers(queries)

// GET /api/vigilo/state/[instanceKey]
export async function GET(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  return handlers.handleLoadState(request, { params })
}

// POST /api/vigilo/state/[instanceKey] (for bulk updates)
export async function POST(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  const body = await request.json()
  const { type, data } = body

  switch (type) {
    case 'position':
      return handlers.handleSavePosition(request, { params })
    case 'connections':
      return handlers.handleSaveConnections(request, { params })
    case 'displayMode':
      return handlers.handleSaveDisplayMode(request, { params })
    case 'hidden':
      return handlers.handleSaveHidden(request, { params })
    case 'showLines':
      return handlers.handleSaveShowLines(request, { params })
    case 'showBadges':
      return handlers.handleSaveShowBadges(request, { params })
    case 'lineColor':
      return handlers.handleSaveLineColor(request, { params })
    case 'lineOpacity':
      return handlers.handleSaveLineOpacity(request, { params })
    case 'componentOpacity':
      return handlers.handleSaveComponentOpacity(request, { params })
    case 'statuses':
      return handlers.handleSaveStatuses(request, { params })
    default:
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
  }
}
