# Vigilo Database Persistence - Complete Setup Guide

This guide provides comprehensive documentation for setting up database persistence with Vigilo overlays. Store tasks, positions, connections, and settings in your own database with full control over data management.

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Core Vigilo packages
npm install @remcostoeten/vigilo-core @remcostoeten/vigilo-react

# Database persistence package
npm install @vigilo/database

# Choose your ORM ( database drivers )
npm install @prisma/client prisma
# OR
npm install drizzle-orm postgres
```

### Step 2: Generate Database Schema

```bash
# Generate Prisma schema
npx vigilo-db --prisma --out prisma/schema.prisma

# Generate Drizzle schema  
npx vigilo-db --drizzle --out lib/db/schema.ts

# Generate raw SQL schema
npx vigilo-db --sql --out db/vigilo.sql
```

### Step 3: Set Up Database

#### Prisma Setup
```bash
# Initialize Prisma (if not already done)
npx prisma init

# Generate and apply migrations
npx prisma generate
npx prisma db push
```

#### Drizzle Setup
```bash
# Generate and apply migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Step 4: Create API Routes

#### Next.js App Router - Prisma
```typescript
// app/api/vigilo/state/[instanceKey]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createVigiloApiHandlers } from '@vigilo/database/server/handlers'
import { createVigiloPrismaQueries } from '@vigilo/database/server/prisma'
import { PrismaClient } from '@prisma/client'

// Initialize Prisma client (use singleton in production)
const prisma = new PrismaClient()
const queries = createVigiloPrismaQueries(prisma)
const handlers = createVigiloApiHandlers(queries)

// GET /api/vigilo/state/[instanceKey] - Load complete state
export async function GET(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  return handlers.handleLoadState(request, { params })
}

// POST /api/vigilo/state/[instanceKey] - Save specific state updates
export async function POST(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  const body = await request.json()
  const { type } = body

  switch (type) {
    case 'position': return handlers.handleSavePosition(request, { params })
    case 'connections': return handlers.handleSaveConnections(request, { params })
    case 'displayMode': return handlers.handleSaveDisplayMode(request, { params })
    case 'hidden': return handlers.handleSaveHidden(request, { params })
    case 'showLines': return handlers.handleSaveShowLines(request, { params })
    case 'showBadges': return handlers.handleSaveShowBadges(request, { params })
    case 'lineColor': return handlers.handleSaveLineColor(request, { params })
    case 'lineOpacity': return handlers.handleSaveLineOpacity(request, { params })
    case 'componentOpacity': return handlers.handleSaveComponentOpacity(request, { params })
    case 'statuses': return handlers.handleSaveStatuses(request, { params })
    default: 
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
  }
}
```

#### Next.js App Router - Drizzle
```typescript
// app/api/vigilo/state/[instanceKey]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createVigiloApiHandlers } from '@vigilo/database/server/handlers'
import { createVigiloDrizzleQueries } from '@vigilo/database/server/drizzle'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema' // Your generated Drizzle schema

// Initialize Drizzle (use singleton in production)
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })
const queries = createVigiloDrizzleQueries(db)
const handlers = createVigiloApiHandlers(queries)

// GET /api/vigilo/state/[instanceKey] - Load complete state
export async function GET(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  return handlers.handleLoadState(request, { params })
}

// POST /api/vigilo/state/[instanceKey] - Save specific state updates
export async function POST(
  request: NextRequest,
  { params }: { params: { instanceKey: string } }
) {
  const body = await request.json()
  const { type } = body

  switch (type) {
    case 'position': return handlers.handleSavePosition(request, { params })
    case 'connections': return handlers.handleSaveConnections(request, { params })
    case 'displayMode': return handlers.handleSaveDisplayMode(request, { params })
    case 'hidden': return handlers.handleSaveHidden(request, { params })
    case 'showLines': return handlers.handleSaveShowLines(request, { params })
    case 'showBadges': return handlers.handleSaveShowBadges(request, { params })
    case 'lineColor': return handlers.handleSaveLineColor(request, { params })
    case 'lineOpacity': return handlers.handleSaveLineOpacity(request, { params })
    case 'componentOpacity': return handlers.handleSaveComponentOpacity(request, { params })
    case 'statuses': return handlers.handleSaveStatuses(request, { params })
    default: 
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
  }
}
```

