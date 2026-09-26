/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

/** 배포(vercel.json)와 같은 보안 헤더를 로컬 preview에도 붙여, E2E가 배포와 같은 조건에서 돌게 한다 */
function deployHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
    headers: { headers: { key: string; value: string }[] }[]
  }
  return Object.fromEntries(config.headers.flatMap((rule) => rule.headers.map((h) => [h.key, h.value])))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    headers: deployHeaders(),
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
