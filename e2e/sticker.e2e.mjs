import { launchBrowser } from './browser.mjs'
import fs from 'node:fs'
const [,, url, shots] = process.argv
const browser = await launchBrowser()
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)

{ // 데스크톱
  const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, acceptDownloads: true })
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(url); await page.waitForFunction(() => document.fonts.check('24px "dear2004-galmuri11"'))
  await page.getByRole('tab', { name: '꾸미기' }).click()
  await page.getByRole('button', { name: '분홍 하트 붙이기' }).click()
  check('스티커 붙이면 선택 패널 표시', await page.getByText('선택한 스티커').isVisible())
  check('선택 테두리 표시', (await page.locator('.sticker-selection').count()) === 1)
  const xBefore = await page.getByLabel('좌우', { exact: true }).last().inputValue()
  // 가운데(스티커 위치)에서 오른쪽 아래로 끌기
  const box = await page.locator('.card-preview').boundingBox()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 8 }); await page.mouse.up()
  const xAfter = await page.getByLabel('좌우', { exact: true }).last().inputValue()
  const yAfter = await page.getByLabel('위아래', { exact: true }).last().inputValue()
  check('마우스로 끌어서 이동', xBefore === '50' && Math.abs(Number(xAfter) - 80) <= 1 && Math.abs(Number(yAfter) - 30) <= 1, [xBefore, xAfter, yAfter])
  // 빈 곳 클릭 → 선택 해제
  await page.mouse.click(box.x + box.width * 0.1, box.y + box.height * 0.9)
  check('빈 곳 클릭 → 선택 해제', (await page.locator('.sticker-selection').count()) === 0)
  // 스티커 클릭 → 다시 선택, 키보드 슬라이더로 크기
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.3)
  check('스티커 클릭 → 선택', (await page.locator('.sticker-selection').count()) === 1)
  const size = page.getByLabel('크기', { exact: true }); await size.focus(); for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
  check('키보드로 크기 조절', (await size.inputValue()) === '13', await size.inputValue())
  await page.getByRole('button', { name: '은색 반짝이 붙이기' }).click()
  await page.getByRole('button', { name: '리본 붙이기', exact: false }).first().click()
  check('여러 개 붙이기 (3개)', (await page.getByText('(3/50)').count()) === 1)
  await page.screenshot({ path: `${shots}/15-stickers.png` })
  // 저장 이미지에 선택 테두리가 없는지: PNG == 미리보기 캔버스
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'PNG로 저장하기' }).click()])
  const file = `${shots}/export-stickers.png`; await dl.saveAs(file)
  const same = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0)
    const a = x.getImageData(0, 0, c.width, c.height).data
    const p = document.querySelector('.card-preview canvas'); const b = p.getContext('2d').getImageData(0, 0, p.width, p.height).data
    let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
    // 선택 테두리 색(#2f7fa8)이 이미지에 있는지
    let blue = 0; for (let i = 0; i < a.length; i += 4) if (a[i] === 47 && a[i + 1] === 127 && a[i + 2] === 168) blue++
    return { d, blue }
  }, fs.readFileSync(file).toString('base64'))
  check('스티커 포함 PNG == 미리보기, 선택 테두리 없음', same.d === 0 && same.blue === 0, same)
  await page.getByRole('button', { name: '떼어내기' }).click()
  check('떼어내기', (await page.getByText('(2/50)').count()) === 1 && (await page.locator('.sticker-selection').count()) === 0)
  check('데스크톱 에러 없음', errors.length === 0, errors)
  await page.close()
}

{ // 모바일 터치: 스티커를 끌면 스크롤 안 됨, 빈 곳을 끌면 스크롤
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errors = []; page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(url); await page.waitForFunction(() => document.fonts.check('24px "dear2004-galmuri11"'))
  await page.getByRole('tab', { name: '꾸미기' }).click()
  await page.getByRole('button', { name: '분홍 하트 붙이기' }).click()
  await page.locator('.card-preview').scrollIntoViewIfNeeded()
  const cdp = await ctx.newCDPSession(page)
  const touchDrag = async (x1, y1, x2, y2) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] })
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + ((x2 - x1) * i) / 8, y: y1 + ((y2 - y1) * i) / 8 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(300)
  }
  let box = await page.locator('.card-preview').boundingBox()
  const scroll0 = await page.evaluate(() => scrollY)
  await touchDrag(box.x + box.width * 0.5, box.y + box.height * 0.5, box.x + box.width * 0.3, box.y + box.height * 0.2)
  const scroll1 = await page.evaluate(() => scrollY)
  const x = await page.getByLabel('좌우', { exact: true }).last().inputValue()
  check('터치로 스티커 끌기 → 이동', Math.abs(Number(x) - 30) <= 2, x)
  check('스티커 끄는 동안 페이지 스크롤 안 됨', scroll1 === scroll0, [scroll0, scroll1])
  box = await page.locator('.card-preview').boundingBox()
  await touchDrag(box.x + box.width * 0.9, box.y + box.height * 0.9, box.x + box.width * 0.9, box.y + box.height * 0.9 - 200)
  const scroll2 = await page.evaluate(() => scrollY)
  check('빈 곳을 끌면 평소처럼 스크롤', scroll2 > scroll1, [scroll1, scroll2])
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  check('모바일 가로 넘침 없음 (스티커 목록 포함)', over <= 0, over)
  check('모바일 에러 없음', errors.length === 0, errors)
  await ctx.close()
}
console.log(results.join('\n'))
await browser.close()
