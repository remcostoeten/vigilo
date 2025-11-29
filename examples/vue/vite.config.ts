import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vigilo/vue': path.resolve(__dirname, '../../packages/vue/src'),
      '@vigilo/core': path.resolve(__dirname, '../../packages/core/src'),
    },
  },
})


