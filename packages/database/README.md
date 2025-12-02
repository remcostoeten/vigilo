# Vigilo Database Persistence

Complete database persistence solution for Vigilo overlays. Users can opt-in to store tasks, positions, connections, and settings in their own database via CLI schema generation.

## Quick Start

### 1. Generate Database Schema

```bash
# For Prisma
npx vigilo-db --prisma --out prisma/schema.prisma

# For Drizzle
npx vigilo-db --drizzle --out lib/db/schema.ts

# For raw SQL
npx vigilo-db --sql --out db/vigilo.sql
```

### 2. Set Up API Routes (Next.js Example)

#### Prisma Setup
```typescript
// app/api/vigilo/state/[instanceKey]/route.ts
import { createVigiloApiHandlers, createVigiloPrismaQueries } from '@vigilo/database'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const queries = createVigiloPrismaQueries(prisma)
const handlers = createVigiloApiHandlers(queries)

export async function GET(request, { params }) {
  return handlers.handleLoadState(request, { params })
}

export async function POST(request, { params }) {
  const body = await request.json()
  const { type } = body
  
  switch (type) {
    case 'position': return handlers.handleSavePosition(request, { params })
    case 'connections': return handlers.handleSaveConnections(request, { params })
    // ... other cases
  }
}
```

#### Drizzle Setup
```typescript
// app/api/vigilo/state/[instanceKey]/route.ts
import { createVigiloApiHandlers, createVigiloDrizzleQueries } from '@vigilo/database'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })
const queries = createVigiloDrizzleQueries(db)
const handlers = createVigiloApiHandlers(queries)
```

### 3. Add to Your React App

```tsx
'use client'

import { VigiloProvider } from '@vigilo/database'
import { Vigilo } from '@remcostoeten/vigilo-react'

export default function App() {
  return (
    <VigiloProvider
      baseUrl="/api/vigilo"
      defaultInstanceId="user-tasks"
      getAuthToken={() => localStorage.getItem('token')}
    >
      <Vigilo 
        category="development" 
        categories={yourCategories}
        {/* Storage is automatically handled! */}
      />
    </VigiloProvider>
  )
}
```

## Features

### ✅ What's Included

- **CLI Schema Generation**: Generate Prisma, Drizzle, or SQL schemas
- **API Storage Adapter**: `createApiVigiloStorage()` for REST API communication
- **Server Query Helpers**: Pre-built Prisma and Drizzle query classes
- **API Route Handlers**: Next.js route handlers with validation
- **tRPC Router**: Optional tRPC integration with Zod validation
- **React Provider**: Easy integration with automatic storage handling

### 🗄️ Database Schema

The generated schema includes:

- `VigiloInstance`: Instance management with optional user association
- `VigiloPosition`: Panel position (x, y coordinates)
- `VigiloConnection`: Task-to-element connections with selectors or positions
- `VigiloSettings`: Display settings (mode, colors, opacity, visibility)
- `VigiloStatus`: Task completion status (todo/working/done)

## API Endpoints

All endpoints follow the pattern: `/api/vigilo/[resource]/[instanceKey]`

- `GET /state/[instanceKey]` - Load complete state
- `POST /position/[instanceKey]` - Save panel position
- `POST /connections/[instanceKey]` - Save task connections
- `POST /display-mode/[instanceKey]` - Save display mode
- `POST /hidden/[instanceKey]` - Save hidden state
- `POST /show-lines/[instanceKey]` - Save line visibility
- `POST /show-badges/[instanceKey]` - Save badge visibility
- `POST /line-color/[instanceKey]` - Save line color
- `POST /line-opacity/[instanceKey]` - Save line opacity
- `POST /component-opacity/[instanceKey]` - Save component opacity
- `POST /statuses/[instanceKey]` - Save task statuses

## Advanced Usage

### Custom Storage Adapter

```typescript
import { createApiVigiloStorage } from '@vigilo/database'

const storage = createApiVigiloStorage({
  baseUrl: 'https://your-api.com/vigilo',
  instanceId: 'project-tasks',
  token: user.authToken,
  headers: { 'X-Custom-Header': 'value' },
  timeout: 10000
})

<Vigilo storage={storage} category="dev" categories={categories} />
```

### tRPC Integration

```typescript
// server/trpc/router.ts
import { createVigiloRouter } from '@vigilo/database'
import { createVigiloPrismaQueries } from '@vigilo/database'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const queries = createVigiloPrismaQueries(prisma)
export const vigiloRouter = createVigiloRouter(queries)

// client
import { trpc } from '@/lib/trpc'
const { data } = trpc.vigilo.getState.useQuery({ instanceKey: 'my-app' })
```

### Manual Storage Hook

```typescript
import { useVigiloStorage } from '@vigilo/database'

function MyComponent() {
  const { getStorage, isAuthenticated } = useVigiloStorage()
  const storage = getStorage('custom-instance')
  
  return <Vigilo storage={storage} category="dev" categories={categories} />
}
```

## TypeScript Support

Full TypeScript support with included types:

- `ApiStorageConfig` - Configuration for API storage
- `VigiloStateResponse` - API response shape
- `VigiloApiRequest` - Union type for all requests
- `VigiloProviderConfig` - Provider configuration

## Security Considerations

- **Authentication**: All API calls support Bearer token authentication
- **Instance Isolation**: Each instance is namespaced by `instanceKey`
- **User Association**: Optional `userId` field for multi-tenant apps
- **Validation**: Server-side validation for all inputs

## Performance

- **Lazy Loading**: State loaded on-demand per instance
- **Optimistic Updates**: Optional client-side optimistic updates
- **Debounced Sync**: Automatic debouncing for rapid updates
- **Error Recovery**: Graceful fallback to localStorage on API errors

## Migration from LocalStorage

Simply replace the `storage` prop:

```tsx
// Before
<Vigilo category="dev" categories={categories} />

// After (with provider)
<VigiloProvider baseUrl="/api/vigilo" defaultInstanceId="dev">
  <Vigilo category="dev" categories={categories} />
</VigiloProvider>

// Or manual
<Vigilo 
  category="dev" 
  categories={categories}
  storage={createApiVigiloStorage(config)}
/>
```

All existing functionality remains the same - data just persists to your database instead of localStorage!
