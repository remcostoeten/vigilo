# Complete Setup Examples - Copy & Paste Ready

This file contains complete, copy-paste ready examples for setting up Vigilo database persistence in different scenarios.

## 🎯 Next.js + Prisma Complete Setup

### 1. package.json Dependencies
```json
{
  "dependencies": {
    "@remcostoeten/vigilo-core": "^0.0.1",
    "@remcostoeten/vigilo-react": "^0.0.1",
    "@vigilo/database": "^0.0.1",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### 2. Generate Schema
```bash
npx vigilo-db --prisma --out prisma/schema.prisma
```

### 3. prisma/schema.prisma ( Generated )
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model VigiloInstance {
  id          String   @id @default(cuid())
  instanceKey String   @unique
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  positions   VigiloPosition[]
  connections VigiloConnection[]
  settings    VigiloSettings[]
  statuses    VigiloStatus[]
}

model VigiloPosition {
  id         String   @id @default(cuid())
  instanceId String
  x          Int
  y          Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  instance   VigiloInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  @@unique([instanceId])
}

model VigiloConnection {
  id              String   @id @default(cuid())
  instanceId      String
  todoIndex       Int
  targetSelector  String?
  targetLabel     String?
  targetPositionX Int?
  targetPositionY Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  instance        VigiloInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  @@unique([instanceId, todoIndex])
}

model VigiloSettings {
  id                String   @id @default(cuid())
  instanceId        String
  displayMode       String   @default("full")
  isHidden          Boolean  @default(false)
  showLines         Boolean  @default(true)
  showBadges        Boolean  @default(true)
  lineColor         String   @default("#3b82f6")
  lineOpacity       Float    @default(0.5)
  componentOpacity  Float    @default(1.0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  instance          VigiloInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  @@unique([instanceId])
}

model VigiloStatus {
  id         String   @id @default(cuid())
  instanceId String
  todoIndex  Int
  status     String   @default("todo")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  instance   VigiloInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  @@unique([instanceId, todoIndex])
}
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. API Route - app/api/vigilo/state/[instanceKey]/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createVigiloApiHandlers } from '@vigilo/database/server/handlers'
import { createVigiloPrismaQueries } from '@vigilo/database/server/prisma'
import { PrismaClient } from '@prisma/client'

// Singleton Prisma client for production
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const queries = createVigiloPrismaQueries(prisma)
const handlers = createVigiloApiHandlers(queries)

// GET /api/vigilo/state/[instanceKey] - Load complete state
export async function GET(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  try {
    return await handlers.handleLoadState(request, { params })
  } catch (error) {
    console.error('Error loading Vigilo state:', error)
    return NextResponse.json(
      { error: 'Failed to load state' }, 
      { status: 500 }
    )
  }
}

// POST /api/vigilo/state/[instanceKey] - Save specific state updates
export async function POST(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  try {
    const body = await request.json()
    const { type } = body

    switch (type) {
      case 'position':
        return await handlers.handleSavePosition(request, { params })
      case 'connections':
        return await handlers.handleSaveConnections(request, { params })
      case 'displayMode':
        return await handlers.handleSaveDisplayMode(request, { params })
      case 'hidden':
        return await handlers.handleSaveHidden(request, { params })
      case 'showLines':
        return await handlers.handleSaveShowLines(request, { params })
      case 'showBadges':
        return await handlers.handleSaveShowBadges(request, { params })
      case 'lineColor':
        return await handlers.handleSaveLineColor(request, { params })
      case 'lineOpacity':
        return await handlers.handleSaveLineOpacity(request, { params })
      case 'componentOpacity':
        return await handlers.handleSaveComponentOpacity(request, { params })
      case 'statuses':
        return await handlers.handleSaveStatuses(request, { params })
      default:
        return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error saving Vigilo state:', error)
    return NextResponse.json(
      { error: 'Failed to save state' }, 
      { status: 500 }
    )
  }
}
```

