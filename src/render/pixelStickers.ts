import type { StickerKind, StickerTint } from '../editor/types'

/**
 * 도트(픽셀) 스티커. 사용자 참고 시안: 파스텔 픽셀 아트 + 하얀 칼선 테두리.
 *
 * 격자 문자:
 *   .  비어 있음
 *   X  주 색 (tint). 외곽선·밝은면·그림자는 모양에서 자동 계산
 *   S  보조 색 (은색, tint가 은색이면 연보라) — 날개, 체리 줄기
 *   w  하이라이트 (흰색)
 *   o  주 색 외곽선 톤 (리본 매듭 등 내부 선)
 *   y  노란 포인트 (꽃 가운데)
 */
export const STICKER_GRIDS: Record<StickerKind, readonly string[]> = {
  heart: [
    '..XXX...XXX..',
    '.XwwXX.XXXXX.',
    'XXwXXXXXXXXXX',
    'XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX',
    '.XXXXXXXXXXX.',
    '..XXXXXXXXX..',
    '...XXXXXXX...',
    '....XXXXX....',
    '.....XXX.....',
    '......X......',
  ],
  star: [
    '........X........',
    '.......XXX.......',
    '.......XXX.......',
    '......XXXXX......',
    '......XwXXX......',
    '.....XXwXXXX.....',
    'XXXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXXX..',
    '...XXXXXXXXXXX...',
    '....XXXXXXXXX....',
    '....XXXXXXXXX....',
    '...XXXXXXXXXXX...',
    '...XXXXX.XXXXX...',
    '..XXXXX...XXXXX..',
    '..XXX.......XXX..',
    '.XX...........XX.',
  ],
  sparkle: [
    '.....X.....',
    '.....X.....',
    '....XwX....',
    '....XXX....',
    '..XXXXXXX..',
    'XXXXXwXXXXX',
    '..XXXXXXX..',
    '....XXX....',
    '....XXX....',
    '.....X.....',
    '.....X.....',
  ],
  bow: [
    '.XX.............XX.',
    'XXXXX.........XXXXX',
    'XwwXXXX.....XXXXXXX',
    'XwXXXXXXoooXXXXXXXX',
    'XXXXXXXXoooXXXXXXXX',
    'XXXXXXXXowoXXXXXXXX',
    'XXXXXXXXoooXXXXXXXX',
    'XXXXXXX.ooo.XXXXXXX',
    '.XXXX..XXXXX..XXXX.',
    '......XXX.XXX......',
    '.....XXX...XXX.....',
    '....XXX.....XXX....',
    '....XX.......XX....',
  ],
  flower: [
    '......XXX......',
    '.....XXXXX.....',
    '.XX..XXwXX..XX.',
    'XXXX..XXX..XXXX',
    'XwXXX.XXX.XXXXX',
    'XXXXXXXXXXXXXXX',
    '.XXXXXXyXXXXXX.',
    '...XXXyyyXXX...',
    '.XXXXXXyXXXXXX.',
    'XXXXXXXXXXXXXXX',
    'XXXXX.XXX.XXXXX',
    'XXXX..XXX..XXXX',
    '.XX..XXXXX..XX.',
    '.....XXXXX.....',
    '......XXX......',
  ],
  moon: [
    '...XXXX.....',
    '.XXXX.......',
    '.XwX........',
    'XXX.........',
    'XXX.........',
    'XXX.........',
    'XXX.........',
    'XXXX........',
    '.XXXX.....X.',
    '.XXXXXXXXXX.',
    '..XXXXXXXX..',
    '....XXXX....',
  ],
  cherry: [
    '.......SSS.....',
    '.......S.S.....',
    '......S...S....',
    '.....S.....S...',
    '....S.......S..',
    '..XXX.....XXX..',
    '.XXXXX...XXXXX.',
    'XwwXXXX.XwwXXXX',
    'XwXXXXX.XwXXXXX',
    'XXXXXXX.XXXXXXX',
    '.XXXXX...XXXXX.',
    '..XXX.....XXX..',
  ],
  wingheart: [
    'SS......XXX...XXX......SS',
    'SSSS...XwwXX.XXXXX...SSSS',
    '.SSSSSXXwXXXXXXXXXXSSSSS.',
    'SSSSSSXXXXXXXXXXXXXSSSSSS',
    '.SSSSSXXXXXXXXXXXXXSSSSS.',
    '..SSSS.XXXXXXXXXXX.SSSS..',
    '....SS..XXXXXXXXX..SS....',
    '.........XXXXXXX.........',
    '..........XXXXX..........',
    '...........XXX...........',
    '............X............',
  ],
}

export interface TintPalette {
  light: string
  base: string
  shadow: string
  outline: string
}

