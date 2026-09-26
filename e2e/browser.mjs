import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium, webkit } from 'playwright-core'

/**
 * 테스트용 브라우저를 띄운다. 기본은 Chromium.
 * 1) E2E_CHROMIUM 환경 변수 경로
 * 2) playwright-core 버전에 맞게 설치된 브라우저 (npx playwright-core install chromium-headless-shell)
 * 3) ~/.cache/ms-playwright 에 있는 가장 최근 headless shell
 */
export async function launchBrowser() {
  // iPhone Safari와 같은 엔진으로 돌리기: E2E_BROWSER=webkit (시스템 라이브러리 필요: npx playwright-core install-deps webkit)
  if (process.env.E2E_BROWSER === 'webkit') return webkit.launch()
  if (process.env.E2E_CHROMIUM) return chromium.launch({ executablePath: process.env.E2E_CHROMIUM })
  try {
    return await chromium.launch()
  } catch (error) {
    const cache = path.join(os.homedir(), '.cache', 'ms-playwright')
    const shells = fs.existsSync(cache)
      ? fs.readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse()
      : []
    for (const dir of shells) {
      const exe = path.join(cache, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell')
      if (fs.existsSync(exe)) return chromium.launch({ executablePath: exe })
    }
    throw new Error(
      `테스트용 Chromium을 찾지 못했어요. 'npx playwright-core install chromium-headless-shell'로 설치하거나 E2E_CHROMIUM을 지정하세요.\n${error}`,
    )
  }
}
