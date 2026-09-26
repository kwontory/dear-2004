import { launchBrowser } from './browser.mjs'
const browser = await launchBrowser()
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
await page.goto(process.argv[2])

// 브라우저 canvas로 테스트용 이미지 만들기
const makeImage = (w, h, type, transparent = false) => page.evaluate(async ([w, h, type, transparent]) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d')
  if (!transparent) { ctx.fillStyle = '#7fb0e0'; ctx.fillRect(0, 0, w, h) }
  ctx.fillStyle = 'rgba(255,100,150,0.6)'; ctx.fillRect(0, 0, Math.ceil(w / 2), Math.ceil(h / 2))
  const blob = await new Promise((r) => c.toBlob(r, type, 0.9))
  const buf = new Uint8Array(await blob.arrayBuffer())
  let s = ''; for (const b of buf) s += String.fromCharCode(b)
  return btoa(s)
}, [w, h, type, transparent]).then((b64) => Buffer.from(b64, 'base64'))

const input = page.locator('input[type=file][accept="image/png,image/jpeg"]')
const upload = async (name, mimeType, buffer) => {
  await input.setInputFiles({ name, mimeType, buffer })
  await page.waitForFunction(() => !document.querySelector('input[type=file][accept="image/png,image/jpeg"]').disabled)
  await page.waitForTimeout(50)
}
const caption = () => page.locator('figcaption').textContent().catch(() => null)
const alertText = () => page.locator('[role=alert]').textContent({ timeout: 500 }).catch(() => null)

const pngHeaderOnly = (w, h) => {
  const b = Buffer.alloc(40); Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(b, 0)
  b.writeUInt32BE(13, 8); b.write('IHDR', 12, 'latin1'); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return b
}

const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + detail}`)

await upload('photo.png', 'image/png', await makeImage(800, 600, 'image/png'))
check('TC-01 정상 PNG', (await caption())?.includes('800 × 600'), await caption())

await upload('big.jpg', 'image/jpeg', await makeImage(3000, 2000, 'image/jpeg'))
check('TC-02 정상 JPEG (2048로 축소)', (await caption())?.includes('2048 × 1365'), await caption())

await upload('doc.pdf', 'application/pdf', Buffer.from('%PDF-1.7 fake'))
let a = await alertText()
check('TC-03 PDF 거부 + 기존 사진 유지', a?.includes('PDF 파일은') && (await caption())?.includes('2048 × 1365'), `${a} / ${await caption()}`)

await upload('anim.gif', 'image/gif', Buffer.from('GIF89a......'))
check('TC-04 GIF 거부', (await alertText())?.includes('GIF 파일은'), await alertText())

await upload('evil.svg', 'image/svg+xml', Buffer.from('<svg onload="alert(1)"></svg>'))
check('SVG 거부', (await alertText())?.includes('SVG 파일은'), await alertText())

await upload('fake.jpg', 'image/jpeg', Buffer.from('<html><script>alert(1)</script></html>'))
check('TC-05 가짜 확장자 거부', (await alertText())?.includes('사진 파일이 아닌'), await alertText())

await upload('huge.png', 'image/png', pngHeaderOnly(20000, 20000))
check('TC-06 초대형 해상도 디코딩 전 거부', (await alertText())?.includes('해상도가 너무 커요'), await alertText())

await upload('broken.png', 'image/png', pngHeaderOnly(100, 100))
check('깨진 PNG(디코드 실패) 거부', (await alertText())?.includes('읽을 수 없어요'), await alertText())

await upload('tiny.png', 'image/png', await makeImage(1, 1, 'image/png'))
check('TC-07 1x1 PNG 허용 + 에러 사라짐', (await caption())?.includes('1 × 1') && (await alertText()) === null, `${await caption()} / ${await alertText()}`)

await upload('wide.png', 'image/png', await makeImage(4000, 10, 'image/png'))
check('TC-08 초가로형 축소', (await caption())?.includes('2048 × 5'), await caption())

await upload('tall.jpg', 'image/jpeg', await makeImage(10, 4000, 'image/jpeg'))
check('TC-09 초세로형 축소', (await caption())?.includes('5 × 2048'), await caption())

await upload('clear.png', 'image/png', await makeImage(300, 300, 'image/png', true))
const src = await page.locator('figure img').getAttribute('src')
check('TC-10 투명 PNG는 PNG로 유지', src?.startsWith('data:image/png;base64,'), src?.slice(0, 30))

check('콘솔/페이지 에러 없음', errors.length === 0, errors.join(' | '))
console.log(results.join('\n'))
await browser.close()
