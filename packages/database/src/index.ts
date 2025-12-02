// Main entry point for @vigilo/database package

// CLI schema generation
export { program } from './cli'

// API storage adapter
export { createApiVigiloStorage } from './api-storage'
export type { ApiStorageConfig, VigiloApiEndpoints } from './api-storage'

// Server query helpers - Prisma
export { VigiloPrismaQueries, createVigiloPrismaQueries } from './server/prisma'
export type { VigiloPrismaClient } from './server/prisma'

// Server query helpers - Drizzle
export { VigiloDrizzleQueries, createVigiloDrizzleQueries } from './server/drizzle'
export type { VigiloDrizzleDB } from './server/drizzle'

// API route handlers
export { VigiloApiHandlers, createVigiloApiHandlers } from './server/handlers'
export type { VigiloQueryHandler } from './server/handlers'

// tRPC router
export { createVigiloRouter } from './server/trpc'
export type { VigiloRouter } from './server/trpc'

// React integration helpers
export { 
  VigiloProvider, 
  useVigiloStorage, 
  useVigiloProps, 
  withVigiloStorage 
} from './react/provider'
export type { VigiloProviderConfig } from './react/provider'

// Shared types
export type {
  VigiloApiResponse,
  VigiloStateResponse,
  VigiloApiError,
  PositionRequest,
  ConnectionsRequest,
  DisplayModeRequest,
  HiddenRequest,
  ShowLinesRequest,
  ShowBadgesRequest,
  LineColorRequest,
  LineOpacityRequest,
  ComponentOpacityRequest,
  StatusesRequest,
  VigiloApiRequest
} from './types'
