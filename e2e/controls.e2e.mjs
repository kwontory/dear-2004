import { launchBrowser } from './browser.mjs'
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(process.argv[2])
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)
const canvasSize = () => page.$eval('.card-preview canvas', (c) => [c.width, c.height])
const hash = () => page.$eval('.card-preview canvas', (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) >>> 0; return h })
const pick = (text) => page.locator('label.choice', { hasText: text }).first().click()
const slider = (label) => page.getByLabel(label, { exact: true })

check('사진 없을 때 슬라이더·초기화 비활성', await slider('확대').isDisabled() && await page.getByRole('button', { name: '초기화' }).isDisabled())

// 사진 업로드
const png = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 800; c.height = 600
  const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 600)
  g.addColorStop(0, '#4a8fd6'); g.addColorStop(1, '#f0c9a8'); x.fillStyle = g; x.fillRect(0, 0, 800, 600)
  x.fillStyle = '#d0213a'; x.fillRect(80, 320, 200, 200); x.fillStyle = '#fff'; x.beginPath(); x.arc(400, 200, 90, 0, 7); x.fill()
  const b = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer()); let s = ''; for (const v of b) s += String.fromCharCode(v); return btoa(s)
})
await page.locator('input[type=file][accept="image/png,image/jpeg"]').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
await page.waitForSelector('figure img'); await page.waitForTimeout(200)
check('업로드 후 슬라이더 활성', await slider('확대').isEnabled())

// 화면비
for (const [r, size] of [['4:5', [1080, 1350]], ['9:16', [1080, 1920]], ['1:1', [1080, 1080]]]) {
  await pick(r)
  check(`화면비 ${r} → ${size}`, JSON.stringify(await canvasSize()) === JSON.stringify(size), await canvasSize())
}
const before = await hash()
for (let i = 0; i < 5; i++) for (const r of ['4:5', '9:16', '1:1']) await pick(r)
check('TC-18 화면비 15회 반복 후 1:1 결과 동일', (await hash()) === before)

// 키보드로 슬라이더 조작
await slider('확대').focus()
for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowRight')
check('키보드로 확대 130%', (await slider('확대').inputValue()) === '130', await slider('확대').inputValue())
await slider('회전').focus(); await page.keyboard.press('End')
check('회전 End → 180', (await slider('회전').inputValue()) === '180')
await slider('좌우').fill('-100')
check('좌우 -100', (await slider('좌우').inputValue()) === '-100')
check('조절 후 미리보기 변경', (await hash()) !== before)
await page.screenshot({ path: `${process.argv[3]}/05-adjusted.png` })
await page.getByRole('button', { name: '초기화' }).click()
check('초기화 → 원래 결과', (await hash()) === before && (await slider('확대').inputValue()) === '100')

// 효과
check('라디오 선택 상태 반영', await page.getByLabel(/^1:1/).isChecked())
const hashes = new Set()
for (const e of ['원본', '뽀샤시', '빛바램', '흑백']) { await pick(e); hashes.add(await hash()) }
check('효과 4종이 서로 다른 결과', hashes.size === 4, [...hashes])

// 스탬프
const noStamp = await hash()
const dateInput = page.getByLabel('찍을 날짜')
await dateInput.fill('2004.7.21')
check('날짜 안내 문구', (await page.getByText("사진에 '04 7 21' 로 찍혀요.").count()) === 1)
check('스탬프가 그려짐', (await hash()) !== noStamp)
await page.getByLabel('디카 날짜 찍기').uncheck()
check('스탬프 끄면 원래대로', (await hash()) === noStamp)
await page.getByLabel('디카 날짜 찍기').check()
await dateInput.fill('<script>alert(1)</script>')
check('이상한 날짜 → 안내 + 스탬프 없음', (await page.getByText('날짜 형식을 알아볼 수 없어요').count()) === 1 && (await hash()) === noStamp)
await dateInput.fill('2004.10.27')
await pick('뽀샤시')
await page.screenshot({ path: `${process.argv[3]}/06-controls.png` })

check('콘솔/페이지 에러 없음', errors.length === 0, errors)
console.log(results.join('\n'))
await browser.close()
