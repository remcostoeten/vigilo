import { useMemo, useRef, useEffect } from 'react'
import { createVigiloStore, createStorageKeys, type VigiloStore, type Connection } from '@vigilo/core'
import { generateSelector, getElementLabel } from './dom'

export interface UseVigiloInstanceOptions {
  /**
   * The category ID or instance ID to access
   */
  instanceId: string
  /**
   * Optional line color override
   */
  lineColor?: string
}

export interface UseVigiloInstanceReturn {
  /**
   * The Vigilo store instance
   */
  store: VigiloStore | null
  /**
   * Get current state from the store
   */
  getState: () => ReturnType<VigiloStore['getState']> | null
  /**
   * Add a connection programmatically
   * @param todoIndex - The index of the task (0-based)
   * @param target - Either a CSS selector string, an Element, or a position { x, y }
   * @param label - Optional label for the connection
   */
  addConnection: (
    todoIndex: number,
    target: string | Element | { x: number; y: number },
    label?: string
  ) => void
  /**
   * Remove a connection for a specific task
   * @param todoIndex - The index of the task (0-based)
   */
  removeConnection: (todoIndex: number) => void
  /**
   * Set all connections (replaces existing)
   * @param connections - Array of connections
   */
  setConnections: (connections: Connection[]) => void
  /**
   * Get all current connections
   */
  getConnections: () => Connection[]
}

/**
 * Hook to access a Vigilo instance store programmatically.
 * Allows you to add/remove connections and manage state from outside the component.
 *
 * @example
 * ```tsx
 * const { addConnection } = useVigiloInstance({ instanceId: 'development' })
 *
 * // Connect task 0 to an element
 * addConnection(0, '#my-feature')
 *
 * // Connect task 1 to a DOM element
 * const element = document.querySelector('#another-feature')
 * addConnection(1, element, 'Another Feature')
 *
 * // Connect task 2 to a position (freeroam)
 * addConnection(2, { x: 100, y: 200 })
 * ```
 */
export function useVigiloInstance({
  instanceId,
  lineColor,
}: UseVigiloInstanceOptions): UseVigiloInstanceReturn {
  const keys = useMemo(() => createStorageKeys(instanceId), [instanceId])
  const storeRef = useRef<VigiloStore | null>(null)

  useEffect(() => {
    const store = createVigiloStore(keys, lineColor ? { lineColor } : undefined)
    storeRef.current = store
    return () => {
      storeRef.current = null
    }
  }, [keys, lineColor])

  const addConnection = (
    todoIndex: number,
    target: string | Element | { x: number; y: number },
    label?: string
  ) => {
    const store = storeRef.current
    if (!store) {
      console.warn(`Vigilo store not initialized for instance: ${instanceId}`)
      return
    }

    const currentConnections = store.getState().connections
    const existingIndex = currentConnections.findIndex((c) => c.todoIndex === todoIndex)

    let newConnection: Connection

    if (typeof target === 'string') {
      // CSS selector
      newConnection = {
        todoIndex,
        targetSelector: target,
        targetLabel: label,
      }
    } else if (target instanceof Element) {
      // DOM element
      newConnection = {
        todoIndex,
        targetSelector: generateSelector(target),
        targetLabel: label || getElementLabel(target),
      }
    } else {
      // Position object (freeroam)
      newConnection = {
        todoIndex,
        targetPosition: target,
        targetLabel: label,
      }
    }

    const nextConnections = [...currentConnections]
    if (existingIndex >= 0) {
      // Replace existing connection for this task
      nextConnections[existingIndex] = newConnection
    } else {
      // Add new connection
      nextConnections.push(newConnection)
    }

    store.setConnections(nextConnections)
  }

  const removeConnection = (todoIndex: number) => {
    const store = storeRef.current
    if (!store) {
      console.warn(`Vigilo store not initialized for instance: ${instanceId}`)
      return
    }

    const currentConnections = store.getState().connections
    const nextConnections = currentConnections.filter((c) => c.todoIndex !== todoIndex)
    store.setConnections(nextConnections)
  }

  const setConnections = (connections: Connection[]) => {
    const store = storeRef.current
    if (!store) {
      console.warn(`Vigilo store not initialized for instance: ${instanceId}`)
      return
    }
    store.setConnections(connections)
  }

  const getConnections = (): Connection[] => {
    const store = storeRef.current
    if (!store) return []
    return store.getState().connections
  }

  const getState = () => {
    const store = storeRef.current
    if (!store) return null
    return store.getState()
  }

  return {
    store: storeRef.current,
    getState,
    addConnection,
    removeConnection,
    setConnections,
    getConnections,
  }
}

