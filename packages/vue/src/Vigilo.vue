<template>
  <Teleport to="body">
    <!-- Invisible container for keyboard event targeting -->
    <div
      ref="containerRef"
      :style="{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }"
    />
    <!-- Connection Lines SVG -->
    <svg
      v-if="shouldRenderLines || selectingIndex !== null"
      :style="{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: theme.z.lines,
        width: '100vw',
        height: '100vh',
      }"
      @mousedown="handleSvgMouseDown"
    >
      <!-- Freeroam Preview Line -->
      <g v-if="selectingIndex.value !== null && isFreeroam.value && previewPosition.value">
        <path
          :d="freeroamPreviewPath"
          :stroke="theme.colors.freeroam"
          stroke-width="2"
          fill="none"
          stroke-dasharray="6 4"
          opacity="0.3"
        />
        <circle
          :cx="previewPosition.value.x"
          :cy="previewPosition.value.y"
          :r="styles.freeroamDot.r"
          :fill="styles.freeroamDot.fill"
          :stroke="styles.freeroamDot.stroke"
          :stroke-width="styles.freeroamDot.strokeWidth"
          opacity="0.5"
        />
      </g>

      <!-- Selection Preview Line -->
      <g v-if="selectingIndex.value !== null && !isFreeroam.value && mousePos.value">
        <path
          :d="selectionPreviewPath"
          :stroke="theme.colors.primary"
          stroke-width="2"
          fill="none"
          stroke-dasharray="6 4"
          opacity="0.5"
        />
      </g>

      <!-- Connection Lines -->
      <g v-if="showLines.value">
        <g v-for="conn in connections" :key="`${conn.todoIndex}-${conn.targetPosition ? 'free' : 'dom'}`">
          <path
            v-if="connectionPath(conn)"
            :d="connectionPath(conn)!"
            :stroke="conn.targetPosition ? theme.colors.freeroam : lineColor.value"
            :stroke-opacity="conn.targetPosition ? 0.6 : lineOpacity.value"
            stroke-width="2"
            fill="none"
            stroke-dasharray="6 4"
            :style="{ animation: 'vigilo-dash 30s linear infinite' }"
          />
          <circle
            v-if="connectionStart(conn)"
            :cx="connectionStart(conn)!.x"
            :cy="connectionStart(conn)!.y"
            :r="styles.connectorDot.r"
            :fill="conn.targetPosition ? theme.colors.freeroam : lineColor"
            :opacity="conn.targetPosition ? 0.6 : lineOpacity"
          />
          <circle
            v-if="connectionEnd(conn)"
            :ref="(el) => setConnectionPointRef(conn.todoIndex, el as SVGCircleElement)"
            :cx="connectionEnd(conn)!.x"
            :cy="connectionEnd(conn)!.y"
            :r="hoveredConnection.value === conn.todoIndex ? (conn.targetPosition ? 4.5 : 5) : (conn.targetPosition ? styles.freeroamDot.r : styles.connectorDot.r)"
            :fill="conn.targetPosition ? styles.freeroamDot.fill : lineColor.value"
            :stroke="conn.targetPosition ? styles.freeroamDot.stroke : undefined"
            :stroke-width="conn.targetPosition ? styles.freeroamDot.strokeWidth : undefined"
            :opacity="hoveredConnection.value === conn.todoIndex ? 1 : (conn.targetPosition ? styles.freeroamDot.opacity : lineOpacity.value)"
            style="pointer-events: none; transition: r 0.2s, opacity 0.2s;"
          />
          <!-- Invisible hit area -->
          <circle
            v-if="connectionEnd(conn)"
            :cx="connectionEnd(conn)!.x"
            :cy="connectionEnd(conn)!.y"
            r="12"
            fill="transparent"
            :style="{ pointerEvents: 'auto', cursor: editingConnection.value === conn.todoIndex ? 'grabbing' : 'grab' }"
            @mousedown="(e) => handleConnectionPointMouseDown(e, conn.todoIndex)"
            @dblclick="() => removeConnection(conn.todoIndex)"
            @mouseenter="() => (hoveredConnection.value = conn.todoIndex)"
            @mouseleave="() => (hoveredConnection.value = null)"
          />
        </g>
      </g>
    </svg>

    <!-- Selection Overlay -->
    <div
      v-if="selectingIndex.value !== null"
      :style="{
        position: 'fixed',
        inset: 0,
        zIndex: theme.z.overlay,
        pointerEvents: 'none',
        cursor: 'crosshair',
      }"
    />

    <!-- Main Panel -->
    <div
      v-if="!isHidden.value && categoryData && isMounted.value"
      ref="panelRef"
          :class="[
        styles.panel,
        displayMode.value === 'compact' ? 'w-72 px-3 pb-3 pt-0 gap-1 text-xs' : '',
        displayMode.value === 'minimal' ? 'w-auto h-auto p-0 border-none bg-transparent shadow-none' : '',
        displayMode.value === 'full' ? 'px-3 pb-3 pt-0' : '',
      ]"
        :style="{
        left: `${pos.value.x}px`,
        top: `${pos.value.y}px`,
        zIndex: theme.z.panel,
        opacity: componentOpacity.value,
      }"
    >
      <!-- Minimal Mode -->
      <div v-if="displayMode.value === 'minimal'" class="relative group" @mousedown="startDrag" :style="{ cursor: isDragging.value ? 'grabbing' : 'grab' }">
        <button
          @click="() => setAndPersistMode('compact')"
          class="relative flex h-9 w-9 items-center justify-center border border-zinc-800 bg-zinc-950/90 text-[9px] font-mono text-zinc-200 shadow-lg"
        >
          <span class="truncate max-w-[1.75rem]">
            {{ (categoryData.displayName || category).slice(0, 2) }}
          </span>
          <span class="absolute -top-1 -right-1 h-4 min-w-[1.1rem] bg-blue-600 text-[9px] leading-4 text-center text-white px-1">
            {{ categoryData.items.length }}
          </span>
        </button>
        <div
          v-if="primaryItem"
          class="absolute left-full top-1/2 ml-2 -translate-y-1/2 hidden group-hover:block border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 shadow-xl min-w-[10rem] max-w-xs"
        >
          <div class="mb-1 text-[10px] font-mono uppercase tracking-wide text-zinc-500">Next task</div>
          <div class="truncate">{{ primaryItem.text }}</div>
        </div>
      </div>

      <!-- Full/Compact Mode -->
      <template v-else>
        <div
          :class="[styles.header, 'relative']"
          @mousedown="startDrag"
          :style="{ cursor: isDragging.value ? 'grabbing' : 'grab' }"
        >
          <span class="text-[11px] font-mono truncate opacity-80">
            {{ categoryData.displayName || category }}
          </span>
          <div class="flex items-center gap-1" @mousedown.stop>
            <button
              @click="() => setIsSettingsOpen(!isSettingsOpen)"
              class="relative p-1 text-xs opacity-60 transition-colors hover:opacity-100 hover:text-white"
              aria-label="Open Vigilo settings"
              title="Open settings (s)"
            >
              ⋯
              <span class="absolute -top-0.5 -right-0.5 text-[8px] font-mono opacity-40">s</span>
            </button>
            <div v-if="isSettingsOpen" class="absolute right-0 top-full mt-2 w-56 border border-zinc-800 bg-zinc-950 py-1 text-xs text-zinc-200 shadow-xl z-[60]" @click.stop>
              <button
                :class="['flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5', displayMode.value === 'full' ? 'text-white' : '']"
                @click="() => handleSetMode('full')"
              >
                <span>Full panel</span>
                <span class="text-[10px] opacity-50 font-mono">1</span>
              </button>
              <button
                :class="['flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5', displayMode.value === 'compact' ? 'text-white' : '']"
                @click="() => handleSetMode('compact')"
              >
                <span>Compact panel</span>
                <span class="text-[10px] opacity-50 font-mono">2</span>
              </button>
              <button
                class="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                @click="() => handleSetMode('minimal')"
              >
                <span>Minimal dot</span>
                <span class="text-[10px] opacity-50 font-mono">3</span>
              </button>
              <button
                class="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                @click="handleToggleLines"
              >
                <span>Show connection lines</span>
                  <span class="text-[10px] opacity-60">{{ showLines.value ? 'On' : 'Off' }}</span>
              </button>
              <button
                class="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                @click="handleToggleBadges"
              >
                <span>Show badges</span>
                  <span class="text-[10px] opacity-60">{{ showBadges.value ? 'On' : 'Off' }}</span>
              </button>
              <div class="my-1 border-t border-zinc-800" />
              <div class="px-3 py-1.5">
                <div class="mb-1.5 text-[10px] opacity-60">Line color</div>
                <div class="flex gap-1.5">
                  <button
                    v-for="{ color, label } in colorOptions"
                    :key="color"
                    :class="['h-5 w-5 border-2 transition-all', lineColor.value === color ? 'border-white scale-110' : 'border-zinc-700 hover:border-zinc-600']"
                    :style="{ backgroundColor: color }"
                    :title="label"
                    :aria-label="`Set line color to ${label}`"
                    @click="() => handleSetLineColor(color)"
                  />
                </div>
              </div>
              <div class="px-3 py-1.5">
                <div class="mb-1.5 flex items-center justify-between">
                  <span class="text-[10px] opacity-60">Line opacity</span>
                  <span class="text-[10px] opacity-50 font-mono">{{ Math.round(lineOpacity.value * 100) }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="lineOpacity.value"
                  @input="(e) => handleSetLineOpacity(parseFloat((e.target as HTMLInputElement).value))"
                  class="w-full h-1 bg-zinc-800 appearance-none cursor-pointer"
                  :style="{
                    background: `linear-gradient(to right, ${lineColor.value} 0%, ${lineColor.value} ${lineOpacity.value * 100}%, rgb(39, 39, 42) ${lineOpacity.value * 100}%, rgb(39, 39, 42) 100%)`,
                  }"
                />
              </div>
              <div class="px-3 py-1.5">
                <div class="mb-1.5 flex items-center justify-between">
                  <span class="text-[10px] opacity-60">Component opacity</span>
                  <span class="text-[10px] opacity-50 font-mono">{{ Math.round(componentOpacity.value * 100) }}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  :value="componentOpacity.value"
                  @input="(e) => handleSetComponentOpacity(parseFloat((e.target as HTMLInputElement).value))"
                  class="w-full h-1 bg-zinc-800 appearance-none cursor-pointer"
                />
              </div>
              <div class="my-1 border-t border-zinc-800" />
              <button
                class="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                @click="exportConfig"
              >
                <span>Export configuration</span>
                <span class="text-[10px] opacity-50 font-mono">Ctrl+E</span>
              </button>
              <button
                class="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/5"
                @click="importConfig"
              >
                <span>Import configuration</span>
                <span class="text-[10px] opacity-50 font-mono">Ctrl+I</span>
              </button>
              <div class="my-1 border-t border-zinc-800" />
              <button
                class="flex w-full items-center justify-between px-3 py-1.5 text-left text-red-400 hover:bg-red-500/10"
                @click="handleHide"
              >
                <span>Hide for me</span>
                <span class="text-[10px] opacity-50 font-mono">d</span>
              </button>
            </div>
          </div>
        </div>

        <div :class="['flex flex-col', displayMode.value === 'compact' ? 'gap-0.5' : 'gap-1']">
          <!-- Search Input -->
          <div v-if="displayMode.value === 'full' || displayMode.value === 'compact'" class="relative px-3 pb-2">
            <input
              v-model="searchQuery"
              data-vigilo-search
              type="text"
              placeholder="Search items... (/)"
              class="w-full px-2 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              v-if="searchQuery"
              @click="() => (searchQuery = '')"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
            <div v-if="searchQuery" class="absolute left-3 top-full mt-1 text-[10px] text-zinc-500 font-mono">
              {{ filteredItems.length }} result{{ filteredItems.length !== 1 ? 's' : '' }}
            </div>
          </div>

          <!-- Todo Items -->
          <div
            v-for="(item, idx) in itemsToRender"
            :key="idx"
            :ref="(el) => setTodoRef(idx, el as HTMLDivElement)"
            @contextmenu.prevent="() => (selectingIndex.value = idx)"
            @dblclick.prevent.stop="() => (openIssueIndex.value = idx)"
                :class="[
              styles.item,
              selectingIndex.value === idx ? 'ring-1 ring-blue-500 bg-blue-500/10' : '',
              item.info ? 'cursor-help' : 'cursor-pointer',
              getItemStatus(idx) === 'done' ? 'opacity-60' : '',
              'group',
            ]"
          >
            <!-- Status Toggle -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                @click.stop="() => setItemStatus(idx, getNextStatus(getItemStatus(idx)))"
                :class="[
                  'w-4 h-4 border-2 flex items-center justify-center transition-all',
                  getItemStatus(idx) === 'done'
                    ? 'border-green-500 bg-green-500/20'
                    : getItemStatus(idx) === 'working'
                    ? 'border-yellow-500 bg-yellow-500/20'
                    : 'border-zinc-600 hover:border-zinc-500',
                ]"
                :title="`Status: ${getItemStatus(idx)} (click to cycle)`"
              >
                <span v-if="getItemStatus(idx) === 'done'" class="text-[10px] text-green-400">✓</span>
                <span v-else-if="getItemStatus(idx) === 'working'" class="text-[8px] text-yellow-400">⟳</span>
              </button>
            </div>

            <span v-if="item.action && showBadges.value" :class="styles.badge">{{ item.action }}</span>
            <span
              :class="[
                'flex-1 truncate min-w-0 text-sm font-mono',
                getItemStatus(idx) === 'done'
                  ? 'text-green-500'
                  : getItemStatus(idx) === 'working'
                  ? 'text-yellow-500'
                  : 'text-zinc-500',
              ]"
            >
              {{ item.text }}
            </span>
            <button
              v-if="hasConnection(idx)"
              @click.stop="() => removeConnection(idx)"
              class="shrink-0 text-xs opacity-50 hover:text-red-400 hover:opacity-100 px-1"
            >
              ✕
            </button>

            <div
              v-if="item.info"
              class="absolute left-0 top-full mt-2 hidden w-64 p-3 z-50 border border-zinc-700 bg-zinc-900 text-xs text-zinc-300 shadow-xl group-hover:block whitespace-normal break-words"
            >
              {{ item.info }}
            </div>
          </div>

          <!-- View More Button -->
          <button
            v-if="hasMore.value"
            @click="toggleViewMore"
            :class="[
              'w-full text-center text-[10px] uppercase tracking-widest py-1',
              theme.colors.textDim,
              'hover:text-zinc-300 transition-colors border-t border-zinc-800/50 mt-1',
            ]"
          >
            {{ isExpanded.value ? 'Show Less' : `View ${categoryData.items.length - maxItemsForMode.value} More` }}
          </button>
        </div>
      </template>
    </div>

    <!-- Toast Notification -->
    <Teleport v-if="toast" to="body">
      <div
        :class="[
          'fixed top-4 right-4 z-[10001] px-4 py-3 border shadow-xl font-mono text-sm transition-all vigilo-toast',
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        ]"
      >
        {{ toast.message }}
      </div>
    </Teleport>
  </Teleport>

  <!-- Styles -->
  <style>
    @keyframes vigilo-dash {
      to {
        stroke-dashoffset: -100;
      }
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
      outline: 2px solid v-bind('theme.colors.primary') !important;
      outline-offset: 2px;
      background-color: v-bind('theme.colors.primaryDim') !important;
      cursor: crosshair !important;
    }
    .vigilo-toast {
      animation: vigilo-toast-in 0.2s ease-out;
    }
    .vigilo-toast-exit {
      animation: vigilo-toast-out 0.2s ease-in;
    }
  </style>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { CategoryConfig, Connection, DisplayMode, Pos, TodoStatus, UndoSnapshot, VigiloStorage } from '@remcostoeten/vigilo-core'
