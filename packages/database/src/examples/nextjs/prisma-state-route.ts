import { NextRequest, NextResponse } from 'next/server'
import { createVigiloApiHandlers } from '@vigilo/database/server/handlers'
import { createVigiloPrismaQueries } from '@vigilo/database/server/prisma'
import { PrismaClient } from '@prisma/client'

// Initialize Prisma client (consider singleton pattern in production)
const prisma = new PrismaClient()
const queries = createVigiloPrismaQueries(prisma)
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
