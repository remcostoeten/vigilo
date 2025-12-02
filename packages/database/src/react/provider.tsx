'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createApiVigiloStorage, type ApiStorageConfig } from '@vigilo/database/api-storage'
import type { VigiloStorage } from '@remcostoeten/vigilo-core'

export interface VigiloProviderConfig extends Omit<ApiStorageConfig, 'instanceId'> {
  /** Default instance ID to use for all Vigilo components */
  defaultInstanceId: string
  /** Optional authentication getter that returns current token */
  getAuthToken?: () => string | undefined
  /** Whether to enable optimistic updates (default: true) */
  optimisticUpdates?: boolean
}

interface VigiloContextValue {
  /** Get a storage adapter for a specific instance */
  getStorage: (instanceId?: string) => VigiloStorage
  /** Current authentication state */
  isAuthenticated: boolean
  /** Update authentication token */
  setAuthToken: (token: string | undefined) => void
  /** Loading state for initial auth check */
  isLoading: boolean
}

const VigiloContext = createContext<VigiloContextValue | undefined>(undefined)

/**
 * Provider component that handles Vigilo database persistence
 * 
 * @example
 * ```tsx
 * // In your app root or layout
 * <VigiloProvider 
 *   baseUrl="https://your-app.com/api/vigilo"
 *   defaultInstanceId="user-tasks"
 *   getAuthToken={() => user.token}
 * >
 *   <YourApp />
 * </VigiloProvider>
 * 
 * // Then use Vigilo components normally
 * <Vigilo category="development" categories={devCategories} />
 * ```
 */
export function VigiloProvider({
  children,
  baseUrl,
  defaultInstanceId,
  token: initialToken,
  getAuthToken,
  headers = {},
  timeout = 5000,
  optimisticUpdates = true
}: {
  children: React.ReactNode
} & VigiloProviderConfig) {
  const [authToken, setAuthToken] = useState<string | undefined>(initialToken)
  const [isLoading, setIsLoading] = useState(true)

  // Check for auth token on mount
  useEffect(() => {
    if (getAuthToken) {
      const token = getAuthToken()
      setAuthToken(token)
    }
    setIsLoading(false)
  }, [getAuthToken])

  const contextValue = useMemo<VigiloContextValue>(() => {
    const getStorage = (instanceId: string = defaultInstanceId): VigiloStorage => {
      const currentToken = getAuthToken ? getAuthToken() : authToken
      
      return createApiVigiloStorage({
        baseUrl,
        instanceId,
        token: currentToken,
        headers,
        timeout
      })
    }

    return {
      getStorage,
      isAuthenticated: !!authToken,
      setAuthToken,
      isLoading
    }
  }, [baseUrl, defaultInstanceId, authToken, headers, timeout, getAuthToken])

  return (
    <VigiloContext.Provider value={contextValue}>
      {children}
    </VigiloContext.Provider>
  )
}

/**
 * Hook to access Vigilo storage from within a VigiloProvider
 * 
 * @example
 * ```tsx
 * const { getStorage, isAuthenticated } = useVigiloStorage()
 * const storage = getStorage('my-instance')
 * 
 * <Vigilo storage={storage} category="dev" categories={devCategories} />
 * ```
 */
export function useVigiloStorage() {
  const context = useContext(VigiloContext)
  
  if (!context) {
    throw new Error('useVigiloStorage must be used within a VigiloProvider')
  }
  
  return context
}

/**
 * Hook that automatically provides the correct storage for a Vigilo component
 * 
 * @example
 * ```tsx
 * // Instead of manually passing storage
 * <Vigilo storage={storage} category="dev" categories={devCategories} />
 * 
 * // Use this hook
 * const vigiloProps = useVigiloProps({ category: 'dev', categories: devCategories })
 * <Vigilo {...vigiloProps} />
 * ```
 */
export function useVigiloProps<T extends { category: string; categories: any; instanceId?: string }>(
  props: T
): T & { storage: VigiloStorage } {
  const { getStorage } = useVigiloStorage()
  
  const storage = useMemo(() => {
    return getStorage(props.instanceId)
  }, [getStorage, props.instanceId])
  
  return {
    ...props,
    storage
  }
}

/**
 * Higher-order component that automatically adds storage to Vigilo components
 * 
 * @example
 * ```tsx
 * const EnhancedVigilo = withVigiloStorage(Vigilo)
 * 
 * // Use normally - storage will be added automatically
 * <EnhancedVigilo category="development" categories={devCategories} />
 * ```
 */
export function withVigiloStorage<P extends { category: string; categories: any; instanceId?: string }>(
  Component: React.ComponentType<P & { storage: VigiloStorage }>
) {
  return function WithVigiloStorageComponent(props: P) {
    const vigiloProps = useVigiloProps(props)
    return <Component {...vigiloProps} />
  }
}