import { calculateBezier } from '@remcostoeten/vigilo-core'
import { createDefaultState } from '@remcostoeten/vigilo-core'
import { createVigiloStore, type VigiloStore } from '@remcostoeten/vigilo-core'
import { generateSelector, getElementLabel } from './dom'
import { MAX_VISIBLE_ITEMS, UNDO_WINDOW_MS } from './constants'
import type { VigiloProps } from './types'
import { mergeTheme, mergeStyles } from './theme'

const props = withDefaults(defineProps<VigiloProps & { storage?: VigiloStorage }>(), {
  enabled: true,
  colorMode: 'dark',
})

// Computed values
const categoryData = computed(() => props.categories.find((c) => c.id === props.category))
const instanceKey = computed(() => props.instanceId || props.category)
const theme = computed(() => mergeTheme(props.themeOverrides, props.colorMode))
const primaryLineColor = computed(() => theme.value.colors.primary)
const styles = computed(() => mergeStyles(theme.value, props.stylesOverrides))
const defaultState = computed(() => createDefaultState({ lineColor: primaryLineColor.value }))

// State
const isMounted = ref(false)
const storeState = ref(defaultState.value)
const isExpanded = ref(false)
const isSettingsOpen = ref(false)
const canUndo = ref(false)
const openIssueIndex = ref<number | null>(null)
const toast = ref<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
const searchQuery = ref('')
const storeRef = shallowRef<VigiloStore | null>(null)