### Step 5: Integrate with React App

#### Using VigiloProvider ( Recommended )
```tsx
'use client'

import { VigiloProvider } from '@vigilo/database'
import { Vigilo } from '@remcostoeten/vigilo-react'
import type { CategoryConfig } from '@remcostoeten/vigilo-core'

// Example categories configuration
const categories: CategoryConfig[] = [
  {
    id: 'development',
    displayName: 'Development Tasks',
    items: [
      { text: 'Fix authentication bug', action: 'fix', priority: 'high' },
      { text: 'Add user profile page', action: 'feat', priority: 'medium' },
      { text: 'Optimize database queries', action: 'perf', priority: 'low' }
    ]
  },
  {
    id: 'design',
    displayName: 'Design Tasks',
    items: [
      { text: 'Update color scheme', action: 'update', priority: 'medium' },
      { text: 'Create new icons', action: 'create', priority: 'low' }
    ]
  }
]

export default function App() {
  return (
    <VigiloProvider
      baseUrl="/api/vigilo"
      defaultInstanceId="user-tasks"
      getAuthToken={() => localStorage.getItem('authToken') || undefined}
    >
      <Vigilo 
        category="development" 
        categories={categories}
        {/* Storage is automatically handled! */}
      />
    </VigiloProvider>
  )
}
```

#### Manual Storage Integration
```tsx
'use client'

import { createApiVigiloStorage } from '@vigilo/database'
import { Vigilo } from '@remcostoeten/vigilo-react'
import { useEffect, useState } from 'react'

export default function App() {
  const [storage, setStorage] = useState(null)

  useEffect(() => {
    const apiStorage = createApiVigiloStorage({
      baseUrl: '/api/vigilo',
      instanceId: 'user-tasks',
      token: localStorage.getItem('authToken') || undefined,
      headers: { 'X-Custom-Header': 'value' },
      timeout: 10000
    })
    setStorage(apiStorage)
  }, [])

  if (!storage) return <div>Loading...</div>

  return (
    <Vigilo 
      storage={storage}
      category="development" 
      categories={categories}
    />
  )
}
```

## 📋 Database Schema

### Core Tables

#### VigiloInstance
```sql
CREATE TABLE vigilo_instance (
    id VARCHAR(255) PRIMARY KEY,
    instance_key VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### VigiloPosition
```sql
CREATE TABLE vigilo_position (
    id VARCHAR(255) PRIMARY KEY,
    instance_id VARCHAR(255) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES vigilo_instance(id) ON DELETE CASCADE,
    UNIQUE (instance_id)
);
```

#### VigiloConnection
```sql
CREATE TABLE vigilo_connection (
    id VARCHAR(255) PRIMARY KEY,
    instance_id VARCHAR(255) NOT NULL,
    todo_index INT NOT NULL,
    target_selector VARCHAR(255),
    target_label VARCHAR(255),
    target_position_x INT,
    target_position_y INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES vigilo_instance(id) ON DELETE CASCADE,
    UNIQUE (instance_id, todo_index)
);
```

#### VigiloSettings
```sql
CREATE TABLE vigilo_settings (
    id VARCHAR(255) PRIMARY KEY,
    instance_id VARCHAR(255) NOT NULL,
    display_mode VARCHAR(50) DEFAULT 'full' NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
    show_lines BOOLEAN DEFAULT TRUE NOT NULL,
    show_badges BOOLEAN DEFAULT TRUE NOT NULL,
    line_color VARCHAR(20) DEFAULT '#3b82f6' NOT NULL,
    line_opacity REAL DEFAULT 0.5 NOT NULL,
    component_opacity REAL DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES vigilo_instance(id) ON DELETE CASCADE,
    UNIQUE (instance_id)
);
```

#### VigiloStatus
```sql
CREATE TABLE vigilo_status (
    id VARCHAR(255) PRIMARY KEY,
    instance_id VARCHAR(255) NOT NULL,
    todo_index INT NOT NULL,
    status VARCHAR(20) DEFAULT 'todo' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES vigilo_instance(id) ON DELETE CASCADE,
    UNIQUE (instance_id, todo_index)
);
```

## 🔌 API Endpoints

All endpoints follow the pattern: `/api/vigilo/[resource]/[instanceKey]`

### State Management
- `GET /state/[instanceKey]` - Load complete state for an instance
- `POST /state/[instanceKey]` - Save specific state updates

### Individual Endpoints ( each can be called independently )
- `POST /position/[instanceKey]` - Save panel position ( `x, y` coordinates )
- `POST /connections/[instanceKey]` - Save task-to-element connections
- `POST /display-mode/[instanceKey]` - Save display mode ( `full/compact/minimal` )
- `POST /hidden/[instanceKey]` - Save hidden state
- `POST /show-lines/[instanceKey]` - Save line visibility
- `POST /show-badges/[instanceKey]` - Save badge visibility
- `POST /line-color/[instanceKey]` - Save line color
- `POST /line-opacity/[instanceKey]` - Save line opacity
- `POST /component-opacity/[instanceKey]` - Save component opacity
- `POST /statuses/[instanceKey]` - Save task statuses

### Request/Response Formats

#### Position Request
```json
{
  "type": "position",
  "data": {
    "x": 100,
    "y": 200
  }
}
```

#### Connections Request
```json
{
  "type": "connections",
  "data": {
    "connections": [
      {
        "todoIndex": 0,
        "targetSelector": "#submit-button",
        "targetLabel": "Submit Form",
        "targetPosition": { "x": 150, "y": 300 }
      }
    ]
  }
}
```

#### Statuses Request
```json
{
  "type": "statuses",
  "data": {
    "statuses": {
      "0": "todo",
      "1": "working",
      "2": "done"
    }
  }
}
```

## 🔧 Advanced Configuration

### Custom Storage Adapter
```typescript
import { createApiVigiloStorage } from '@vigilo/database'