export const STICKER_PALETTES: Record<StickerTint, TintPalette> = {
  pink: { light: '#fde6ee', base: '#f6c3d4', shadow: '#eba5bd', outline: '#d88aa6' },
  blue: { light: '#eef2fc', base: '#cdd9f2', shadow: '#b2c2e6', outline: '#8ea3d3' },
  lavender: { light: '#f3eefc', base: '#dccff2', shadow: '#c7b6e8', outline: '#a791d6' },
  silver: { light: '#f4f4f6', base: '#d6d6db', shadow: '#bcbcc3', outline: '#96969f' },
}

export const STICKER_FIXED_COLORS = {
  border: '#ffffff',
  gloss: '#ffffff',
  accent: '#ffe38a',
} as const

/** 하얀 칼선 테두리 두께(칸). 바깥 한 칸 더는 반투명으로 번지게 한다 */
export const STICKER_BORDER = 1
export const STICKER_HALO_ALPHA = 0.55
const PADDING = STICKER_BORDER + 1

export interface StickerPixel {
  x: number
  y: number
  color: string
  alpha: number
}

export interface StickerPixelArt {
  /** 테두리를 포함한 격자 크기 (칸) */
  width: number
  height: number
  pixels: StickerPixel[]
}

function secondaryTint(tint: StickerTint): StickerTint {
  return tint === 'silver' ? 'lavender' : 'silver'
}

/**
 * 격자를 실제 색 픽셀 목록으로 바꾼다. 결정적이라 Preview와 Export가 항상 같다.
 * 외곽선: 상하좌우 중 빈 칸이 닿는 칸 / 밝은면: 위·왼쪽이 외곽 / 그림자: 아래·오른쪽이 외곽
 */
export function buildStickerPixels(kind: StickerKind, tint: StickerTint): StickerPixelArt {
  const grid = STICKER_GRIDS[kind]
  const rows = grid.length
  const cols = grid[0].length
  const cell = (x: number, y: number): string => (y >= 0 && y < rows && x >= 0 && x < cols ? grid[y][x] : '.')
  const filled = (x: number, y: number) => cell(x, y) !== '.'
  const isEdge = (x: number, y: number) =>
    filled(x, y) && (!filled(x - 1, y) || !filled(x + 1, y) || !filled(x, y - 1) || !filled(x, y + 1))

  const pixels: StickerPixel[] = []
  const width = cols + PADDING * 2
  const height = rows + PADDING * 2

  for (let gy = -PADDING; gy < rows + PADDING; gy++) {
    for (let gx = -PADDING; gx < cols + PADDING; gx++) {
      const px = gx + PADDING
      const py = gy + PADDING
      const ch = cell(gx, gy)

      if (ch === '.') {
        // 모양과의 거리(체비쇼프)에 따라 흰 테두리 / 반투명 번짐
        let distance = Infinity
        for (let dy = -PADDING; dy <= PADDING; dy++) {
          for (let dx = -PADDING; dx <= PADDING; dx++) {
            if (filled(gx + dx, gy + dy)) distance = Math.min(distance, Math.max(Math.abs(dx), Math.abs(dy)))
          }
        }
        if (distance <= STICKER_BORDER) pixels.push({ x: px, y: py, color: STICKER_FIXED_COLORS.border, alpha: 1 })
        else if (distance === PADDING) {
          pixels.push({ x: px, y: py, color: STICKER_FIXED_COLORS.border, alpha: STICKER_HALO_ALPHA })
        }
        continue
      }

      if (ch === 'w') {
        pixels.push({ x: px, y: py, color: STICKER_FIXED_COLORS.gloss, alpha: 1 })
        continue
      }
      if (ch === 'y') {
        pixels.push({ x: px, y: py, color: STICKER_FIXED_COLORS.accent, alpha: 1 })
        continue
      }

      const palette = STICKER_PALETTES[ch === 'S' ? secondaryTint(tint) : tint]
      let color: string
      if (ch === 'o' || isEdge(gx, gy)) color = palette.outline
      else if (!filled(gx + 1, gy + 1) || isEdge(gx + 1, gy) || isEdge(gx, gy + 1)) color = palette.shadow
      else if (isEdge(gx - 1, gy) || isEdge(gx, gy - 1)) color = palette.light
      // 은은한 도트 결: 규칙적인 밝은 점
      else if ((gx + gy * 2) % 5 === 0) color = palette.light
      else color = palette.base
      pixels.push({ x: px, y: py, color, alpha: 1 })
    }
  }
  return { width, height, pixels }
}

/** 1칸 = 1px 캔버스에 스티커를 그린다. 확대는 호출하는 쪽에서 smoothing 없이 한다 */
export function paintStickerArt(ctx: CanvasRenderingContext2D, art: StickerPixelArt): void {
  ctx.clearRect(0, 0, art.width, art.height)
  for (const p of art.pixels) {
    ctx.globalAlpha = p.alpha
    ctx.fillStyle = p.color
    ctx.fillRect(p.x, p.y, 1, 1)
  }
  ctx.globalAlpha = 1
}
