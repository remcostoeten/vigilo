import {
  onBeforeUnmount,
  onMounted,
  shallowReactive,
  shallowRef,
  type ShallowRef,
} from 'vue'
import { createStorageKeys } from '../core/storage'
import { createDefaultState } from '../core/state'
import { createBtwfyiStore, type BtwfyiStore } from '../core/store'
import type { BtwfyiConfig, BtwfyiState } from '../core/types'

export type UseBtwfyiStoreOptions<CategoryId extends string = string> = BtwfyiConfig<CategoryId> & {
  overrides?: Partial<BtwfyiState>
}

export type UseBtwfyiStoreReturn = {
  state: BtwfyiState
  store: ShallowRef<BtwfyiStore | null>
}

/**
 * Minimal Vue bridge around the Btwfyi store so Vue apps can reuse the core logic.
 */
export function useBtwfyiStore<CategoryId extends string = string>({
  category,
  instanceId,
  overrides,
}: UseBtwfyiStoreOptions<CategoryId>): UseBtwfyiStoreReturn {
  const keys = createStorageKeys(instanceId || category)
  const state = shallowReactive(createDefaultState(overrides))
  const storeRef = shallowRef<BtwfyiStore | null>(null)
  let unsubscribe: (() => void) | null = null

  function assignState(next: BtwfyiState) {
    Object.assign(state, next)
  }

  onMounted(() => {
    const store = createBtwfyiStore(keys, overrides)
    storeRef.value = store
    assignState(store.getState())
    unsubscribe = store.subscribe(() => {
      assignState(store.getState())
    })
  })

  onBeforeUnmount(() => {
    unsubscribe?.()
    unsubscribe = null
    storeRef.value = null
  })

  return {
    state,
    store: storeRef,
  }
}
