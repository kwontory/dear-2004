import { launchBrowser } from './browser.mjs'
import fs from 'node:fs'
const [,, url, shots] = process.argv
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })
const errors = []; page.on('pageerror', (e) => errors.push(e.message))
const fontReqs = []; page.on('request', (r) => { if (r.url().includes('/fonts/')) fontReqs.push(r.url().split('/').pop()) })
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)
await page.goto(url); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500)
const first = [...new Set(fontReqs)].sort()
check('첫 화면: core 조각만 받음 (rare 없음)', first.every((f) => f.includes('.core.')) && first.length >= 2 && first.length <= 3, first)
const bytes = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.includes('/fonts/')).reduce((a, e) => a + (e.encodedBodySize || e.transferSize || 0), 0))
check('첫 화면 폰트 전송량 < 250KB', bytes > 0 && bytes < 250 * 1024, bytes)
await page.getByRole('tab', { name: '문구' }).click()
await page.getByLabel('감성 문구').fill('똠방각하 햏햏 궯 뷁')  // KS X 1001에 없는 음절
await page.waitForTimeout(1200)
const after = [...new Set(fontReqs)]
check('드문 한글 입력 → rare 조각을 받음', after.some((f) => f.includes('Galmuri11.rare')), after)
const ok = await page.evaluate(() => document.fonts.check('24px "dear2004-galmuri11"', '똠햏궯뷁'))
check('드문 한글도 픽셀 폰트로 준비됨', ok)
// 저장 이미지 == 미리보기 (드문 한글 포함)
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'PNG로 저장하기' }).click()])
const file = `${shots}/export-rare.png`; await dl.saveAs(file)
const d = await page.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const a = x.getImageData(0, 0, c.width, c.height).data; const p = document.querySelector('.card-preview canvas'); const b = p.getContext('2d').getImageData(0, 0, p.width, p.height).data
  let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n
}, fs.readFileSync(file).toString('base64'))
check('드문 한글이 들어간 PNG == 미리보기', d === 0, d)
await page.locator('.card-preview canvas').screenshot({ path: `${shots}/20-rare-hangul.png` })
check('에러 없음', errors.length === 0, errors)
console.log(results.join('\n'))
await browser.close()
