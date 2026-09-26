import { launchBrowser } from './browser.mjs'
const browser = await launchBrowser()
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(process.argv[2])
await page.getByRole('tab', { name: '사진' }).focus()
await page.keyboard.press('ArrowDown')
check('↓ 키 → 문구 탭 선택', (await page.getByRole('tab', { name: '문구' }).getAttribute('aria-selected')) === 'true' && await page.getByLabel('감성 문구').isVisible())
await page.keyboard.press('End')
check('End → 템플릿 탭', (await page.getByRole('tab', { name: '템플릿' }).getAttribute('aria-selected')) === 'true')
await page.keyboard.press('ArrowDown')
check('마지막에서 ↓ → 처음(사진)으로', (await page.getByRole('tab', { name: '사진' }).getAttribute('aria-selected')) === 'true')
check('선택된 탭만 Tab 순서에 들어감', (await page.locator('[role=tab][tabindex="0"]').count()) === 1)
for (const w of [320, 768, 1024]) {
  const p = await browser.newPage({ viewport: { width: w, height: 800 }, isMobile: w < 800, hasTouch: w < 800 })
  await p.goto(process.argv[2]); await p.waitForTimeout(300)
  let worst = 0
  for (const t of ['사진', '문구', '꾸미기', '템플릿']) {
    await p.getByRole('tab', { name: t }).click(); await p.waitForTimeout(100)
    worst = Math.max(worst, await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
  }
  check(`${w}px 모든 탭에서 가로 넘침 없음`, worst <= 0, worst)
  await p.close()
}
console.log(results.join('\n'))
await browser.close()
