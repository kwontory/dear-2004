import { describe, expect, it } from 'vitest'
import { STICKER_KINDS, STICKER_TINTS } from '../editor/constants'
import {
  buildStickerPixels,
  STICKER_BORDER,
  STICKER_FIXED_COLORS,
  STICKER_GRIDS,
  STICKER_PALETTES,
} from './pixelStickers'

const ALLOWED = new Set(['.', 'X', 'S', 'w', 'o', 'y'])

describe('STICKER_GRIDS', () => {
  it.each(STICKER_KINDS)('%s: 직사각형이고 허용된 문자만 쓴다', (kind) => {
    const grid = STICKER_GRIDS[kind]
    expect(grid.length).toBeGreaterThan(4)
    for (const row of grid) {
      expect(row).toHaveLength(grid[0].length)
      for (const ch of row) expect(ALLOWED.has(ch)).toBe(true)
    }
  })
})

describe('buildStickerPixels', () => {
  it.each(STICKER_TINTS)('%s: 모든 칸이 격자 안에 있고 팔레트 색만 쓴다', (tint) => {
    const palettes = Object.values(STICKER_PALETTES).flatMap((p) => Object.values(p))
    const allowed = new Set([...palettes, ...Object.values(STICKER_FIXED_COLORS)])
    for (const kind of STICKER_KINDS) {
      const art = buildStickerPixels(kind, tint)
      const seen = new Set<string>()
      for (const p of art.pixels) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThan(art.width)
        expect(p.y).toBeLessThan(art.height)
        expect(allowed.has(p.color)).toBe(true)
        seen.add(`${p.x},${p.y}`)
      }
      // 같은 칸을 두 번 칠하지 않는다
      expect(seen.size).toBe(art.pixels.length)
    }
  })

  it('모양 바깥에 흰 칼선 테두리가 생긴다', () => {
    const art = buildStickerPixels('heart', 'pink')
    const at = (x: number, y: number) => art.pixels.find((p) => p.x === x && p.y === y)
    // 하트 맨 아래 꼭짓점(격자 6,10) 바로 아래 칸 → 테두리 좌표 +padding
    const padding = STICKER_BORDER + 1
    expect(at(6 + padding, 11 + padding)).toMatchObject({ color: STICKER_FIXED_COLORS.border, alpha: 1 })
    // 가장자리 한 칸 더 바깥은 반투명
    expect(at(6 + padding, 12 + padding)?.alpha).toBeLessThan(1)
    // 모서리 빈 칸은 아무것도 없다
    expect(at(0, 0)).toBeUndefined()
  })

  it('외곽선·밝은면·그림자 톤을 모두 쓴다', () => {
    const colors = new Set(buildStickerPixels('heart', 'blue').pixels.map((p) => p.color))
    const palette = STICKER_PALETTES.blue
    for (const c of [palette.outline, palette.base, palette.light, palette.shadow]) expect(colors.has(c)).toBe(true)
  })

  it('보조 색(S)은 tint와 다른 팔레트를 쓴다', () => {
    const pinkWing = new Set(buildStickerPixels('wingheart', 'pink').pixels.map((p) => p.color))
    expect(pinkWing.has(STICKER_PALETTES.silver.outline)).toBe(true)
    const silverWing = new Set(buildStickerPixels('wingheart', 'silver').pixels.map((p) => p.color))
    expect(silverWing.has(STICKER_PALETTES.lavender.outline)).toBe(true)
  })

  it('결정적이다 (Preview와 Export가 같다)', () => {
    expect(buildStickerPixels('bow', 'lavender')).toEqual(buildStickerPixels('bow', 'lavender'))
  })
})