// Reactive state from store
const pos = computed(() => storeState.value.position)
const connections = computed(() => storeState.value.connections)
const displayMode = computed(() => storeState.value.displayMode)
const isHidden = computed(() => storeState.value.isHidden)
const showLines = computed(() => storeState.value.showLines)
const showBadges = computed(() => storeState.value.showBadges)
const lineColor = computed(() => storeState.value.lineColor)
const lineOpacity = computed(() => storeState.value.lineOpacity)
const componentOpacity = computed(() => storeState.value.componentOpacity)
const statuses = computed(() => storeState.value.statuses)

// Color options for settings
const colorOptions = computed(() => [
  { color: theme.value.colors.primary, label: 'Blue' },
  { color: theme.value.colors.freeroam, label: 'Purple' },
  { color: 'rgb(34, 197, 94)', label: 'Green' },
  { color: 'rgb(239, 68, 68)', label: 'Red' },
  { color: 'rgb(234, 179, 8)', label: 'Yellow' },
])

// Interaction state
const isDragging = ref(false)
const dragOffset = ref<Pos>({ x: 0, y: 0 })
const selectingIndex = ref<number | null>(null)
const hoveredTarget = ref<Element | null>(null)
const isFreeroam = ref(false)
const previewPosition = ref<Pos | null>(null)
const editingConnection = ref<number | null>(null)
const hoveredConnection = ref<number | null>(null)
const mousePos = ref<Pos | null>(null)
const tick = ref(0)

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)
const todoRefs = ref(new Map<number, HTMLDivElement>())
const connectionPointRefs = ref(new Map<number, SVGCircleElement>())
const rafRef = ref<number | null>(null)
const undoSnapshotRef = ref<UndoSnapshot | null>(null)
const undoTimeoutRef = ref<number | null>(null)

