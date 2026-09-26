/**
 * 스티커 PNG 안쪽의 반투명 "구멍"을 메운다 (2026-09-26 사용자 요청, public/stickers에 한 번 적용함).
 *
 * - 테두리에서 바깥으로 이어지는 투명 영역(alpha < 200)만 "바깥"으로 본다
 * - 그 밖의 픽셀은 흰 바탕 위에 올린 색으로 바꾸고 완전 불투명하게 한다
 *   (참고 시안이 흰 바탕에서 보이던 모습과 같다)
 * - 테두리 하트·말풍선은 윤곽선의 작은 틈을 막은 뒤(closing) 안쪽 전체를 흰색으로 채운다
 *
 * 실행: node scripts/fill-sticker-holes.mjs <입력 폴더> <출력 폴더> [비교 시트.png]
 * 브라우저 캔버스로 PNG를 읽고 쓰므로 E2E와 같은 Chromium을 쓴다.
 */
import { launchBrowser } from '../e2e/browser.mjs'
import fs from 'node:fs'
const [, , src = 'public/stickers', dst = 'public/stickers', sheet] = process.argv
fs.mkdirSync(dst, { recursive: true })
const CLOSE = new Set(['heart-outline.png', 'heart-bubble-gray.png', 'heart-bubble-pink.png'])
const files = fs.readdirSync(src).filter((f) => f.endsWith('.png')).sort()
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
const before = [], after = []
for (const f of files) {
  const b64 = fs.readFileSync(`${src}/${f}`).toString('base64')
  const out = await page.evaluate(async ([b64, closeGaps]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const W = img.width, H = img.height, c = document.createElement('canvas'); c.width = W; c.height = H
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); const im = x.getImageData(0, 0, W, H); const d = im.data
    const TH = 200
    // 테두리 하트·말풍선은 윤곽선의 작은 틈을 먼저 막아 안쪽 전체를 메운다
    const solid = new Uint8Array(W * H); for (let p = 0; p < W * H; p++) solid[p] = d[p * 4 + 3] >= TH ? 1 : 0
    if (closeGaps) {
      const R = 4, grown = new Uint8Array(W * H)
      for (let y = 0; y < H; y++) for (let x0 = 0; x0 < W; x0++) {
        if (!solid[y * W + x0]) continue
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const yy = y + dy, xx = x0 + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) grown[yy * W + xx] = 1 }
      }
      solid.set(grown)
    }
    const outside = new Uint8Array(W * H); const st = []
    for (let i = 0; i < W; i++) st.push(i, (H - 1) * W + i); for (let j = 0; j < H; j++) st.push(j * W, j * W + W - 1)
    while (st.length) { const p = st.pop(); if (outside[p] || solid[p]) continue; outside[p] = 1; const px = p % W, py = (p / W) | 0
      if (px > 0) st.push(p - 1); if (px < W - 1) st.push(p + 1); if (py > 0) st.push(p - W); if (py < H - 1) st.push(p + W) }
    // 틈을 막으려고 부풀린 만큼 바깥 영역을 다시 넓혀서, 윤곽선 밖 테두리는 메우지 않는다 (closing)
    if (closeGaps) {
      const orig = (p) => d[p * 4 + 3] >= TH
      for (let step = 0; step < 4; step++) {
        const grow = []
        for (let p = 0; p < W * H; p++) {
          if (outside[p] || orig(p)) continue
          const px = p % W, py = (p / W) | 0
          if ((px > 0 && outside[p - 1]) || (px < W - 1 && outside[p + 1]) || (py > 0 && outside[p - W]) || (py < H - 1 && outside[p + W])) grow.push(p)
        }
        for (const p of grow) outside[p] = 1
      }
    }
    let filled = 0
    for (let p = 0; p < W * H; p++) {
      if (outside[p]) continue
      const i = p * 4, a = d[i + 3] / 255
      // 흰 바탕 위에 올린 색으로 바꾸고 불투명하게
      for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] * a + 255 * (1 - a))
      if (d[i + 3] < 255) filled++
      d[i + 3] = 255
    }
    x.putImageData(im, 0, 0)
    return { png: c.toDataURL('image/png'), filled }
  }, [b64, CLOSE.has(f)])
  fs.writeFileSync(`${dst}/${f}`, Buffer.from(out.png.split(',')[1], 'base64'))
  before.push('data:image/png;base64,' + b64); after.push(out.png)
}
// 비교 시트: 위=원본, 아래=메운 것 / 왼쪽 반 어두운 배경, 오른쪽 반 사진 같은 배경
const cells = (arr) => arr.map((s) => `<img src="${s}" style="height:58px;max-width:70px;object-fit:contain;image-rendering:pixelated">`).join('')
await page.setContent(`<body style="margin:0;font:13px sans-serif">
<div style="padding:6px;background:linear-gradient(90deg,#2b2f3a 50%,#7f6a5a 50%);display:flex;flex-wrap:wrap;gap:4px">${cells(before)}</div>
<div style="padding:4px 8px;background:#fff">↑ 원본 / ↓ 구멍 메운 것</div>
<div style="padding:6px;background:linear-gradient(90deg,#2b2f3a 50%,#7f6a5a 50%);display:flex;flex-wrap:wrap;gap:4px">${cells(after)}</div></body>`)
if (sheet) await page.screenshot({ path: sheet, fullPage: true })
await browser.close()