### 6. React Component - components/VigiloTaskManager.tsx
```tsx
'use client'

import { VigiloProvider } from '@vigilo/database'
import { Vigilo } from '@remcostoeten/vigilo-react'
import type { CategoryConfig } from '@remcostoeten/vigilo-core'

// Example categories - customize for your app
const taskCategories: CategoryConfig[] = [
  {
    id: 'development',
    displayName: 'Development Tasks',
    items: [
      { text: 'Fix authentication bug', action: 'fix', priority: 'high' },
      { text: 'Add user profile page', action: 'feat', priority: 'medium' },
      { text: 'Optimize database queries', action: 'perf', priority: 'low' },
      { text: 'Implement dark mode', action: 'feat', priority: 'medium' },
      { text: 'Write unit tests', action: 'test', priority: 'low' }
    ]
  },
  {
    id: 'design',
    displayName: 'Design Tasks',
    items: [
      { text: 'Update color scheme', action: 'update', priority: 'medium' },
      { text: 'Create new icons', action: 'create', priority: 'low' },
      { text: 'Redesign navigation', action: 'redesign', priority: 'high' }
    ]
  },
  {
    id: 'content',
    displayName: 'Content Tasks',
    items: [
      { text: 'Write documentation', action: 'write', priority: 'medium' },
      { text: 'Update blog posts', action: 'update', priority: 'low' }
    ]
  }
]

interface VigiloTaskManagerProps {
  userId?: string
  projectId?: string
}

export function VigiloTaskManager({ userId, projectId }: VigiloTaskManagerProps) {
  // Create unique instance ID for this user/project combination
  const instanceId = projectId 
    ? `project-${projectId}` 
    : userId 
    ? `user-${userId}` 
    : 'default'

  return (
    <VigiloProvider
      baseUrl="/api/vigilo"
      defaultInstanceId={instanceId}
      getAuthToken={() => {
        // Implement your auth token retrieval
        if (typeof window !== 'undefined') {
          return localStorage.getItem('authToken') || undefined
        }
        return undefined
      }}
      onError={(error) => {
        console.error('Vigilo storage error:', error)
        // You could show a toast notification here
      }}
    >
      <div className="w-full h-full">
        <Vigilo
          category="development"
          categories={taskCategories}
          // All storage is automatically handled by the provider!
        />
      </div>
    </VigiloProvider>
  )
}
```

### 7. Page Usage - app/dashboard/page.tsx
```tsx
import { VigiloTaskManager } from '@/components/VigiloTaskManager'

export default function DashboardPage() {
  // This would come from your auth system
  const userId = 'user-123'
  const projectId = 'project-456'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 py-4">
            Project Dashboard
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Task Management
          </h2>
          <div className="h-96">
            <VigiloTaskManager 
              userId={userId}
              projectId={projectId}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
```

## 🎯 Next.js + Drizzle Complete Setup

### 1. package.json Dependencies
```json
{
  "dependencies": {
    "@remcostoeten/vigilo-core": "^0.0.1",
    "@remcostoeten/vigilo-react": "^0.0.1",
    "@vigilo/database": "^0.0.1",
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0",
    "drizzle-kit": "^0.20.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### 2. Generate Schema
```bash
npx vigilo-db --drizzle --out lib/db/schema.ts
```

### 3. lib/db/schema.ts ( Generated )
```typescript
import { pgTable, text, integer, timestamp, varchar, boolean, real, unique } from 'drizzle-orm/pg-core';

export const vigiloInstance = pgTable('vigilo_instance', {
  id: text('id').primaryKey(),
  instanceKey: text('instance_key').unique().notNull(),
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vigiloPosition = pgTable('vigilo_position', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => vigiloInstance.id, { onDelete: 'cascade' }),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  instanceIdIdx: unique().on(table.instanceId),
}));