// Computed derived state
const connectionsByIndex = computed(() => {
  const map = new Map<number, Connection>()
  connections.forEach((conn) => {
    map.set(conn.todoIndex, conn)
  })
  return map
})

const maxItemsForMode = computed(() => (displayMode.value === 'compact' ? 1 : MAX_VISIBLE_ITEMS))
const filteredItems = computed(() => {
  if (!categoryData.value) return []
  if (!searchQuery.value.trim()) return categoryData.value.items
  const query = searchQuery.value.toLowerCase()
  return categoryData.value.items.filter(
    (item) =>
      item.text.toLowerCase().includes(query) ||
      item.action?.toLowerCase().includes(query) ||
      item.info?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(query))
  )
})
const itemsToRender = computed(() =>
  isExpanded.value ? filteredItems.value : filteredItems.value.slice(0, maxItemsForMode.value)
)
const hasMore = computed(() => filteredItems.value.length > maxItemsForMode.value)
const primaryItem = computed(() => categoryData.value?.items[0])
const shouldRenderLines = computed(() => showLines.value && !isHidden.value)

// Helper functions
function setTodoRef(index: number, el: HTMLDivElement | null) {
  if (el) {
    todoRefs.value.set(index, el)
  } else {
    todoRefs.value.delete(index)
  }
}

