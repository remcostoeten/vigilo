import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  getPaletteInstances,
  subscribePaletteInstances,
  type PaletteInstanceSnapshot,
  type PaletteTaskSnapshot,
} from './registry'
import { parseSmartSyntax } from '../core/smart-syntax'
import { enhanceTask, isAIAvailable } from '../core/ai'
import { enhanceWithGrok, smartParseWithGrok } from '../core/grok'

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  const editable =
    target.isContentEditable ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT'
  return editable
}

export interface BtwfyiCommandPaletteProps {
  /**
   * The key to use for the keyboard shortcut (default: 'k').
   * Set to null to disable the keyboard shortcut entirely.
   */
  shortcutKey?: string | null
  /**
   * The modifier key to use: 'alt', 'ctrl', 'meta', or 'shift' (default: 'alt').
   * Ignored if shortcutKey is null.
   */
  shortcutModifier?: 'alt' | 'ctrl' | 'meta' | 'shift'
  /**
   * Whether to disable the keyboard shortcut entirely (default: false).
   * If true, only the "btwfyi" typed sequence will open the palette.
   */
  disableShortcut?: boolean
  onTaskCreate?: (task: { text: string; dueDate?: Date; tags: string[]; priority?: 'low' | 'medium' | 'high' }) => void
  aiConfig?: {
    grokApiKey?: string
    preferCloud?: boolean
  }
}

/**
 * Global command palette that surfaces all Btwfyi tasks across an application.
 * Opens via Alt + K (configurable) or by typing "btwfyi" in sequence.
 */