export const vigiloConnection = pgTable('vigilo_connection', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => vigiloInstance.id, { onDelete: 'cascade' }),
  todoIndex: integer('todo_index').notNull(),
  targetSelector: text('target_selector'),
  targetLabel: text('target_label'),
  targetPositionX: integer('target_position_x'),
  targetPositionY: integer('target_position_y'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  instanceTodoIdx: unique().on(table.instanceId, table.todoIndex),
}));

export const vigiloSettings = pgTable('vigilo_settings', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => vigiloInstance.id, { onDelete: 'cascade' }),
  displayMode: varchar('display_mode', { length: 50 }).default('full').notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  showLines: boolean('show_lines').default(true).notNull(),
  showBadges: boolean('show_badges').default(true).notNull(),
  lineColor: varchar('line_color', { length: 20 }).default('#3b82f6').notNull(),
  lineOpacity: real('line_opacity').default(0.5).notNull(),
  componentOpacity: real('component_opacity').default(1.0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  instanceIdIdx: unique().on(table.instanceId),
}));

export const vigiloStatus = pgTable('vigilo_status', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => vigiloInstance.id, { onDelete: 'cascade' }),
  todoIndex: integer('todo_index').notNull(),
  status: varchar('status', { length: 20 }).default('todo').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  instanceTodoIdx: unique().on(table.instanceId, table.todoIndex),
}));

export type VigiloInstance = typeof vigiloInstance.$inferSelect;
export type NewVigiloInstance = typeof vigiloInstance.$inferInsert;
export type VigiloPosition = typeof vigiloPosition.$inferSelect;
export type NewVigiloPosition = typeof vigiloPosition.$inferInsert;
export type VigiloConnection = typeof vigiloConnection.$inferSelect;
export type NewVigiloConnection = typeof vigiloConnection.$inferInsert;
export type VigiloSettings = typeof vigiloSettings.$inferSelect;
export type NewVigiloSettings = typeof vigiloSettings.$inferInsert;
export type VigiloStatus = typeof vigiloStatus.$inferSelect;
export type NewVigiloStatus = typeof vigiloStatus.$inferInsert;
```

### 4. lib/db/index.ts
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Singleton for production
const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> }

const client = postgres(process.env.DATABASE_URL!)
export const db = globalForDb.db || drizzle(client, { schema })

if (process.env.NODE_ENV !== 'production') globalForDb.db = db

export { schema }
```

### 5. drizzle.config.ts
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

### 6. Database Setup
```bash
# Generate migrations
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

### 7. API Route - app/api/vigilo/state/[instanceKey]/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createVigiloApiHandlers } from '@vigilo/database/server/handlers'
import { createVigiloDrizzleQueries } from '@vigilo/database/server/drizzle'
import { db } from '@/lib/db'

const queries = createVigiloDrizzleQueries(db)
const handlers = createVigiloApiHandlers(queries)

// GET /api/vigilo/state/[instanceKey] - Load complete state
export async function GET(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  try {
    return await handlers.handleLoadState(request, { params })
  } catch (error) {
    console.error('Error loading Vigilo state:', error)
    return NextResponse.json(
      { error: 'Failed to load state' }, 
      { status: 500 }
    )
  }
}

// POST /api/vigilo/state/[instanceKey] - Save specific state updates
export async function POST(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  try {
    const body = await request.json()
    const { type } = body

    switch (type) {
      case 'position':
        return await handlers.handleSavePosition(request, { params })
      case 'connections':
        return await handlers.handleSaveConnections(request, { params })
      case 'displayMode':
        return await handlers.handleSaveDisplayMode(request, { params })
      case 'hidden':
        return await handlers.handleSaveHidden(request, { params })
      case 'showLines':
        return await handlers.handleSaveShowLines(request, { params })
      case 'showBadges':
        return await handlers.handleSaveShowBadges(request, { params })
      case 'lineColor':
        return await handlers.handleSaveLineColor(request, { params })
      case 'lineOpacity':
        return await handlers.handleSaveLineOpacity(request, { params })
      case 'componentOpacity':
        return await handlers.handleSaveComponentOpacity(request, { params })
      case 'statuses':
        return await handlers.handleSaveStatuses(request, { params })
      default:
        return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error saving Vigilo state:', error)
    return NextResponse.json(
      { error: 'Failed to save state' }, 
      { status: 500 }
    )
  }
}
```