function setConnectionPointRef(index: number, el: SVGCircleElement | null) {
  if (el) {
    connectionPointRefs.value.set(index, el)
  } else {
    connectionPointRefs.value.delete(index)
  }
}

function hasConnection(index: number) {
  return connections.value.some((c) => c.todoIndex === index)
}

function getItemStatus(index: number): TodoStatus {
  return statuses.value.get(index) || 'todo'
}

function getNextStatus(current: TodoStatus): TodoStatus {
  return current === 'todo' ? 'working' : current === 'working' ? 'done' : 'todo'
}

// Connection rendering helpers
function connectionStart(conn: Connection): Pos | null {
  const el = todoRefs.value.get(conn.todoIndex)
  if (!el || !document.body.contains(el)) return null
  const rect = el.getBoundingClientRect()
  return { x: rect.right, y: rect.top + rect.height / 2 }
}

function connectionEnd(conn: Connection): Pos | null {
  if (conn.targetPosition) return conn.targetPosition
  if (conn.targetSelector) {
    const t = document.querySelector(conn.targetSelector)
    if (!t) return null
    const tRect = t.getBoundingClientRect()
    return { x: tRect.left, y: tRect.top + tRect.height / 2 }
  }
  return null
}

function connectionPath(conn: Connection): string | null {
  const start = connectionStart(conn)
  const end = connectionEnd(conn)
  if (!start || !end) return null
  return calculateBezier(start, end)
}