const storage = createApiVigiloStorage({
  baseUrl: 'https://your-api.com/vigilo',
  instanceId: 'project-tasks',
  token: user.authToken,
  headers: { 
    'X-Custom-Header': 'value',
    'X-User-ID': user.id 
  },
  timeout: 10000
})

<Vigilo storage={storage} category="dev" categories={categories} />
```

### Multi-Instance Support
```tsx
function MultiInstanceApp() {
  return (
    <div>
      <VigiloProvider
        baseUrl="/api/vigilo"
        defaultInstanceId="user-profile"
        getAuthToken={() => getToken()}
      >
        <Vigilo category="profile" categories={profileCategories} />
      </VigiloProvider>
      
      <VigiloProvider
        baseUrl="/api/vigilo"
        defaultInstanceId="user-projects"
        getAuthToken={() => getToken()}
      >
        <Vigilo category="projects" categories={projectCategories} />
      </VigiloProvider>
    </div>
  )
}
```

### Dynamic Instance Management
```tsx
import { useVigiloStorage } from '@vigilo/database'

function DynamicInstanceComponent({ projectId }: { projectId: string }) {
  const { getStorage, isAuthenticated } = useVigiloStorage()
  const storage = getStorage(`project-${projectId}`)
  
  if (!isAuthenticated) {
    return <div>Please log in to manage tasks</div>
  }
  
  return (
    <Vigilo 
      storage={storage}
      category="project" 
      categories={projectCategories}
    />
  )
}
```

## 🔐 Security & Authentication

### Bearer Token Authentication
```typescript
// Server-side validation
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token || !validateToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Proceed with request...
}
```

### User Association
```typescript
// Prisma queries with user filtering
const userInstances = await prisma.vigiloInstance.findMany({
  where: {
    userId: user.id,
    instanceKey: instanceKey
  },
  include: {
    positions: true,
    connections: true,
    settings: true,
    statuses: true
  }
})
```

### Instance Isolation
Each instance is namespaced by `instanceKey`, ensuring data isolation between different use cases within the same application.

## 🚀 Performance Optimizations

### Lazy Loading
State is loaded on-demand per instance, reducing initial load times and memory usage.

### Debounced Sync
```typescript
const storage = createApiVigiloStorage({
  baseUrl: '/api/vigilo',
  instanceId: 'user-tasks',
  debounceMs: 300 // Debounce rapid updates
})
```

### Error Recovery
Automatic fallback to localStorage on API errors ensures offline functionality.

### Optimistic Updates
```tsx
<VigiloProvider
  baseUrl="/api/vigilo"
  defaultInstanceId="user-tasks"
  optimisticUpdates={true} // Enable optimistic updates
  getAuthToken={() => getToken()}