## 🎯 Custom Express Server Setup

### 1. server.js ( Express + Prisma )
```javascript
import express from 'express'
import { createVigiloApiHandlers } from '@vigilo/database/server/handlers'
import { createVigiloPrismaQueries } from '@vigilo/database/server/prisma'
import { PrismaClient } from '@prisma/client'

const app = express()
app.use(express.json())

const prisma = new PrismaClient()
const queries = createVigiloPrismaQueries(prisma)
const handlers = createVigiloApiHandlers(queries)

// Authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token || !validateToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  req.user = { id: getUserFromToken(token) }
  next()
}

// GET /api/vigilo/state/:instanceKey
app.get('/api/vigilo/state/:instanceKey', authMiddleware, async (req, res) => {
  try {
    const response = await handlers.handleLoadState(req, { params: req.params })
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Error loading state:', error)
    res.status(500).json({ error: 'Failed to load state' })
  }
})

// POST /api/vigilo/state/:instanceKey
app.post('/api/vigilo/state/:instanceKey', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body
    
    switch (type) {
      case 'position':
        const posResponse = await handlers.handleSavePosition(req, { params: req.params })
        return res.json(await posResponse.json())
      case 'connections':
        const connResponse = await handlers.handleSaveConnections(req, { params: req.params })
        return res.json(await connResponse.json())
      case 'statuses':
        const statusResponse = await handlers.handleSaveStatuses(req, { params: req.params })
        return res.json(await statusResponse.json())
      default:
        return res.status(400).json({ error: 'Invalid update type' })
    }
  } catch (error) {
    console.error('Error saving state:', error)
    res.status(500).json({ error: 'Failed to save state' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Vigilo API server running on port ${PORT}`)
})

function validateToken(token) {
  // Implement your token validation
  return true // Placeholder
}

function getUserFromToken(token) {
  // Implement user extraction from token
  return 'user-123' // Placeholder
}
```

## 🎯 Environment Configuration

### .env.local
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vigilo_db"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Custom API ( if using Express server )
API_BASE_URL="http://localhost:3001/api/vigilo"
```

## 🎯 TypeScript Configuration

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🎯 Testing Setup

### __tests__/vigilo-storage.test.ts
```typescript
import { createApiVigiloStorage } from '@vigilo/database'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Vigilo Storage', () => {
  let storage: ReturnType<typeof createApiVigiloStorage>
  
  beforeEach(() => {
    storage = createApiVigiloStorage({
      baseUrl: 'http://localhost:3000/api/vigilo',
      instanceId: 'test-instance',
      token: 'test-token'
    })
  })

  it('should save position', async () => {
    const position = { x: 100, y: 200 }
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })

    await storage.savePosition(position)
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/vigilo/position/test-instance',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify({ type: 'position', data: position })
      })
    )
  })

  it('should load complete state', async () => {
    const mockState = {
      position: { x: 100, y: 200 },
      connections: [],
      displayMode: 'full',
      isHidden: false,
      showLines: true,
      showBadges: true,
      lineColor: '#3b82f6',
      lineOpacity: 0.5,
      componentOpacity: 1.0,
      statuses: {}
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockState
    })

    const state = await storage.loadState()
    
    expect(state).toEqual(mockState)
  })
})
```

## 🎯 Production Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/vigilo
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=vigilo
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

These examples provide complete, production-ready setups for different scenarios. Choose the one that matches your stack and customize as needed!
