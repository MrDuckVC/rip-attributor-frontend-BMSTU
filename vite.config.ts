import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { createProxy } from './proxy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = createProxy(env)
  return {
    plugins: [react()],
    server: { host: true, port: 3000, strictPort: true, watch: { usePolling: true }, proxy },
    preview: { host: true, port: 3000, strictPort: true, proxy },
    test: {
      environment: 'jsdom', setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'], restoreMocks: true,
    },
  }
})