>
  <Vigilo category="dev" categories={categories} />
</VigiloProvider>
```

## 🔍 Debugging & Monitoring

### Enable Debug Logging
```typescript
const storage = createApiVigiloStorage({
  baseUrl: '/api/vigilo',
  instanceId: 'user-tasks',
  debug: true // Enable console logging
})
```

### Error Handling
```tsx
import { useVigiloStorage } from '@vigilo/database'

function ErrorHandlingComponent() {
  const { getStorage, error, isLoading } = useVigiloStorage()
  
  if (error) {
    console.error('Vigilo storage error:', error)
    return <div>Storage error: {error.message}</div>
  }
  
  if (isLoading) {
    return <div>Loading storage...</div>
  }
  
  const storage = getStorage('user-tasks')
  return <Vigilo storage={storage} category="dev" categories={categories} />
}
```

## 🧪 Testing

### Mock Storage for Testing
```typescript
import { createApiVigiloStorage } from '@vigilo/database'

const mockStorage = createApiVigiloStorage({
  baseUrl: 'http://localhost:3000/api/vigilo',
  instanceId: 'test-instance',
  headers: { 'X-Test-Mode': 'true' }
})

// In your test
test('should save position', async () => {
  await mockStorage.savePosition({ x: 100, y: 200 })
  // Assert position was saved
})
```

### Integration Testing
```typescript
// Test your API routes
import { createVigiloApiHandlers } from '@vigilo/database'
import { createVigiloPrismaQueries } from '@vigilo/database/server/prisma'

const queries = createVigiloPrismaQueries(prisma)
const handlers = createVigiloApiHandlers(queries)

test('should load state', async () => {
  const request = new Request('http://localhost/api/vigilo/state/test')
  const response = await handlers.handleLoadState(request, { 
    params: { instanceKey: 'test' } 
  })
  
  expect(response.status).toBe(200)
  const data = await response.json()
  expect(data).toHaveProperty('position')
})
```

## 🔄 Migration from LocalStorage

### Step 1: Add Provider
```tsx
// Before
<Vigilo category="dev" categories={categories} />

// After
<VigiloProvider baseUrl="/api/vigilo" defaultInstanceId="dev">
  <Vigilo category="dev" categories={categories} />
</VigiloProvider>
```

### Step 2: Data Migration ( database migration script )
```typescript
// One-time migration script
async function migrateFromLocalStorage() {
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    const localData = localStorage.getItem(`vigilo-${user.id}`)
    if (localData) {
      const data = JSON.parse(localData)
      await prisma.vigiloInstance.create({
        data: {
          instanceKey: `user-${user.id}`,
          userId: user.id,
          positions: { create: data.position },
          connections: { create: data.connections },
          settings: { create: data.settings },
          statuses: { create: data.statuses }
        }
      })
    }
  }
}
```

## 📚 TypeScript Support

Full TypeScript support with comprehensive types:

```typescript
import type {
  ApiStorageConfig,
  VigiloStateResponse,
  VigiloApiRequest,
  VigiloProviderConfig
} from '@vigilo/database'

// Type-safe configuration
const config: ApiStorageConfig = {
  baseUrl: '/api/vigilo',
  instanceId: 'user-tasks',
  token: 'auth-token',
  timeout: 5000
}
```

## 🎯 Best Practices

1. **Use singleton pattern** for database clients in production
2. **Implement proper authentication** on all API endpoints
3. **Enable error boundaries** around Vigilo components
4. **Use optimistic updates** for better UX
5. **Monitor API performance** and implement caching where needed
6. **Test with mock storage** in development environments
7. **Validate inputs** on both client and server sides
8. **Use environment variables** for database URLs and secrets

## 🔗 Additional Resources

- [Vigilo Core Documentation](../core/README.md)
- [Vigilo React Documentation](../react/README.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Drizzle Documentation](https://orm.drizzle.team/docs/overview)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🤝 Contributing

To contribute to the database persistence package:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all existing tests pass
5. Submit a pull request with detailed description

## 📄 License

MIT License - see LICENSE file for details.
