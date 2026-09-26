import { launchBrowser } from './browser.mjs'
const [,, url, shots] = process.argv
const browser = await launchBrowser()
const ctx = await browser.newContext({ viewport: { width: 1200, height: 1100 } })
const page = await ctx.newPage()
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
let dialogs = []; page.on('dialog', async (d) => { dialogs.push(d.message()); await d.accept() })
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)
const hash = () => page.$eval('.card-preview canvas', (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 41) h = (h * 31 + d[i]) >>> 0; return h })
const ready = async () => { await page.waitForFunction(() => document.fonts.check('24px "dear2004-galmuri11"')); await page.waitForSelector('text=아직 저장한 템플릿이 없어요., .template-item', { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(300) }
const items = () => page.locator('.template-item')

await page.goto(url); await ready()
// 디자인 만들기: 사진 + 4:5 + 효과 + 문구 + 스티커 + 댓글
const png = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 800; c.height = 600; const x = c.getContext('2d')
  x.fillStyle = '#4a8fd6'; x.fillRect(0, 0, 800, 600); x.fillStyle = '#d0213a'; x.fillRect(100, 300, 250, 250)
  const b = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer()); let s = ''; for (const v of b) s += String.fromCharCode(v); return btoa(s)
})
await page.locator('input[type=file][accept="image/png,image/jpeg"]').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
await page.waitForSelector('figure img')
await page.locator('label.choice', { hasText: '4:5' }).first().click()
await page.locator('label.choice', { hasText: '흑백' }).first().click()
await page.getByLabel('찍을 날짜').fill('2004.10.27')
await page.getByRole('tab', { name: '문구' }).click()
await page.getByLabel('감성 문구').fill('템플릿 테스트 ˚ ｡ 😀')
await page.getByLabel('닉네임 / 서명').fill('★나야나★')
await page.getByRole('button', { name: '+ 댓글 달기' }).click(); await page.getByLabel('댓글 1 닉네임').fill('단짝')
await page.getByRole('tab', { name: '꾸미기' }).click()
await page.getByRole('button', { name: '체리 붙이기' }).click()
await page.getByRole('tab', { name: '템플릿' }).click()
await page.waitForTimeout(400)
const designHash = await hash()

await page.getByRole('button', { name: '저장', exact: true }).click()
check('이름 없이 저장 → 안내', (await page.getByText('템플릿 이름을 1~30자로').count()) === 1)
await page.getByLabel('템플릿 이름').fill('  여름   방학  ')
await page.getByRole('button', { name: '저장', exact: true }).click()
await page.waitForSelector('.template-item')
check('TC-19 템플릿 생성', (await items().count()) === 1 && (await page.locator('.template-name').first().textContent()) === '여름 방학')

// 새로고침 → 유지 + 불러오기로 같은 결과
await page.reload(); await ready(); await page.getByRole('tab', { name: '템플릿' }).click()
check('TC-20 새로고침 후 템플릿 유지', (await items().count()) === 1, await items().count())
const freshHash = await hash()
await page.getByRole('button', { name: '불러오기', exact: true }).click()
await page.waitForTimeout(600)
check('불러오기 전 확인 창', dialogs.some((m) => m.includes('불러올까요')))
check('TC-20 불러오면 저장 당시와 같은 카드 (사진·문구·스티커·효과)', (await hash()) === designHash && freshHash !== designHash, [await hash(), designHash, freshHash])
await page.getByRole('tab', { name: '문구' }).click()
check('불러온 상태가 입력칸에도 반영', (await page.getByLabel('감성 문구').inputValue()) === '템플릿 테스트 ˚ ｡ 😀' && (await page.getByLabel('댓글 1 닉네임').inputValue()) === '단짝')

// 수정: 덮어쓰기 + 이름 바꾸기
await page.getByRole('tab', { name: '사진' }).click()
await page.locator('label.choice', { hasText: '9:16' }).first().click()
await page.getByRole('tab', { name: '템플릿' }).click()
await page.getByRole('button', { name: '덮어쓰기' }).click(); await page.waitForTimeout(300)
await page.getByRole('button', { name: '이름 바꾸기' }).click()
await page.getByLabel("'여름 방학' 새 이름").fill('겨울방학')
await page.getByRole('button', { name: '확인' }).click(); await page.waitForTimeout(300)
await page.reload(); await ready(); await page.getByRole('tab', { name: '템플릿' }).click()
const meta = await page.locator('.template-meta').first().textContent()
check('TC-21 덮어쓰기·이름 바꾸기가 새로고침 후에도 유지', (await page.locator('.template-name').first().textContent()) === '겨울방학' && meta.startsWith('9:16'), meta)

// 두 번째 템플릿 + 정렬
await page.getByLabel('템플릿 이름').fill('두번째'); await page.getByRole('button', { name: '저장', exact: true }).click(); await page.waitForTimeout(300)
check('최근 저장이 위로', (await page.locator('.template-name').first().textContent()) === '두번째')

// 삭제
await page.locator('.template-item', { hasText: '겨울방학' }).getByRole('button', { name: '삭제' }).click(); await page.waitForTimeout(300)
await page.reload(); await ready(); await page.getByRole('tab', { name: '템플릿' }).click()
check('TC-22 삭제 후 새로고침해도 다시 나타나지 않음', (await items().count()) === 1 && (await page.locator('.template-name').first().textContent()) === '두번째')

// 손상된 기록을 IndexedDB에 직접 넣기 → 건너뛰고 앱은 정상
await page.evaluate(() => new Promise((resolve, reject) => {
  const r = indexedDB.open('dear2004', 1)
  r.onsuccess = () => { const tx = r.result.transaction('templates', 'readwrite'); tx.objectStore('templates').put({ id: 'bad', name: 'x', createdAt: 1, updatedAt: 1, state: { schemaVersion: 1, aspectRatio: '16:9' } }); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) }
}))
await page.reload(); await ready(); await page.getByRole('tab', { name: '템플릿' }).click()
check('손상된 템플릿은 건너뛰고 안내', (await page.getByText('손상된 템플릿 1개').count()) === 1 && (await items().count()) === 1)
await page.screenshot({ path: `${shots}/16-templates.png`, fullPage: false })
check('콘솔/페이지 에러 없음', errors.length === 0, errors)
console.log(results.join('\n'))
await browser.close()
