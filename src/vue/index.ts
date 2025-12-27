export { useBtwfyiStore } from './use-btwfyi-store'
export type { UseBtwfyiStoreOptions, UseBtwfyiStoreReturn } from './use-btwfyi-store'
// Note: To use the Btwfyi component, import it directly:
// import Btwfyi from 'btwfyi/vue/Btwfyi.vue'
// Your bundler (Vite, webpack with vue-loader, etc.) will handle the .vue file
export type { BtwfyiProps, CategoryConfig } from './types'
export { generateSelector, getElementLabel, isValidSelector } from './dom'
export {
  theme,
  styles,
  MAX_VISIBLE_ITEMS,
  UNDO_WINDOW_MS,
  baseTheme,
  baseStyles,
} from './constants'
