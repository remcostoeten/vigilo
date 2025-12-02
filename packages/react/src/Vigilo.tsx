/**
 * @name Vigilo
 * @alias Latin “vigilo” — to watch, stay alert, keep aware
 * @description A lightweight task awareness overlay for development environments.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import type {
  Pos,
  TodoStatus,
  Connection,
  DisplayMode,
  UndoSnapshot,
} from '@remcostoeten/vigilo-core'
import { createDefaultState } from '@remcostoeten/vigilo-core'
import { createVigiloStore, type VigiloStore } from '@remcostoeten/vigilo-core'
import { generateSelector, getElementLabel } from './dom'
import { calculateBezier } from '@remcostoeten/vigilo-core'
import { MAX_VISIBLE_ITEMS, UNDO_WINDOW_MS } from './constants'
import type { VigiloProps, CategoryConfig } from './types'
import { updatePaletteInstance, removePaletteInstance } from './registry'
import { VigiloCommandPalette } from './cmd'
import { mergeTheme, mergeStyles } from './theme'

let paletteMounted = false

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

function VigiloCore<TCategories extends readonly CategoryConfig[] = CategoryConfig[]>({
  category,
  instanceId,
  categories,
  storage,
  themeOverrides,
  stylesOverrides,
  colorMode,
}: VigiloProps<TCategories>) {
  const categoryData = useMemo(
    () => categories.find((c) => c.id === category),
    [category, categories]
  )

  const instanceKey = useMemo(
    () => instanceId || category,
    [instanceId, category]
  )

  const theme = useMemo(
    () => mergeTheme(themeOverrides, colorMode),
    [themeOverrides, colorMode]
  )

  const primaryLineColor = theme.colors.primary

  const styles = useMemo(
    () => mergeStyles(theme, stylesOverrides),
    [theme, stylesOverrides]
  )

  const defaultState = useMemo(
    () => createDefaultState({ lineColor: primaryLineColor }),
    [primaryLineColor]
  )

  // State
  const [isMounted, setIsMounted] = useState(false)
  const [storeState, setStoreState] = useState(defaultState)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [openIssueIndex, setOpenIssueIndex] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const storeRef = useRef<VigiloStore | null>(null)

  const {
    position: pos,
    connections,
    displayMode,
    isHidden,
    showLines,
    showBadges,
    lineColor,
    lineOpacity,
    componentOpacity,
    statuses,
  } = storeState

  // Interaction
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Pos>({ x: 0, y: 0 })
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null)
  const [hoveredTarget, setHoveredTarget] = useState<Element | null>(null)
  const [isFreeroam, setIsFreeroam] = useState(false)
  const [previewPosition, setPreviewPosition] = useState<Pos | null>(null)
  const [editingConnection, setEditingConnection] = useState<number | null>(null)
  const [hoveredConnection, setHoveredConnection] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState<Pos | null>(null)
  const [tick, setTick] = useState(0)

  const connectionsByIndex = useMemo(() => {
    const map = new Map<number, Connection>()
    connections.forEach((conn) => {
      map.set(conn.todoIndex, conn)
    })
    return map
  }, [connections])

  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const todoRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const connectionPointRefs = useRef<Map<number, SVGCircleElement>>(new Map())
  const rafRef = useRef<number | null>(null)
  const undoSnapshotRef = useRef<UndoSnapshot | null>(null)
  const undoTimeoutRef = useRef<number | null>(null)

  // Initialization
  useEffect(() => {
    const store = createVigiloStore(instanceKey, {
      storage,
      overrides: { lineColor: primaryLineColor }
    })
    storeRef.current = store
    setStoreState(store.getState())
    setIsMounted(true)
    const unsubscribe = store.subscribe(() => {
      setStoreState(store.getState())
    })
    return () => {
      unsubscribe()
      storeRef.current = null
      setIsMounted(false)
    }
  }, [instanceKey, storage, primaryLineColor])
  
  // Global Listeners - optimized for drag performance
  useEffect(() => {
    let ticking = false
		
		function handleTick() {
      if (ticking || isDragging) return // Skip RAF updates during drag for better performance
      ticking = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setTick((t) => (t + 1) % 100)
        ticking = false
      })
    }
		
		window.addEventListener('scroll', handleTick, { passive: true })
    window.addEventListener('resize', handleTick, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleTick)
      window.removeEventListener('resize', handleTick)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isDragging])

  // Drag Logic - optimized for performance
  useEffect(() => {
    if (!isDragging) return
    const storeInstance = storeRef.current
    if (!storeInstance) return
    const store = storeInstance

    let rafId: number | null = null
    let lastSaveTime = 0
    let latestPos = pos
    const SAVE_THROTTLE = 100 // Save position every 100ms max

    function onMove(e: MouseEvent) {
      if (rafId) return // Skip if we already have a pending frame

      rafId = requestAnimationFrame(() => {
        let newX = e.clientX - dragOffset.x
        let newY = e.clientY - dragOffset.y

        if (panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect()
          newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width))
          newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height))
        }

        const newPos = {
          x: newX,
          y: newY,
        }
        latestPos = newPos
        store.setPosition(newPos, { persist: false })

        // Throttle localStorage writes during drag
        const now = Date.now()
        if (now - lastSaveTime > SAVE_THROTTLE) {
          store.setPosition(newPos)
          lastSaveTime = now
        }

        rafId = null
      })
    }

    function onUp() {
      if (latestPos) {
        store.setPosition(latestPos)
      }
      setIsDragging(false)
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isDragging, dragOffset, pos])

  // Keep panel within viewport
  useEffect(() => {
    if (!isMounted || !panelRef.current) return

    const panel = panelRef.current
    const rect = panel.getBoundingClientRect()

    const newPos = { ...pos }
    let updated = false

    if (pos.x + rect.width > window.innerWidth) {
      newPos.x = window.innerWidth - rect.width
      updated = true
    }
    if (pos.y + rect.height > window.innerHeight) {
      newPos.y = window.innerHeight - rect.height
      updated = true
    }
    if (pos.x < 0) {
      newPos.x = 0
      updated = true
    }
    if (pos.y < 0) {
      newPos.y = 0
      updated = true
    }

    if (updated && (newPos.x !== pos.x || newPos.y !== pos.y)) {
      storeRef.current?.setPosition(newPos)
    }
  }, [isMounted, pos, tick])


  // Selection Logic
  useEffect(() => {
    if (selectingIndex === null) {
      setHoveredTarget(null)
      setIsFreeroam(false)
      setPreviewPosition(null)
      setMousePos(null)
      return
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectingIndex(null)
      if (e.key === 'Shift') setIsFreeroam(true)
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'Shift') setIsFreeroam(false)
    }

    function onClick(e: MouseEvent) {
      e.preventDefault()
      e.stopPropagation()
      const target = e.target as Element

      if (panelRef.current?.contains(target)) {
        setSelectingIndex(null)
        return
      }

      let newConn: Connection

      if (isFreeroam || !target || target === document.body) {
        newConn = {
          todoIndex: selectingIndex!,
          targetPosition: { x: e.clientX, y: e.clientY },
        }
      } else {
        newConn = {
          todoIndex: selectingIndex!,
          targetSelector: generateSelector(target),
          targetLabel: getElementLabel(target),
        }
      }

      const next = connections.filter((c) => c.todoIndex !== selectingIndex!)
      next.push(newConn)
      storeRef.current?.setConnections(next)
      setSelectingIndex(null)
    }

    function onMove(e: MouseEvent) {
      setMousePos({ x: e.clientX, y: e.clientY })
      if (isFreeroam) {
        setHoveredTarget(null)
        setPreviewPosition({ x: e.clientX, y: e.clientY })
        return
      }
      setPreviewPosition(null)
      const t = e.target as Element
      if (t && !panelRef.current?.contains(t)) setHoveredTarget(t)
    }

    function killLinks(e: MouseEvent) {
      if ((e.target as Element).closest('a')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('click', onClick, true)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('click', killLinks, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', killLinks, true)
    }
  }, [selectingIndex, isFreeroam, connections])

  // Selection Visuals
  useEffect(() => {
    if (!hoveredTarget) return
    hoveredTarget.classList.add('vigilo-target-hover')
    return () => hoveredTarget.classList.remove('vigilo-target-hover')
  }, [hoveredTarget])

  // Connection Point Editing Logic
  useEffect(() => {
    if (editingConnection === null) return
    const storeInstance = storeRef.current
    if (!storeInstance) return
    const store = storeInstance

    function onMove(e: MouseEvent) {
      const prev = store.getState().connections
      const conn = prev.find((c) => c.todoIndex === editingConnection)
      if (!conn) return

      const updated: Connection = {
        ...conn,
        targetPosition: { x: e.clientX, y: e.clientY },
      }
      // Convert DOM selector connections to freeroam when editing
      if (conn.targetSelector) {
        delete updated.targetSelector
        delete updated.targetLabel
      }

      const next = prev.filter((c) => c.todoIndex !== editingConnection)
      next.push(updated)
      store.setConnections(next)
    }

    function onUp() {
      setEditingConnection(null)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [editingConnection])

  // Connection Point Interaction Handlers
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as SVGCircleElement
      if (!target) return

      // Find which connection this circle belongs to
      for (const [todoIndex, circle] of Array.from(connectionPointRefs.current.entries())) {
        if (circle === target) {
          e.preventDefault()
          e.stopPropagation()
          setEditingConnection(todoIndex)
          break
        }
      }
    }

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as SVGCircleElement
      if (!target) return

      // Find which connection this circle belongs to
      for (const [todoIndex, circle] of Array.from(connectionPointRefs.current.entries())) {
        if (circle === target) {
          e.preventDefault()
          e.stopPropagation()
          removeConnection(todoIndex)
          break
        }
      }
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as SVGCircleElement
      if (!target) return

      for (const [todoIndex, circle] of Array.from(connectionPointRefs.current.entries())) {
        if (circle === target) {
          setHoveredConnection(todoIndex)
          break
        }
      }
    }

    const handleMouseLeave = () => {
      setHoveredConnection(null)
    }

    for (const circle of Array.from(connectionPointRefs.current.values())) {
      circle.addEventListener('mousedown', handleMouseDown)
      circle.addEventListener('dblclick', handleDoubleClick)
      circle.addEventListener('mouseenter', handleMouseEnter)
      circle.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      for (const circle of Array.from(connectionPointRefs.current.values())) {
        circle.removeEventListener('mousedown', handleMouseDown)
        circle.removeEventListener('dblclick', handleDoubleClick)
        circle.removeEventListener('mouseenter', handleMouseEnter)
        circle.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [connections])

  /* -------------------------------------------------------------------------- */
  /*                                   ACTIONS                                  */
  /* -------------------------------------------------------------------------- */

  function prepareUndo() {
    const snapshot: UndoSnapshot = {
      displayMode,
      isHidden,
    }
    undoSnapshotRef.current = snapshot
    setCanUndo(true)

    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
    }

    undoTimeoutRef.current = window.setTimeout(() => {
      undoSnapshotRef.current = null
      undoTimeoutRef.current = null
      setCanUndo(false)
    }, UNDO_WINDOW_MS)
  }

  function performUndo() {
    const snapshot = undoSnapshotRef.current
    if (!snapshot) return
    const store = storeRef.current
    if (!store) return

    store.setDisplayMode(snapshot.displayMode)
    store.setHidden(snapshot.isHidden)

    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }

    undoSnapshotRef.current = null
    setCanUndo(false)
  }

  function setAndPersistMode(mode: DisplayMode) {
    storeRef.current?.setDisplayMode(mode)
  }

  const handleHide = useCallback(() => {
    storeRef.current?.setHidden(true)
    setIsSettingsOpen(false)
  }, [])

  const revealOverlay = useCallback(
    (scroll = true) => {
      storeRef.current?.setHidden(false)
      setIsSettingsOpen(false)
      setShowKeyboardHelp(false)
      setIsExpanded(true)
      if (scroll && panelRef.current) {
        panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    []
  )

  
  function handleSetMode(mode: DisplayMode) {
    setAndPersistMode(mode)
    setIsSettingsOpen(false)
  }

  function handleToggleLines() {
    storeRef.current?.setShowLines(!showLines)
  }

  function handleToggleBadges() {
    storeRef.current?.setShowBadges(!showBadges)
  }

  function handleSetLineColor(color: string) {
    storeRef.current?.setLineColor(color)
  }

  function handleSetLineOpacity(opacity: number) {
    storeRef.current?.setLineOpacity(opacity)
  }

  function handleSetComponentOpacity(opacity: number) {
    storeRef.current?.setComponentOpacity(opacity)
  }

  // Global keyboard shortcuts
  useEffect(() => {
    if (isHidden || !isMounted || openIssueIndex !== null) return

    function onKeyDown(e: KeyboardEvent) {
      // Only trigger if not typing in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Check if the event target is within this component instance
      if (containerRef.current && !containerRef.current.contains(target)) {
        return
      }

      // Don't trigger if modifier keys are pressed (except for specific shortcuts)
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey

      // Open settings with 's' or '?' key
      if ((e.key === 's' || e.key === 'S' || e.key === '?') && !hasModifier) {
        e.preventDefault()
        e.stopPropagation()
        if (e.key === '?') {
          setShowKeyboardHelp(true)
        } else {
          setIsSettingsOpen(true)
        }
        return
      }

      // Search with '/' key
      if (e.key === '/' && !hasModifier) {
        e.preventDefault()
        e.stopPropagation()
        // Focus search if available, or just enable search mode
        const searchInput = document.querySelector('[data-vigilo-search]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
        return
      }

      // Escape to close modals
      if (e.key === 'Escape' && !hasModifier) {
        if (isSettingsOpen) {
          setIsSettingsOpen(false)
        }
        if (showKeyboardHelp) {
          setShowKeyboardHelp(false)
        }
        if (searchQuery) {
          setSearchQuery('')
        }
        return
      }

      // Export with Ctrl+E / Cmd+E
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        e.stopPropagation()
        exportConfig()
        return
      }

      // Import with Ctrl+I / Cmd+I
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        e.stopPropagation()
        importConfig()
        return
      }

      // Toggle lines with 'l'
      if (e.key === 'l' && !hasModifier) {
        e.preventDefault()
        e.stopPropagation()
        handleToggleLines()
        return
      }

      // Toggle badges with 'b'
      if (e.key === 'b' && !hasModifier) {
        e.preventDefault()
        e.stopPropagation()
        handleToggleBadges()
        return
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isHidden, isMounted, isSettingsOpen, showKeyboardHelp, searchQuery, openIssueIndex, displayMode, handleToggleLines, handleToggleBadges])

  // Close issue view on Escape
  useEffect(() => {
    if (openIssueIndex === null) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setOpenIssueIndex(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openIssueIndex])

  // Settings menu keyboard accessibility
  useEffect(() => {
    if (!isSettingsOpen) return

    function onKeyDown(e: KeyboardEvent) {
      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setIsSettingsOpen(false)
        return
      }

      // Undo window: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (canUndo) {
          e.preventDefault()
          e.stopPropagation()
          performUndo()
        }
        return
      }

      // Only handle plain key presses beyond this point
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // Numeric shortcuts for display modes when menu is open
      if (e.key === '1') {
        e.preventDefault()
        prepareUndo()
        setAndPersistMode('full')
        setIsSettingsOpen(false)
        return
      }

      if (e.key === '2') {
        e.preventDefault()
        prepareUndo()
        setAndPersistMode('compact')
        setIsSettingsOpen(false)
        return
      }

      if (e.key === '3') {
        e.preventDefault()
        prepareUndo()
        setAndPersistMode('minimal')
        setIsSettingsOpen(false)
        return
      }

      // "d" to hide while menu is open
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        prepareUndo()
        handleHide()
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSettingsOpen, canUndo, displayMode, isHidden])

  function startDrag(e: React.MouseEvent) {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect()
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setIsDragging(true)
    }
  }

  function toggleViewMore() {
    setIsExpanded(!isExpanded)
  }

  const removeConnection = useCallback(
    (idx: number) => {
      const next = connections.filter((c) => c.todoIndex !== idx)
      storeRef.current?.setConnections(next)
      showToast('Connection removed', 'info')
    },
    [connections, showToast]
  )

  const resetStatusesState = useCallback(() => {
    storeRef.current?.resetStatuses()
    showToast('Statuses reset', 'info')
  }, [showToast])

  useEffect(() => () => removePaletteInstance(instanceKey), [instanceKey])

  useEffect(() => {
    if (!categoryData) {
      updatePaletteInstance(instanceKey, null)
      return
    }

    const tasks = categoryData.items.map((item, idx) => ({
      id: `${instanceKey}-${idx}`,
      instanceKey,
      index: idx,
      text: item.text,
      status: statuses.get(idx) ?? 'todo',
      hasConnection: connectionsByIndex.has(idx),
      focusTask: () => {
        revealOverlay()
        setOpenIssueIndex(idx)
      },
      clearConnection: connectionsByIndex.has(idx)
        ? () => removeConnection(idx)
        : undefined,
    }))

    updatePaletteInstance(instanceKey, {
      instanceKey,
      categoryId: categoryData.id,
      label: categoryData.displayName || categoryData.id,
      hidden: isHidden,
      totalTasks: tasks.length,
      connectedCount: connections.length,
      tasks,
      actions: {
        focus: () => {
          revealOverlay()
          setOpenIssueIndex(null)
        },
        show: () => revealOverlay(),
        hide: () => handleHide(),
        resetConnections: () => {
          storeRef.current?.setConnections([])
          showToast('Connections cleared', 'info')
        },
        resetStatuses: () => resetStatusesState(),
      },
    })
  }, [
    categoryData,
    connections,
    connectionsByIndex,
    handleHide,
    instanceKey,
    isHidden,
    revealOverlay,
    resetStatusesState,
    removeConnection,
    statuses,
  ])

  function exportConfig() {
    try {
      const config = {
        position: pos,
        displayMode,
        connections,
        statuses: Object.fromEntries(statuses),
        showLines,
        showBadges,
        lineColor,
        lineOpacity,
        componentOpacity,
        exportedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vigilo-${instanceKey}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Configuration exported', 'success')
    } catch (e) {
      console.error('Export error', e)
      showToast('Failed to export', 'error')
    }
  }

  function importConfig() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          const store = storeRef.current
          if (!store) return
          if (config.position) store.setPosition(config.position)
          if (config.displayMode) setAndPersistMode(config.displayMode)
          if (config.connections) {
            store.setConnections(config.connections)
          }
          if (config.statuses) {
            const statusMap = new Map<number, TodoStatus>()
            for (const [key, value] of Object.entries(config.statuses)) {
              const index = parseInt(key, 10)
              if (!isNaN(index) && (value === 'todo' || value === 'working' || value === 'done')) {
                statusMap.set(index, value as TodoStatus)
              }
            }
            store.setStatuses(statusMap)
          }
          if (config.showLines !== undefined) {
            store.setShowLines(config.showLines)
          }
          if (config.showBadges !== undefined) {
            store.setShowBadges(config.showBadges)
          }
          if (config.lineColor) {
            store.setLineColor(config.lineColor)
          }
          if (config.lineOpacity !== undefined) {
            store.setLineOpacity(config.lineOpacity)
          }
          if (config.componentOpacity !== undefined) {
            store.setComponentOpacity(config.componentOpacity)
          }
          showToast('Configuration imported', 'success')
        } catch (e) {
          console.error('Import error', e)
          showToast('Failed to import configuration', 'error')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  function showToast(message: string, type: 'success' | 'info' | 'error' = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function setItemStatus(index: number, status: TodoStatus) {
    storeRef.current?.setStatus(index, status)
    showToast(`Status set to ${status}`, 'success')
  }

  function getItemStatus(index: number): TodoStatus {
    return statuses.get(index) || 'todo'
  }

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  function renderLines() {
    if (!isMounted) return null

    // Render preview line when in freeroam mode
    const freeroamPreviewLine =
      selectingIndex !== null && isFreeroam && previewPosition
        ? (() => {
            const el = todoRefs.current.get(selectingIndex)
            if (!el || !document.body.contains(el)) return null

            const rect = el.getBoundingClientRect()
            const start = {
              x: rect.right,
              y: rect.top + rect.height / 2,
            }
            const d = calculateBezier(start, previewPosition)

            return (
              <g key="preview-freeroam">
                <path
                  d={d}
                  stroke={theme.colors.freeroam}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="6 4"
                  opacity="0.3"
                />
                <circle
                  cx={previewPosition.x}
                  cy={previewPosition.y}
                  {...styles.freeroamDot}
                  opacity="0.5"
                />
              </g>
            )
          })()
        : null

    // Render preview line when in regular selection mode
    const selectionPreviewLine =
      selectingIndex !== null && !isFreeroam && mousePos
        ? (() => {
            const el = todoRefs.current.get(selectingIndex)
            if (!el || !document.body.contains(el)) return null

            const rect = el.getBoundingClientRect()
            const start = {
              x: rect.right,
              y: rect.top + rect.height / 2,
            }

            let end = mousePos
            if (hoveredTarget) {
              const tRect = hoveredTarget.getBoundingClientRect()
              end = { x: tRect.left, y: tRect.top + tRect.height / 2 }
            }

            const d = calculateBezier(start, end)

            return (
              <g key="preview-selection">
                <path
                  d={d}
                  stroke={theme.colors.primary}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="6 4"
                  opacity="0.5"
                />
              </g>
            )
          })()
        : null

    return createPortal(
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: theme.z.lines,
          width: '100vw',
          height: '100vh',
        }}
        onMouseDown={(e) => {
          // Prevent clicks on SVG from interfering with page interactions
          if ((e.target as SVGElement).tagName !== 'circle') {
            e.preventDefault()
          }
        }}
      >
        {freeroamPreviewLine}
        {selectionPreviewLine}
        {showLines &&
          connections.map((conn) => {
            const el = todoRefs.current.get(conn.todoIndex)
            if (!el || !document.body.contains(el)) return null

            const rect = el.getBoundingClientRect()
            const start = {
              x: rect.right,
              y: rect.top + rect.height / 2,
            }
            let end: Pos = { x: 0, y: 0 }

            if (conn.targetPosition) {
              end = conn.targetPosition
            } else if (conn.targetSelector) {
              const t = document.querySelector(conn.targetSelector)
              if (!t) return null
              const tRect = t.getBoundingClientRect()
              end = {
                x: tRect.left,
                y: tRect.top + tRect.height / 2,
              }
            }

            const d = calculateBezier(start, end)
            const isFree = !!conn.targetPosition
            const isEditing = editingConnection === conn.todoIndex
            const key = `${conn.todoIndex}-${isFree ? 'free' : 'dom'}`

            const strokeColor = isFree ? theme.colors.freeroam : lineColor
            const strokeOpacity = isFree ? 0.6 : lineOpacity

            return (
              <g key={key}>
                <path
                  d={d}
                  stroke={strokeColor}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="6 4"
                  style={{ animation: 'vigilo-dash 30s linear infinite' }}
                  opacity={strokeOpacity}
                />
                <circle
                  cx={start.x}
                  cy={start.y}
                  fill={strokeColor}
                  r={styles.connectorDot.r}
                  opacity={strokeOpacity}
                />
                {/* Invisible larger hit area for easier interaction */}
                <circle
                  ref={(el) => {
                    if (el) connectionPointRefs.current.set(conn.todoIndex, el)
                    else connectionPointRefs.current.delete(conn.todoIndex)
                  }}
                  cx={end.x}
                  cy={end.y}
                  r={12}
                  fill="transparent"
                  style={{
                    pointerEvents: 'auto',
                    cursor: isEditing ? 'grabbing' : 'grab',
                  }}
                />
                {/* Visible connection point */}
                <circle
                  cx={end.x}
                  cy={end.y}
                  fill={isFree ? styles.freeroamDot.fill : strokeColor}
                  stroke={isFree ? styles.freeroamDot.stroke : undefined}
                  strokeWidth={
                    isFree ? styles.freeroamDot.strokeWidth : undefined
                  }
                  r={
                    hoveredConnection === conn.todoIndex
                      ? isFree
                        ? 4.5
                        : 5
                      : isFree
                      ? styles.freeroamDot.r
                      : styles.connectorDot.r
                  }
                  opacity={
                    hoveredConnection === conn.todoIndex
                      ? 1
                      : isFree
                      ? styles.freeroamDot.opacity
                      : strokeOpacity
                  }
                  style={{
                    pointerEvents: 'none',
                    transition: 'r 0.2s, opacity 0.2s',
                  }}
                />
              </g>
            )
          })}
      </svg>,
      document.body
    )
  }

  const maxItemsForMode = displayMode === 'compact' ? 1 : MAX_VISIBLE_ITEMS

  // Filter items by search query - must be called before any early returns
  const filteredItems = useMemo(() => {
    if (!categoryData) return []
    if (!searchQuery.trim()) return categoryData.items
    const query = searchQuery.toLowerCase()
    return categoryData.items.filter((item) => 
      item.text.toLowerCase().includes(query) ||
      item.action?.toLowerCase().includes(query) ||
      item.info?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }, [categoryData, searchQuery])

  // Early returns after all hooks
  if (!categoryData || !isMounted) return null

  if (isHidden) return null

  const itemsToRender = isExpanded 
    ? filteredItems 
    : filteredItems.slice(0, maxItemsForMode)
  const hasMore = filteredItems.length > maxItemsForMode
  const primaryItem = categoryData.items[0]
  const shouldRenderLines = showLines && !isHidden

  return (
    <>
      <div ref={containerRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }}>
        {/* Invisible container for keyboard event targeting */}
      </div>
      <style>{`
        @keyframes vigilo-dash {
          to { stroke-dashoffset: -100; }
        }
        @keyframes vigilo-toast-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes vigilo-toast-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .vigilo-target-hover {
          outline: 2px solid ${theme.colors.primary} !important;
          outline-offset: 2px;
          background-color: ${theme.colors.primaryDim} !important;
          cursor: crosshair !important;
        }
        .vigilo-toast {
          animation: vigilo-toast-in 0.2s ease-out;
        }
        .vigilo-toast-exit {
          animation: vigilo-toast-out 0.2s ease-in;
        }
      `}</style>

      {(shouldRenderLines || selectingIndex !== null) && renderLines()}

      {/* 
         Overlay: The container must be pointer-events-none so mouse clicks
         pass through to the website elements. 
         This should always render when selecting, regardless of showLines setting.
      */}
      {selectingIndex !== null &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: theme.z.overlay,
              // Must be none to let clicks hit the DOM
              pointerEvents: 'none', 
              cursor: 'crosshair', // This won't show if pointerEvents is none, but that's acceptable tradeoff
            }}
          />,
          document.body
        )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`${styles.panel} ${
          displayMode === 'compact' ? 'w-72 px-3 pb-3 pt-0 gap-1 text-xs' : ''
        } ${
          displayMode === 'minimal'
            ? 'w-auto h-auto p-0 border-none bg-transparent shadow-none'
            : ''
        } ${
          displayMode === 'full' ? 'px-3 pb-3 pt-0' : ''
        }`}
        style={{
          left: pos.x,
          top: pos.y,
          zIndex: theme.z.panel,
          opacity: componentOpacity,
        }}
      >
        {displayMode === 'minimal' ? (
          <div
            className="relative group"
            onMouseDown={startDrag}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setAndPersistMode('compact')
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/90 text-[9px] font-mono text-zinc-200 shadow-lg"
            >
              <span className="truncate max-w-[1.75rem]">
                {(categoryData.displayName || category).slice(0, 2)}
              </span>
              <span className="absolute -top-1 -right-1 h-4 min-w-[1.1rem] rounded-full bg-blue-600 text-[9px] leading-4 text-center text-white px-1">
                {categoryData.items.length}
              </span>
            </button>

            {primaryItem && (
              <div
                className="absolute left-full top-1/2 ml-2 -translate-y-1/2 hidden group-hover:block rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 shadow-xl min-w-[10rem] max-w-xs"
              >
                <div className="mb-1 text-[10px] font-mono uppercase tracking-wide text-zinc-500">
                  Next task
                </div>
                <div className="truncate">{primaryItem.text}</div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div 
              className={`${styles.header} relative`} 
              onMouseDown={startDrag}
              style={{
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              <span className="text-[11px] font-mono truncate opacity-80">
                {categoryData.displayName || category}
              </span>
              <div
                className="flex items-center gap-1"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsSettingsOpen((open) => !open)
                  }}
                  className="relative p-1 text-xs opacity-60 transition-colors hover:opacity-100 hover:text-white"
                  aria-label="Open Vigilo settings"
                  title="Open settings (s)"
                >
                  ⋯
                  <span className="absolute -top-0.5 -right-0.5 text-[8px] font-mono opacity-40">s</span>
                </button>
                {isSettingsOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-md border border-zinc-800 bg-zinc-950 py-1 text-xs text-zinc-200 shadow-xl z-[60]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5 ${
                        displayMode === 'full' ? 'text-white' : ''
                      }`}
                      onClick={() => handleSetMode('full')}
                    >
                      <span>Full panel</span>
                      <span className="text-[10px] opacity-50 font-mono">1</span>
                    </button>
                    <button
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5 ${
                        displayMode === 'compact' ? 'text-white' : ''
                      }`}
                      onClick={() => handleSetMode('compact')}
                    >
                      <span>Compact panel</span>
                      <span className="text-[10px] opacity-50 font-mono">2</span>
                    </button>
                    <button
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                      onClick={() => handleSetMode('minimal')}
                    >
                      <span>Minimal dot</span>
                      <span className="text-[10px] opacity-50 font-mono">3</span>
                    </button>
                    <button
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                      onClick={handleToggleLines}
                    >
                      <span>Show connection lines</span>
                      <span className="text-[10px] opacity-60">
                        {showLines ? 'On' : 'Off'}
                      </span>
                    </button>
                    <button
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                      onClick={handleToggleBadges}
                    >
                      <span>Show badges</span>
                      <span className="text-[10px] opacity-60">
                        {showBadges ? 'On' : 'Off'}
                      </span>
                    </button>
                    <div className="my-1 border-t border-zinc-800" />
                    <div className="px-3 py-1.5">
                      <div className="mb-1.5 text-[10px] opacity-60">Line color</div>
                      <div className="flex gap-1.5">
                        {[
                          { color: theme.colors.primary, label: 'Blue' },
                          { color: theme.colors.freeroam, label: 'Purple' },
                          { color: 'rgb(34, 197, 94)', label: 'Green' },
                          { color: 'rgb(239, 68, 68)', label: 'Red' },
                          { color: 'rgb(234, 179, 8)', label: 'Yellow' },
                        ].map(({ color, label }) => (
                          <button
                            key={color}
                            onClick={() => handleSetLineColor(color)}
                            className={`h-5 w-5 rounded border-2 transition-all ${
                              lineColor === color ? 'border-white scale-110' : 'border-zinc-700 hover:border-zinc-600'
                            }`}
                            style={{ backgroundColor: color }}
                            title={label}
                            aria-label={`Set line color to ${label}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="px-3 py-1.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] opacity-60">Line opacity</span>
                        <span className="text-[10px] opacity-50 font-mono">{Math.round(lineOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={lineOpacity}
                        onChange={(e) => handleSetLineOpacity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, ${lineColor} 0%, ${lineColor} ${lineOpacity * 100}%, rgb(39, 39, 42) ${lineOpacity * 100}%, rgb(39, 39, 42) 100%)`,
                        }}
                      />
                    </div>
                    <div className="px-3 py-1.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] opacity-60">Component opacity</span>
                        <span className="text-[10px] opacity-50 font-mono">{Math.round(componentOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={componentOpacity}
                        onChange={(e) => handleSetComponentOpacity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                     <div className="my-1 border-t border-zinc-800" />
                     <button
                       className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                       onClick={exportConfig}
                     >
                       <span>Export configuration</span>
                       <span className="text-[10px] opacity-50 font-mono">Ctrl+E</span>
                     </button>
                     <button
                       className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                       onClick={importConfig}
                     >
                       <span>Import configuration</span>
                       <span className="text-[10px] opacity-50 font-mono">Ctrl+I</span>
                     </button>
                     <div className="my-1 border-t border-zinc-800" />
                     <button
                       className="flex w-full items-center justify-between px-3 py-1.5 text-left text-red-400 hover:bg-red-500/10"
                       onClick={handleHide}
                     >
                       <span>Hide for me</span>
                       <span className="text-[10px] opacity-50 font-mono">d</span>
                     </button>
                   </div>
                 )}
               </div>
             </div>

            <div
              className={`flex flex-col ${
                displayMode === 'compact' ? 'gap-0.5' : 'gap-1'
              }`}
            >
              {/* Search Input */}
              {(displayMode === 'full' || displayMode === 'compact') && (
                <div className="relative px-3 pb-2">
                  <input
                    data-vigilo-search
                    type="text"
                    placeholder="Search items... (/)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                  {searchQuery && (
                    <div className="absolute left-3 top-full mt-1 text-[10px] text-zinc-500 font-mono">
                      {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
              {itemsToRender.map((item, idx) => {
                const originalIndex = idx; 
                
                const hasConn = connections.find((c) => c.todoIndex === originalIndex)
                const isSelecting = selectingIndex === originalIndex
                const currentStatus = getItemStatus(originalIndex)
                const statusColors = {
                  todo: 'text-zinc-500',
                  working: 'text-yellow-500',
                  done: 'text-green-500',
                }

                return (
                  <div
                    key={originalIndex}
                    ref={(el) => {
                      if (el) todoRefs.current.set(originalIndex, el)
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setSelectingIndex(originalIndex)
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpenIssueIndex(originalIndex)
                    }}
                    className={`${styles.item} 
                      ${isSelecting ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''}
                      ${item.info ? 'cursor-help' : 'cursor-pointer'}
                      ${currentStatus === 'done' ? 'opacity-60' : ''}
                      group`}
                  >
                    {/* Status Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const nextStatus: TodoStatus = 
                            currentStatus === 'todo' ? 'working' :
                            currentStatus === 'working' ? 'done' : 'todo'
                          setItemStatus(originalIndex, nextStatus)
                        }}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          currentStatus === 'done' 
                            ? 'border-green-500 bg-green-500/20' 
                            : currentStatus === 'working'
                            ? 'border-yellow-500 bg-yellow-500/20'
                            : 'border-zinc-600 hover:border-zinc-500'
                        }`}
                        title={`Status: ${currentStatus} (click to cycle)`}
                      >
                        {currentStatus === 'done' && (
                          <span className="text-[10px] text-green-400">✓</span>
                        )}
                        {currentStatus === 'working' && (
                          <span className="text-[8px] text-yellow-400">⟳</span>
                        )}
                      </button>
                    </div>

                    {item.action && showBadges && (
                      <span className={styles.badge}>{item.action}</span>
                    )}
                    <span className={`flex-1 truncate min-w-0 text-sm font-mono ${statusColors[currentStatus]}`}>
                      {item.text}
                    </span>
                    {hasConn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeConnection(originalIndex)
                        }}
                        className="shrink-0 text-xs opacity-50 hover:text-red-400 hover:opacity-100 px-1"
                      >
                        ✕
                      </button>
                    )}
                    
                    {item.info && (
                      <div
                        className="absolute left-0 top-full mt-2 hidden w-64 p-3
                        z-50 rounded border border-zinc-700 bg-zinc-900
                        text-xs text-zinc-300 shadow-xl group-hover:block whitespace-normal break-words"
                      >
                        {item.info}
                      </div>
                    )}
                  </div>
                )
              })}
              
              {hasMore && (
                 <button
                  onClick={toggleViewMore}
                  className={`w-full text-center text-[10px] uppercase tracking-widest py-1
                    ${theme.colors.textDim} hover:text-zinc-300 transition-colors border-t border-zinc-800/50 mt-1`}
                >
                  {isExpanded ? 'Show Less' : `View ${categoryData.items.length - maxItemsForMode} More`}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detailed Issue View Modal */}
      {openIssueIndex !== null && categoryData && (() => {
        const item = categoryData.items[openIssueIndex]
        if (!item) return null
        
        return createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpenIssueIndex(null)
              }
            }}
          >
            <div
              className="relative w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const currentStatus = getItemStatus(openIssueIndex)
                      const nextStatus: TodoStatus = 
                        currentStatus === 'todo' ? 'working' :
                        currentStatus === 'working' ? 'done' : 'todo'
                      setItemStatus(openIssueIndex, nextStatus)
                    }}
                    className={`px-3 py-1.5 rounded-md border-2 text-xs font-mono transition-all ${
                      getItemStatus(openIssueIndex) === 'done'
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : getItemStatus(openIssueIndex) === 'working'
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {getItemStatus(openIssueIndex).toUpperCase()}
                  </button>
                  {item.action && (
                    <span className={styles.badge}>
                      {item.action}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setOpenIssueIndex(null)}
                  className="p-2 hover:bg-white/5 rounded transition-colors text-zinc-400 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <h2 className="text-xl font-mono font-semibold text-gray-200 mb-2">
                      {item.text}
                    </h2>
                    {item.description && (
                      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Info */}
                  {item.info && (
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2 font-mono">
                        Context
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {item.info}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2 font-mono">
                        Notes
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {item.notes}
                      </p>
                    </div>
                  )}

                  {/* Priority & Tags */}
                  {(item.priority || item.tags) && (
                    <div className="flex flex-wrap items-center gap-3">
                      {item.priority && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500 font-mono">Priority:</span>
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            item.priority === 'high'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : item.priority === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.priority.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-zinc-500 font-mono">Tags:</span>
                          {item.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connections */}
                  {connections.find((c) => c.todoIndex === openIssueIndex) && (
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2 font-mono">
                        Connected To
                      </div>
                      <div className="text-sm text-zinc-300 font-mono">
                        {(() => {
                          const conn = connections.find((c) => c.todoIndex === openIssueIndex)!
                          if (conn.targetLabel) {
                            return <span className="text-blue-400">{conn.targetLabel}</span>
                          } else if (conn.targetPosition) {
                            return <span className="text-purple-400">Freeroam position</span>
                          }
                          return null
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {(item.createdAt || item.updatedAt) && (
                    <div className="text-xs text-zinc-500 font-mono space-y-1">
                      {item.createdAt && (
                        <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                      )}
                      {item.updatedAt && (
                        <div>Updated: {new Date(item.updatedAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div className="text-xs text-zinc-500 font-mono">
                  Double-click item to open • Click status to cycle
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectingIndex(openIssueIndex)
                      setOpenIssueIndex(null)
                    }}
                    className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => {
                      removeConnection(openIssueIndex)
                    }}
                    className="px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-xs font-mono text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Remove Connection
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      })()}

      {/* Toast Notifications */}
      {toast && createPortal(
        <div
          className={`fixed top-4 right-4 z-[10001] px-4 py-3 rounded-lg border shadow-xl font-mono text-sm transition-all ${
            toast.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          } vigilo-toast`}
        >
          {toast.message}
        </div>,
        document.body
      )}

      {/* Keyboard Help Overlay */}
      {showKeyboardHelp && createPortal(
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950">
              <h2 className="text-lg font-mono font-semibold text-gray-200">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 hover:bg-white/5 rounded transition-colors text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-mono font-semibold text-zinc-300 mb-2">Navigation</h3>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Open settings</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">s</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Show keyboard help</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">?</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Search items</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">/</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Close modals</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">Esc</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-mono font-semibold text-zinc-300 mb-2">Display Modes</h3>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Full panel</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">1</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Compact panel</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">2</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Minimal dot</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">3</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-mono font-semibold text-zinc-300 mb-2">Actions</h3>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Toggle connection lines</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">l</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Toggle badges</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">b</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Hide component</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">d</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-mono font-semibold text-zinc-300 mb-2">Data Management</h3>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Export configuration</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">Ctrl+E</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Import configuration</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">Ctrl+I</kbd>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Undo last action</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300">Ctrl+Z</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-mono font-semibold text-zinc-300 mb-2">Interactions</h3>
                <div className="space-y-1.5 text-xs font-mono text-zinc-400">
                  <div className="py-1 border-b border-zinc-800/50">Right-click item to connect</div>
                  <div className="py-1 border-b border-zinc-800/50">Double-click item to view details</div>
                  <div className="py-1 border-b border-zinc-800/50">Click status to cycle (todo → working → done)</div>
                  <div className="py-1 border-b border-zinc-800/50">Drag connection point to edit</div>
                  <div className="py-1">Double-click connection point to remove</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

/**
 * React wrapper that renders the Vigilo overlay. Pass literal `categories`
 * to get autocomplete for valid ids, and supply theme overrides to fully brand it.
 */
export function Vigilo<TCategories extends readonly CategoryConfig[] = CategoryConfig[]>(
  props: VigiloProps<TCategories>
) {
  const [shouldRenderPalette, setShouldRenderPalette] = useState(paletteMounted)

  useEffect(() => {
    if (!paletteMounted) {
      paletteMounted = true
      setShouldRenderPalette(true)
    }
  }, [])

  return (
    <>
      {props.enabled ? <VigiloCore {...props} /> : null}
      {shouldRenderPalette ? <VigiloCommandPalette /> : null}
    </>
  )
}