const freeroamPreviewPath = computed(() => {
  if (selectingIndex.value === null || !isFreeroam.value || !previewPosition.value) return ''
  const el = todoRefs.value.get(selectingIndex.value)
  if (!el || !document.body.contains(el)) return ''
  const rect = el.getBoundingClientRect()
  const start = { x: rect.right, y: rect.top + rect.height / 2 }
  return calculateBezier(start, previewPosition.value)
})

const selectionPreviewPath = computed(() => {
  if (selectingIndex.value === null || isFreeroam.value || !mousePos.value) return ''
  const el = todoRefs.value.get(selectingIndex.value)
  if (!el || !document.body.contains(el)) return ''
  const rect = el.getBoundingClientRect()
  const start = { x: rect.right, y: rect.top + rect.height / 2 }
  let end = mousePos.value
  if (hoveredTarget.value) {
    const tRect = hoveredTarget.value.getBoundingClientRect()
    end = { x: tRect.left, y: tRect.top + tRect.height / 2 }
  }
  return calculateBezier(start, end)
})

// Event handlers
function handleSvgMouseDown(e: MouseEvent) {
  if ((e.target as SVGElement).tagName !== 'circle') {
    e.preventDefault()
  }
}

function handleConnectionPointMouseDown(e: MouseEvent, todoIndex: number) {
  e.preventDefault()
  e.stopPropagation()
  setEditingConnection(todoIndex)
}

