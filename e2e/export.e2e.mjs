import { launchBrowser } from './browser.mjs'
import fs from 'node:fs'
const [,, url, shots] = process.argv
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1200, height: 1400 }, acceptDownloads: true })
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
const results = []
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + JSON.stringify(detail)}`)
await page.goto(url); await page.waitForFunction(() => document.fonts.check('24px "dear2004-galmuri11"'))

// 투명 영역이 있는 PNG 사진 (TC-10)
const png = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 900; c.height = 600
  const x = c.getContext('2d'); x.fillStyle = '#4a8fd6'; x.fillRect(0, 0, 450, 600)
  x.fillStyle = 'rgba(208,33,58,0.5)'; x.beginPath(); x.arc(600, 300, 150, 0, 7); x.fill() // 오른쪽 절반은 투명
  const b = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer()); let s = ''; for (const v of b) s += String.fromCharCode(v); return btoa(s)
})
await page.locator('input[type=file][accept="image/png,image/jpeg"]').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
await page.waitForSelector('figure img')
await page.getByLabel('찍을 날짜').fill('2004.10.27')
await page.getByRole('tab', { name: '문구' }).click()
await page.getByLabel('감성 문구').fill('˚ ｡ · 오늘 하루도... *\n아무렇지 않은 척 웃었ㄷㅏ... 😀')
await page.getByLabel('닉네임 / 서명').fill('★나야나★')
await page.getByRole('tab', { name: '사진' }).click()
await page.getByLabel('확대', { exact: true }).fill('140'); await page.getByLabel('회전', { exact: true }).fill('12')

const compare = async (file, format) => page.evaluate(async ([b64, format]) => {
  const img = new Image(); img.src = `data:image/${format};base64,${b64}`; await img.decode()
  const preview = document.querySelector('.card-preview canvas')
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
  const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const a = x.getImageData(0, 0, c.width, c.height).data
  const b = preview.getContext('2d').getImageData(0, 0, preview.width, preview.height).data
  let exact = 0, sum = 0
  if (a.length === b.length) for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) exact++; sum += Math.abs(a[i] - b[i]) }
  // 사진 오른쪽(투명 영역) 픽셀
  const p = x.getImageData(Math.round(c.width * 0.9), Math.round(c.height * 0.05), 1, 1).data
  return { w: c.width, h: c.height, pw: preview.width, ph: preview.height, exact, mean: sum / a.length, transparentPixel: [...p] }
}, [fs.readFileSync(file).toString('base64'), format === 'png' ? 'png' : 'jpeg'])

for (const [ratio, size] of [['1:1', [1080, 1080]], ['4:5', [1080, 1350]], ['9:16', [1080, 1920]]]) {
  await page.locator('label.choice', { hasText: ratio }).first().click()
  await page.waitForTimeout(250)
  for (const format of ['png', 'jpeg']) {
    const label = format === 'png' ? 'PNG로 저장하기' : 'JPEG로 저장하기'
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: label }).click()])
    const file = `${shots}/export-${ratio.replace(':', 'x')}.${format === 'png' ? 'png' : 'jpg'}`
    await dl.saveAs(file)
    const r = await compare(file, format)
    const tc = { '1:1': 'TC-28', '4:5': 'TC-29', '9:16': 'TC-30' }[ratio]
    check(`${tc} ${ratio} ${format} 크기 ${size.join('x')}`, r.w === size[0] && r.h === size[1], r)
    check(`${tc} ${ratio} ${format} 파일 이름`, new RegExp(`^dear2004-${ratio.replace(':', 'x')}-\\d{8}-\\d{6}\\.${format === 'png' ? 'png' : 'jpg'}$`).test(dl.suggestedFilename()), dl.suggestedFilename())
    if (format === 'png') check(`${tc} ${ratio} PNG == 미리보기 (픽셀 완전 일치)`, r.exact === 0, r)
    else {
      check(`${tc} ${ratio} JPEG ≈ 미리보기 (평균 오차 < 2)`, r.mean < 2, r.mean)
      check(`TC-10 ${ratio} JPEG 투명 영역이 검게 나오지 않음`, r.transparentPixel.slice(0, 3).every((v) => v > 200), r.transparentPixel)
    }
  }
}
await page.getByRole('button', { name: 'PNG로 저장하기' }).isEnabled()
check('저장 후 버튼 다시 활성', await page.getByRole('button', { name: 'PNG로 저장하기' }).isEnabled())
check('콘솔/페이지 에러 없음', errors.length === 0, errors)
console.log(results.join('\n'))
await browser.close()
