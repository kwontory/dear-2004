import { describe, expect, it } from 'vitest'
import { hitTestStickers, isInsideSticker, stickerBox } from './stickerGeometry'
import { STICKER_ASSETS } from './stickerAssets'
import type { Sticker } from './types'

const base: Sticker = { id: 'a', kind: 'heart-pink', x: 0.5, y: 0.5, size: 0.1, rotation: 0 }
const asset = STICKER_ASSETS.find((a) => a.id === 'heart-pink')!

describe('stickerBox', () => {
  it('카드 픽셀 좌표로 바꾸고 원본 비율을 지킨다', () => {
    const box = stickerBox(base, 1080, 1350)
    expect(box.cx).toBe(540)
    expect(box.cy).toBe(675)
    expect(box.width).toBeCloseTo(108)
    expect(box.height).toBeCloseTo((108 * asset.height) / asset.width)
  })
})

describe('hit test', () => {
  it('영역 안/밖', () => {
    const box = stickerBox(base, 1000, 1000)
    expect(isInsideSticker(box, 500, 500)).toBe(true)
    expect(isInsideSticker(box, 549, 500)).toBe(true)
    expect(isInsideSticker(box, 560, 500)).toBe(false)
    expect(isInsideSticker(box, 560, 500, 12)).toBe(true)
  })

  it('회전을 반영한다', () => {
    const wide: Sticker = { ...base, kind: 'bow-pink-wide', size: 0.3 }
    const box = stickerBox(wide, 1000, 1000)
    const edgeX = box.cx + box.width / 2 - 2
    expect(isInsideSticker(box, edgeX, box.cy)).toBe(true)
    const rotated = stickerBox({ ...wide, rotation: 90 }, 1000, 1000)
    // 90도 돌리면 가로 끝점은 영역 밖, 세로 방향으로는 안
    expect(isInsideSticker(rotated, edgeX, box.cy)).toBe(false)
    expect(isInsideSticker(rotated, box.cx, box.cy + box.width / 2 - 2)).toBe(true)
  })

  it('겹치면 위(배열 뒤쪽) 스티커를 고른다', () => {
    const list: Sticker[] = [base, { ...base, id: 'b' }]
    expect(hitTestStickers(list, 500, 500, 1000, 1000)?.id).toBe('b')
    expect(hitTestStickers(list, 10, 10, 1000, 1000)).toBeNull()
  })
})