function startDrag(e: MouseEvent) {
  if (panelRef.value) {
    const rect = panelRef.value.getBoundingClientRect()
    dragOffset.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    isDragging.value = true
  }
}

function handleConnectionPointMouseDown(e: MouseEvent, todoIndex: number) {
  e.preventDefault()
  e.stopPropagation()
  editingConnection.value = todoIndex
}

function toggleViewMore() {
  isExpanded.value = !isExpanded.value
}

function removeConnection(idx: number) {
  const next = connections.value.filter((c) => c.todoIndex !== idx)
  storeRef.value?.setConnections(next)
  showToast('Connection removed', 'info')
}

function setItemStatus(index: number, status: TodoStatus) {
  storeRef.value?.setStatus(index, status)
  showToast(`Status set to ${status}`, 'success')
}

function setAndPersistMode(mode: DisplayMode) {
  storeRef.value?.setDisplayMode(mode)
  setIsSettingsOpen(false)
}

function handleSetMode(mode: DisplayMode) {
  setAndPersistMode(mode)
}

function handleToggleLines() {
  storeRef.value?.setShowLines(!showLines.value)
}

function handleToggleBadges() {
  storeRef.value?.setShowBadges(!showBadges.value)
}

function handleSetLineColor(color: string) {
  storeRef.value?.setLineColor(color)
}

function handleSetLineOpacity(opacity: number) {
  storeRef.value?.setLineOpacity(opacity)
}

function handleSetComponentOpacity(opacity: number) {
  storeRef.value?.setComponentOpacity(opacity)
}

function handleHide() {
  storeRef.value?.setHidden(true)
  setIsSettingsOpen(false)
}

function showToast(message: string, type: 'success' | 'info' | 'error' = 'info') {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

function exportConfig() {
  try {
    const config = {
      position: pos.value,
      displayMode: displayMode.value,
      connections: connections.value,
      statuses: Object.fromEntries(statuses.value),
      showLines: showLines.value,
      showBadges: showBadges.value,
      lineColor: lineColor.value,
      lineOpacity: lineOpacity.value,
      componentOpacity: componentOpacity.value,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vigilo-${instanceKey.value}-${new Date().toISOString().split('T')[0]}.json`
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
        const store = storeRef.value
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

// Lifecycle
let unsubscribe: (() => void) | null = null

onMounted(() => {
  const store = createVigiloStore(instanceKey.value, {
    storage: props.storage,
    overrides: { lineColor: primaryLineColor.value },
  })
  storeRef.value = store
  storeState.value = store.getState()
  isMounted.value = true

  unsubscribe = store.subscribe(() => {
    if (storeRef.value) {
      storeState.value = storeRef.value.getState()
    }
  })

  // Global keyboard handler
  const onKeyDown = (e: KeyboardEvent) => {
    // Only trigger if not typing in an input/textarea
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Check if event target is within this component instance
    if (containerRef.value && !containerRef.value.contains(target)) {
      return
    }

    // Don't trigger if modifier keys are pressed
    const hasModifier = e.metaKey || e.ctrlKey || e.altKey

    // Open settings with 's' key
    if ((e.key === 's' || e.key === 'S') && !hasModifier) {
      e.preventDefault()
      e.stopPropagation()
      setIsSettingsOpen(true)
      return
    }
  }

  document.addEventListener('keydown', onKeyDown)
  unsubscribe = () => {
    document.removeEventListener('keydown', onKeyDown)
  }
})

onBeforeUnmount(() => {
  unsubscribe?.()
  unsubscribe = null
  storeRef.value = null
  isMounted.value = false
})
</script>