export function BtwfyiCommandPalette({
  shortcutKey = 'k',
  shortcutModifier = 'alt',
  disableShortcut = false,
  onTaskCreate,
  aiConfig,
}: BtwfyiCommandPaletteProps = {}) {
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAISupported, setIsAISupported] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [instances, setInstances] = useState<PaletteInstanceSnapshot[]>(
    () => getPaletteInstances()
  )
  const inputRef = useRef<HTMLInputElement | null>(null)
  const typedRef = useRef('')
  const taskButtonRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    setIsMounted(true)
    isAIAvailable().then(setIsAISupported)
  }, [])

  useEffect(() => subscribePaletteInstances(setInstances), [])

  useEffect(() => {
    if (!isOpen) return
    const id = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
    return () => window.clearTimeout(id)
  }, [isOpen])

  const closePalette = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(null)
  }, [])

  const openPalette = useCallback((initialQuery = '') => {
    setQuery(initialQuery)
    setIsOpen(true)
    setSelectedIndex(null)
  }, [])

  const managementMode = query.trim().toLowerCase() === 'btwfyi'

  const tasks = useMemo(() => {
    return instances.flatMap((instance) =>
      instance.tasks.map((task) => ({
        instance,
        task,
      }))
    )
  }, [instances])

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || managementMode) return tasks
    return tasks.filter(({ task, instance }) => {
      const haystack = `${task.text} ${task.status} ${instance?.label ?? ''} ${instance?.categoryId ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [managementMode, query, tasks])

  const handleSelectTask = useCallback(
    (task: PaletteTaskSnapshot) => {
      task.focusTask()
      closePalette()
    },
    [closePalette]
  )

  // Reset selected index when query or filtered tasks change
  useEffect(() => {
    setSelectedIndex(null)
  }, [query, filteredTasks.length])

  useEffect(() => {
    if (disableShortcut || shortcutKey === null) return

    function onKeyDown(e: KeyboardEvent) {
      if (isEditableElement(e.target)) return

      const key = e.key.toLowerCase()
      const targetKey = shortcutKey?.toLowerCase() ?? ''

      // Check if the configured shortcut is pressed
      const modifierPressed =
        (shortcutModifier === 'alt' && e.altKey) ||
        (shortcutModifier === 'ctrl' && e.ctrlKey) ||
        (shortcutModifier === 'meta' && e.metaKey) ||
        (shortcutModifier === 'shift' && e.shiftKey)

      const isShortcutPressed = modifierPressed && key === targetKey
      if (isShortcutPressed) {
        e.preventDefault()
        openPalette('')
        return
      }

      if (!isOpen && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        typedRef.current = (typedRef.current + key).slice(-6)
        if (typedRef.current.endsWith('btwfyi')) {
          openPalette('btwfyi')
          typedRef.current = ''
          e.preventDefault()
        }
        return
      }

      if (isOpen && key === 'escape') {
        e.preventDefault()
        closePalette()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closePalette, isOpen, openPalette, disableShortcut, shortcutKey, shortcutModifier])

  // Handle keyboard navigation when palette is open
  useEffect(() => {
    if (!isOpen || managementMode) return

    function handlePaletteKeyDown(e: KeyboardEvent) {
      // Only handle navigation keys, let input handle typing
      const isInputFocused = e.target === inputRef.current
      const maxIndex = filteredTasks.length - 1

      // Handle arrow keys - navigate tasks
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (maxIndex < 0) return
        const nextIndex = selectedIndex === null ? 0 : Math.min(selectedIndex + 1, maxIndex)
        setSelectedIndex(nextIndex)
        taskButtonRefs.current[nextIndex]?.focus()
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (maxIndex < 0) return
        const prevIndex = selectedIndex === null ? maxIndex : Math.max(selectedIndex - 1, 0)
        setSelectedIndex(prevIndex)
        taskButtonRefs.current[prevIndex]?.focus()
        return
      }

      // Handle Enter to select (only if not typing in input or if task is selected)
      if (e.key === 'Enter' && !isInputFocused && selectedIndex !== null && filteredTasks[selectedIndex]) {
        e.preventDefault()
        handleSelectTask(filteredTasks[selectedIndex].task)
        return
      }

      // Handle Enter in input - select first task or selected task
      if (e.key === 'Enter' && isInputFocused) {
        e.preventDefault()
        if (selectedIndex !== null && filteredTasks[selectedIndex]) {
          handleSelectTask(filteredTasks[selectedIndex].task)
        } else if (filteredTasks.length > 0 && filteredTasks[0]) {
          handleSelectTask(filteredTasks[0].task)
        }
        return
      }

      // Handle Backspace to go back (deselect) - only if task is selected
      if (e.key === 'Backspace' && selectedIndex !== null && !isInputFocused) {
        e.preventDefault()
        setSelectedIndex(null)
        inputRef.current?.focus()
        return
      }
    }

    window.addEventListener('keydown', handlePaletteKeyDown)
    return () => window.removeEventListener('keydown', handlePaletteKeyDown)
  }, [isOpen, selectedIndex, filteredTasks, handleSelectTask, managementMode])

  const handleClearConnection = useCallback((task: PaletteTaskSnapshot) => {
    task.clearConnection?.()
  }, [])

  if (!isMounted) return null

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Btwfyi command palette"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          closePalette()
        }
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl text-zinc-50">
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text')
                if (!onTaskCreate) return

                // 1. Try JSON Import
                try {
                  const json = JSON.parse(text)
                  if (Array.isArray(json)) {
                    e.preventDefault()
                    // Allow simple strings or objects with 'text'
                    json.forEach(item => {
                      const taskText = typeof item === 'string' ? item : item?.text
                      if (taskText && typeof taskText === 'string') {
                        onTaskCreate(parseSmartSyntax(taskText))
                      }
                    })
                    closePalette()
                    return
                  }
                } catch {
                  // Not JSON, continue
                }

                // 2. Try Markdown/List Import
                if (text.includes('\n') || text.trim().startsWith('-')) {
                  // Check for markdown list items (unordered or ordered)
                  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
                  // Improved list detection: - * 1. or just bullet-like characters
                  const isList = lines.length > 1 || lines.every(l => /^(\s*[-*•]|\s*\d+\.)\s/.test(l))

                  if (isList) {
                    e.preventDefault()
                    lines.forEach(line => {
                      // Remove list markers
                      const cleanText = line.replace(/^(\s*[-*•]|\s*\d+\.)\s/, '')
                      const parsed = parseSmartSyntax(cleanText)
                      onTaskCreate(parsed)
                    })
                    closePalette()
                    return
                  }
                }

                // 3. Try Grok Smart Parse (fallback if configured)
                if (aiConfig?.grokApiKey && !isParsing) {
                  e.preventDefault()
                  setIsParsing(true)
                  smartParseWithGrok(text, aiConfig.grokApiKey)
                    .then(tasks => {
                      tasks.forEach(t => onTaskCreate(t))
                      if (tasks.length > 0) closePalette()
                    })
                    .catch(console.error)
                    .finally(() => setIsParsing(false))
                }
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search Btwfyi tasks… (type "btwfyi" for management view)'
              className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-zinc-500"
              aria-label="Search tasks"
              aria-autocomplete="list"
              aria-controls="btwfyi-palette-list"
              aria-expanded="true"
            />
            {(isAISupported || aiConfig?.grokApiKey) && (
              <button
                onClick={async () => {
                  if (!query.trim() || isEnhancing) return
                  setIsEnhancing(true)
                  try {
                    let enhanced = ''
                    // Prefer Cloud if configured and not explicitly set to prefer local (or if local is not available)
                    if (aiConfig?.grokApiKey && (!isAISupported || aiConfig.preferCloud)) {
                      enhanced = await enhanceWithGrok(query, aiConfig.grokApiKey)
                    } else if (isAISupported) {
                      enhanced = await enhanceTask(query)
                    }

                    if (enhanced) setQuery(enhanced)
                  } catch (e) {
                    console.error('Enhance failed', e)
                  } finally {
                    setIsEnhancing(false)
                    inputRef.current?.focus()
                  }
                }}
                disabled={!query.trim() || isEnhancing}
                className={`
                    p-1 rounded-md transition-colors 
                    ${!query.trim() ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-800 text-amber-300'}
                    ${isEnhancing ? 'animate-pulse cursor-wait' : ''}
                 `}
                title={aiConfig?.grokApiKey ? "Enhance with Grok AI" : "Enhance with Local AI"}
              >
                ✨
              </button>
            )}
            <kbd className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400" aria-label="Press Escape to close">
              esc
            </kbd>
          </div>
          <p className="mt-1 text-xs text-zinc-500" id="btwfyi-palette-help">
            {disableShortcut || shortcutKey === null
              ? 'Type "btwfyi" for overlay management.'
              : `${shortcutModifier === 'alt' ? 'Alt' : shortcutModifier === 'ctrl' ? 'Ctrl' : shortcutModifier === 'meta' ? 'Cmd' : 'Shift'} + ${shortcutKey.toUpperCase()} to open from anywhere. Type "btwfyi" for overlay management.`}
            {' '}
            {filteredTasks.length > 0 && 'Use arrow keys to navigate, Enter to select, Backspace to go back.'}
          </p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {instances.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">
              No Btwfyi overlays are active on this page yet.
            </div>
          ) : managementMode ? (
            <ManagementView instances={instances} closePalette={closePalette} />
          ) : filteredTasks.length > 0 ? (
            <ul
              id="btwfyi-palette-list"
              role="listbox"
              aria-label="Task list"
              className="divide-y divide-zinc-900"
            >
              {filteredTasks.map(({ instance, task }, index) => {
                const isSelected = selectedIndex === index
                return (
                  <li key={task.id} role="option" aria-selected={isSelected}>
                    <button
                      ref={(el) => {
                        taskButtonRefs.current[index] = el
                      }}
                      className={`flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors ${isSelected
                        ? 'bg-blue-500/20 ring-2 ring-blue-500'
                        : 'hover:bg-white/5'
                        }`}
                      onClick={() => handleSelectTask(task)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      aria-label={`${task.text}, Status: ${task.status}, Instance: ${instance.label}${task.hasConnection ? ', Has connection' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-100">
                          {task.text}
                        </span>
                        <span className="text-2xs inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2 py-0.5 text-zinc-400">
                          {instance.label}
                          {task.hasConnection && (
                            <span
                              className="inline-flex h-2 w-2 rounded-full bg-blue-400"
                              aria-label="Has connection"
                            />
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>Status: {task.status}</span>
                        {task.hasConnection && (
                          <button
                            type="button"
                            className="text-xs text-rose-400 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClearConnection(task)
                            }}
                            aria-label={`Remove connection for ${task.text}`}
                          >
                            Remove connection
                          </button>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-zinc-500" role="status" aria-live="polite">
              {onTaskCreate ? (
                <>
                  <span className="block mb-1 text-zinc-400">Press <kbd className="font-sans border border-zinc-700 rounded px-1 text-xs">Enter</kbd> to create task</span>
                  <span className="text-zinc-500">"{query}"</span>
                </>
              ) : (
                `No tasks match "${query}".`
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function ManagementView({
  instances,
  closePalette,
}: {
  instances: PaletteInstanceSnapshot[]
  closePalette: () => void
}) {
  if (instances.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-zinc-500">
        Nothing to manage yet.
      </div>
    )
  }

  return (
    <div className="divide-y divide-zinc-900">
      {instances.map((instance) => (
        <div key={instance.instanceKey} className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                {instance.label}
              </p>
              <p className="text-xs text-zinc-500">
                {instance.connectedCount} connections • {instance.totalTasks} tasks
              </p>
            </div>
            <span
              className={`text-2xs rounded-full border px-2 py-0.5 ${instance.hidden
                ? 'border-zinc-800 text-zinc-500'
                : 'border-emerald-500/40 text-emerald-300'
                }`}
            >
              {instance.hidden ? 'Hidden' : 'Visible'}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              className="rounded-md border border-blue-500/40 px-3 py-1 text-blue-200 hover:bg-blue-500/10"
              onClick={() => {
                closePalette()
                instance.actions.focus()
              }}
            >
              Focus overlay
            </button>
            <button
              className="rounded-md border border-zinc-700 px-3 py-1 text-zinc-300 hover:bg-white/5"
              onClick={() => {
                instance.actions.show()
              }}
            >
              Show
            </button>
            <button
              className="rounded-md border border-zinc-700 px-3 py-1 text-zinc-300 hover:bg-white/5"
              onClick={() => instance.actions.hide()}
            >
              Hide
            </button>

            {/* Export Actions */}
            <div className="h-4 w-px bg-zinc-800 mx-1 self-center" />

            <button
              className="rounded-md border border-purple-500/40 px-3 py-1 text-purple-200 hover:bg-purple-500/10"
              onClick={() => {
                const md = instance.tasks.map(t => `- [${t.status === 'done' ? 'x' : ' '}] ${t.text} ${t.priority ? '!' + t.priority : ''} ${t.tags.map(tag => '#' + tag).join(' ')}`).join('\n')
                navigator.clipboard.writeText(md)
                // Ideally show a toast here
              }}
              title="Copy as Markdown list"
            >
              Copy MD
            </button>
            <button
              className="rounded-md border border-green-500/40 px-3 py-1 text-green-200 hover:bg-green-500/10"
              onClick={() => {
                const slack = instance.tasks.map(t => `• ${t.status === 'done' ? '~' : ''}${t.text}${t.status === 'done' ? '~' : ''} ${t.priority ? '(*' + t.priority + '*)' : ''}`).join('\n')
                navigator.clipboard.writeText(slack)
              }}
              title="Copy for Slack"
            >
              Copy Slack
            </button>
            <button
              className="rounded-md border border-zinc-600 px-3 py-1 text-zinc-400 hover:bg-zinc-700/20"
              onClick={() => {
                const json = JSON.stringify(instance.tasks, null, 2)
                navigator.clipboard.writeText(json)
              }}
              title="Copy raw JSON"
            >
              JSON
            </button>

            <div className="h-4 w-px bg-zinc-800 mx-1 self-center" />

            <button
              className="rounded-md border border-rose-500/40 px-3 py-1 text-rose-300 hover:bg-rose-500/10"
              onClick={() => instance.actions.resetConnections()}
            >
              Clear connections
            </button>
            <button
              className="rounded-md border border-amber-500/40 px-3 py-1 text-amber-200 hover:bg-amber-500/10"
              onClick={() => instance.actions.resetStatuses()}
            >
              Reset statuses
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
