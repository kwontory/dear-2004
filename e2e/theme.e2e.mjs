import { launchBrowser } from './browser.mjs'
import fs from 'node:fs'
const [,, url, shots] = process.argv
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)
const hash = () => page.$eval('.card-preview canvas', (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 37) h = (h * 31 + d[i]) >>> 0; return h })
const pixel = (fx, fy) => page.$eval('.card-preview canvas', (c, [fx, fy]) => [...c.getContext('2d').getImageData(Math.round(c.width * fx), Math.round(c.height * fy), 1, 1).data], [fx, fy])
await page.goto(url); await page.waitForFunction(() => document.fonts.check('24px "dear2004-galmuri11"')); await page.waitForTimeout(300)
await page.getByRole('tab', { name: '꾸미기' }).click()

// 기본 = 감성 사진(폴라로이드) + 파스텔: 모서리는 스킨, 가운데 위쪽은 폴라로이드 흰 테두리
const corner = await pixel(0.01, 0.01)
const polaroidEdge = await pixel(0.5, 0.06)
check('기본 틀은 폴라로이드: 카드 모서리에 스킨이 보임', !(corner[0] > 250 && corner[1] > 250 && corner[2] > 250), corner)
check('폴라로이드 흰 테두리', polaroidEdge.slice(0, 3).every((v) => v >= 250), polaroidEdge)

const frameHashes = new Set()
for (const f of ['감성 사진', '미니홈피', '사진첩', '다이어리']) { await page.locator('label.choice', { hasText: f }).click(); await page.waitForTimeout(150); frameHashes.add(await hash()) }
check('틀 4종이 서로 다른 카드', frameHashes.size === 4, frameHashes.size)
await page.locator('label.choice', { hasText: '감성 사진' }).click()

const skinHashes = new Set()
for (const s of ['하늘 도트', '핑크 체크', '크림 줄노트', '파스텔', '단색']) { await page.locator('label.choice', { hasText: s }).click(); await page.waitForTimeout(150); skinHashes.add(await hash()) }
check('스킨 5종이 서로 다른 카드', skinHashes.size === 5, skinHashes.size)

check('단색 선택 → 색 팔레트 표시', await page.getByLabel('배경색').isVisible())
await page.getByRole('button', { name: '밤하늘 #2b2f3a' }).click(); await page.waitForTimeout(150)
check('빠른 색 선택 → 카드 배경이 그 색', JSON.stringify((await pixel(0.01, 0.01)).slice(0, 3)) === JSON.stringify([43, 47, 58]), await pixel(0.01, 0.01))
check('선택한 색 표시', (await page.getByRole('button', { name: '밤하늘 #2b2f3a' }).getAttribute('aria-pressed')) === 'true')
await page.getByLabel('배경색').fill('#88cc44'); await page.waitForTimeout(150)
check('색 팔레트로 직접 고른 색 반영', JSON.stringify((await pixel(0.01, 0.01)).slice(0, 3)) === JSON.stringify([136, 204, 68]), await pixel(0.01, 0.01))

// 저장 == 미리보기, JSON에 색 포함
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'PNG로 저장하기' }).click()])
const file = `${shots}/export-solid.png`; await dl.saveAs(file)
const diff = await page.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const a = x.getImageData(0, 0, c.width, c.height).data; const p = document.querySelector('.card-preview canvas'); const b = p.getContext('2d').getImageData(0, 0, p.width, p.height).data
  let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n
}, fs.readFileSync(file).toString('base64'))
check('단색 + 폴라로이드 PNG == 미리보기', diff === 0, diff)
await page.getByRole('tab', { name: '템플릿' }).click()
const [jd] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON 내보내기' }).click()])
const jf = `${shots}/solid.json`; await jd.saveAs(jf)
const theme = JSON.parse(fs.readFileSync(jf, 'utf8')).theme
check('JSON에 단색 스킨과 색이 저장됨', theme.background === 'solid' && theme.solidColor === '#88cc44', theme)
await page.locator('.card-preview canvas').screenshot({ path: `${shots}/23-solid-polaroid.png` })
check('콘솔/페이지 에러 없음', errors.length === 0, errors)
console.log(results.join('\n'))
await browser.close()
