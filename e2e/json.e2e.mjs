import { launchBrowser } from './browser.mjs'
import fs from 'node:fs'
const [,, url, shots] = process.argv
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, acceptDownloads: true })
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('dialog', (d) => d.accept())
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)
const hash = () => page.$eval('.card-preview canvas', (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 41) h = (h * 31 + d[i]) >>> 0; return h })
await page.goto(url); await page.waitForFunction(() => document.fonts.check('24px "dear2004-galmuri11"'))
const png = await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 600; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#7ab'; x.fillRect(0, 0, 600, 400); x.fillStyle = '#e46'; x.fillRect(50, 50, 200, 200); const b = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer()); let s = ''; for (const v of b) s += String.fromCharCode(v); return btoa(s) })
await page.locator('input[type=file][accept="image/png,image/jpeg"]').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
await page.waitForSelector('figure img')
await page.locator('label.choice', { hasText: '9:16' }).first().click()
await page.getByRole('tab', { name: '문구' }).click()
await page.getByLabel('감성 문구').fill('JSON 왕복 😀 <script>alert(1)</script>')
await page.getByRole('tab', { name: '꾸미기' }).click()
await page.getByRole('button', { name: '장미 붙이기' }).click()
await page.getByRole('tab', { name: '템플릿' }).click()
await page.waitForTimeout(400)
const designHash = await hash()
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON 내보내기' }).click()])
const file = `${shots}/state.json`; await dl.saveAs(file)
const json = JSON.parse(fs.readFileSync(file, 'utf8'))
check('TC-23 JSON 내보내기 (schemaVersion, 사진, 스티커 포함)', json.schemaVersion === 1 && json.photo.source?.dataUrl?.startsWith('data:image/png') && json.stickers.length === 1 && /^dear2004-\d{8}-\d{6}\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename())

// 상태 바꾸기
await page.getByRole('tab', { name: '사진' }).click(); await page.locator('label.choice', { hasText: '1:1' }).first().click(); await page.getByRole('tab', { name: '문구' }).click(); await page.getByLabel('감성 문구').fill('바뀜'); await page.getByRole('tab', { name: '템플릿' }).click(); await page.waitForTimeout(300)
const jsonInput = page.locator('input[type=file][accept=".json,application/json"]')
await jsonInput.setInputFiles(file); await page.waitForTimeout(700)
await page.getByRole('tab', { name: '문구' }).click()
check('TC-24 불러오면 원래 카드와 같음', (await hash()) === designHash && (await page.getByLabel('감성 문구').inputValue()) === 'JSON 왕복 😀 <script>alert(1)</script>')

const before = await hash()
const tryBad = async (name, content, expectText) => {
  await jsonInput.setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(content) }); await page.waitForTimeout(300)
  const alert = await page.locator('[role=alert]').last().textContent().catch(() => '')
  return { alert, kept: (await hash()) === before, match: alert.includes(expectText) }
}
let r = await tryBad('broken.json', '{"schemaVersion": 1, "aspectRatio":', '불러올 수 없어요'); check('TC-25 문법 오류 JSON 거부 + 상태 유지', r.match && r.kept, r)
r = await tryBad('other.json', '{"name":"playlist","songs":[1,2,3]}', 'schemaVersion'); check('TC-26 다른 형식 JSON 거부 + 상태 유지', r.match && r.kept, r)
r = await tryBad('v2.json', JSON.stringify({ ...json, schemaVersion: 2 }), '지원하지 않는 버전'); check('TC-27 미지원 버전 거부 + 상태 유지', r.match && r.kept, r)
r = await tryBad('ratio.json', JSON.stringify({ ...json, aspectRatio: '16:9' }), 'aspectRatio'); check('허용되지 않은 화면비 거부', r.match && r.kept, r)
r = await tryBad('nan.json', JSON.stringify(json).replace(/"scale":[\d.]+/, '"scale":1e999'), 'scale'); check('Infinity 숫자 거부', r.match && r.kept, r)
r = await tryBad('svg.json', JSON.stringify({ ...json, photo: { ...json.photo, source: { ...json.photo.source, dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' } } }), 'dataUrl'); check('SVG 사진 데이터 거부', r.match && r.kept, r)
check('콘솔/페이지 에러 없음', errors.length === 0, errors)
console.log(results.join('\n'))
await browser.close()
