import { launchBrowser } from './browser.mjs'
const [,, url, shots] = process.argv
const browser = await launchBrowser()
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)
const hashOf = (page) => page.$eval('.card-preview canvas', (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 53) h = (h * 31 + d[i]) >>> 0; return h })
const settle = (page) => page.waitForTimeout(150)

// ── 데스크톱: 문구 입력과 극단 입력 ──
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } })
  const errors = []; let dialogs = 0
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('dialog', async (d) => { dialogs++; await d.dismiss() })
  await page.goto(url); await page.waitForFunction(() => document.fonts.check('24px "dear2004-galmuri11"')); await settle(page)
  await page.getByRole('tab', { name: '문구' }).click()
  const body = page.getByLabel('감성 문구'); const sig = page.getByLabel('닉네임 / 서명')
  const empty = await hashOf(page)
  check('TC-11 빈 문구 → 크래시 없음', true)
  await body.fill('˚ ｡ · 오늘 하루도... *\n아무렇지 않은 척 웃었ㄷㅏ...\n그래도 괜찮ㅇㅏ. ･ﾟ\n내 곁엔 음악이 있으니까...♬'); await sig.fill('★나야나★'); await settle(page)
  check('문구·서명이 카드에 그려짐', (await hashOf(page)) !== empty)
  await page.screenshot({ path: `${shots}/10-text.png` })
  await page.locator('.card-preview canvas').screenshot({ path: `${shots}/11-card-text.png` })

  // 특수문자: 커서 위치에 삽입
  await body.fill('가나다'); await body.focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight')
  await page.getByRole('button', { name: '♡ 넣기' }).click(); await settle(page)
  check('특수문자 커서 위치 삽입', (await body.inputValue()) === '가♡나다', await body.inputValue())

  await body.fill('가'.repeat(1200)); await settle(page)
  check('TC-12 1000자 제한 + 크래시 없음', (await body.inputValue()).length === 1000, (await body.inputValue()).length)
  await page.locator('.card-preview canvas').screenshot({ path: `${shots}/12-long.png` })
  await body.fill('줄\n'.repeat(400)); await settle(page)
  check('TC-13 줄바꿈 400개 크래시 없음', errors.length === 0, errors)
  await body.fill('😀😭⭐️💖✨🎵'.repeat(20)); await settle(page)
  check('TC-14 이모지 크래시 없음', errors.length === 0, errors)
  const xss = `< > & " ' / \\ { } [ ] <script>alert(1)</script><img src=x onerror=alert(2)>`
  await body.fill(xss); await page.getByLabel('제목').fill(xss); await settle(page)
  check('TC-15 특수문자 그대로 보존', (await body.inputValue()) === xss)
  check('TC-15 스크립트 실행 없음', dialogs === 0 && (await page.locator('img[src="x"]').count()) === 0)
  await body.fill('안녕 hello 123 😀 반가워~ 오늘은 2004년 10월 27일 ^^'); await settle(page)
  check('TC-16 혼합 문자열 크래시 없음', errors.length === 0, errors)

  // 댓글
  await page.getByRole('button', { name: '+ 댓글 달기' }).click()
  await page.getByLabel('댓글 1 닉네임').fill('단짝♡'); await page.getByLabel('댓글 1 내용').fill('퍼가요~♡')
  for (let i = 0; i < 6; i++) if (await page.getByRole('button', { name: '+ 댓글 달기' }).isEnabled()) await page.getByRole('button', { name: '+ 댓글 달기' }).click()
  check('댓글 최대 5개에서 버튼 비활성', (await page.getByRole('button', { name: '+ 댓글 달기' }).isDisabled()) && (await page.locator('.comment-row').count()) === 5)
  await page.getByRole('button', { name: '댓글 1 지우기' }).click()
  check('댓글 삭제', (await page.locator('.comment-row').count()) === 4)
  check('TODAY 음수 → 0으로 보정', await (async () => { const t = page.getByLabel('TODAY', { exact: true }); await t.fill('-5'); await settle(page); return (await t.inputValue()) === '0' })())
  check('데스크톱 콘솔 에러 없음', errors.length === 0, errors)
  await page.close()
}

// ── 모바일: 기본 / 사용자 글꼴·큰 글자 강제 ──
const mobile = { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
const overflowReport = (page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth
  const bad = []
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0) continue
    if (r.right > vw + 1 || r.left < -1) bad.push(`${el.tagName}.${el.className}:${Math.round(r.left)}-${Math.round(r.right)}`)
  }
  return { pageScroll: document.documentElement.scrollWidth - vw, outside: bad.slice(0, 8), outsideCount: bad.length }
})
let cardHashNormal
for (const variant of ['normal', 'custom-font']) {
  const page = await browser.newPage(mobile)
  const errors = []; page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(url); await page.waitForFunction(() => document.fonts.check('24px "dear2004-galmuri11"'))
  if (variant === 'custom-font') {
    // 사용자 지정 글꼴 + 큰 글자: 모든 요소를 폭 넓은 serif로, 글자가 들어 있는 요소는 20px로 강제
    await page.addStyleTag({ content: `* { font-family: "DejaVu Serif", "Noto Serif CJK KR", serif !important; letter-spacing: 0.05em !important; } body *:not(:has(*)) { font-size: 20px !important; }` })
  }
  await page.getByRole('tab', { name: '문구' }).click()
  await page.getByLabel('감성 문구').fill('오늘 하루도...\n아무렇지 않은 척 웃었ㄷㅏ... 아주아주아주길어서줄이넘치는문장입니다아아아아아아아아아'); await page.getByLabel('닉네임 / 서명').fill('★나야나★')
  await page.getByRole('button', { name: '+ 댓글 달기' }).click(); await page.getByLabel('댓글 1 닉네임').fill('아주긴닉네임입니다요'); await page.getByLabel('댓글 1 내용').fill('퍼가요~♡ 퍼가요~♡ 퍼가요~♡')
  await settle(page)
  const rep = await overflowReport(page)
  check(`모바일(${variant}) 가로 스크롤 없음`, rep.pageScroll <= 0, rep)
  check(`모바일(${variant}) 화면 밖으로 나간 요소 없음`, rep.outsideCount === 0, rep.outside)
  const inputFont = await page.getByLabel('감성 문구').evaluate((el) => getComputedStyle(el).fontSize)
  if (variant === 'normal') check('모바일 입력칸 16px 이상 (iOS 확대 방지)', parseFloat(inputFont) >= 16, inputFont)
  const h = await hashOf(page)
  if (variant === 'normal') cardHashNormal = h
  else check('사용자 글꼴을 강제해도 카드 이미지는 동일', h === cardHashNormal, [h, cardHashNormal])
  await page.screenshot({ path: `${shots}/13-mobile-${variant}.png`, fullPage: true })
  check(`모바일(${variant}) 에러 없음`, errors.length === 0, errors)
  await page.close()
}
console.log(results.join('\n'))
await browser.close()
