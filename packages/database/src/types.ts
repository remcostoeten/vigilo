// Shared types for API integration
export interface VigiloApiResponse<T = any> {
  data?: T
  error?: string
  success?: boolean
}

export interface VigiloStateResponse {
  position?: { x: number; y: number }
  connections?: Array<{
    todoIndex: number
    targetSelector?: string
    targetLabel?: string
    targetPosition?: { x: number; y: number }
  }>
  displayMode?: 'full' | 'compact' | 'minimal'
  isHidden?: boolean
  showLines?: boolean
  showBadges?: boolean
  lineColor?: string
  lineOpacity?: number
  componentOpacity?: number
  statuses?: Record<string, 'todo' | 'working' | 'done'>
}

export interface VigiloApiError {
  code: string
  message: string
  details?: any
}

// Request types for different operations
export interface PositionRequest {
  x: number
  y: number
}

export interface ConnectionsRequest {
  connections: Array<{
    todoIndex: number
    targetSelector?: string
    targetLabel?: string
    targetPosition?: { x: number; y: number }
  }>
}

export interface DisplayModeRequest {
  displayMode: 'full' | 'compact' | 'minimal'
}

export interface HiddenRequest {
  isHidden: boolean
}

export interface ShowLinesRequest {
  showLines: boolean
}

export interface ShowBadgesRequest {
  showBadges: boolean
}

export interface LineColorRequest {
  lineColor: string
}

export interface LineOpacityRequest {
  lineOpacity: number
}

export interface ComponentOpacityRequest {
  componentOpacity: number
}

export interface StatusesRequest {
  statuses: Record<string, 'todo' | 'working' | 'done'>
}

// Union type for all request types
export type VigiloApiRequest = 
  | { type: 'position'; data: PositionRequest }
  | { type: 'connections'; data: ConnectionsRequest }
  | { type: 'displayMode'; data: DisplayModeRequest }
  | { type: 'hidden'; data: HiddenRequest }
  | { type: 'showLines'; data: ShowLinesRequest }
  | { type: 'showBadges'; data: ShowBadgesRequest }
  | { type: 'lineColor'; data: LineColorRequest }
  | { type: 'lineOpacity'; data: LineOpacityRequest }
  | { type: 'componentOpacity'; data: ComponentOpacityRequest }
  | { type: 'statuses'; data: StatusesRequest }
