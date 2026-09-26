import { STICKER_ASSETS } from './stickerAssets'
import type { Sticker, StickerKind } from './types'

const ASSET_SIZE = new Map<StickerKind, { width: number; height: number }>(
  STICKER_ASSETS.map((a) => [a.id, { width: a.width, height: a.height }]),
)

export interface StickerBox {
  /** 카드 픽셀 좌표의 중심 */
  cx: number
  cy: number
  /** 회전 전 크기 */
  width: number
  height: number
  /** 라디안 */
  rotation: number
}

/**
 * 스티커가 카드 위에서 차지하는 영역 (renderCard와 같은 계산).
 * size = 카드 너비 대비 스티커 너비, 높이는 원본 비율을 따른다.
 */
export function stickerBox(sticker: Sticker, cardWidth: number, cardHeight: number): StickerBox {
  const asset = ASSET_SIZE.get(sticker.kind) ?? { width: 1, height: 1 }
  const width = sticker.size * cardWidth
  return {
    cx: sticker.x * cardWidth,
    cy: sticker.y * cardHeight,
    width,
    height: (width * asset.height) / Math.max(1, asset.width),
    rotation: (sticker.rotation * Math.PI) / 180,
  }
}

/** (px, py)가 스티커 영역(회전 포함) 안에 있는지. padding만큼 잡기 쉽게 넓힌다 */
export function isInsideSticker(box: StickerBox, px: number, py: number, padding = 0): boolean {
  const dx = px - box.cx
  const dy = py - box.cy
  // 스티커 회전의 반대로 점을 돌려 축 정렬 사각형 판정으로 바꾼다
  const cos = Math.cos(-box.rotation)
  const sin = Math.sin(-box.rotation)
  const lx = dx * cos - dy * sin
  const ly = dx * sin + dy * cos
  return Math.abs(lx) <= box.width / 2 + padding && Math.abs(ly) <= box.height / 2 + padding
}

/** 위에 그려진(배열 뒤쪽) 스티커부터 찾는다. 없으면 null */
export function hitTestStickers(
  stickers: readonly Sticker[],
  px: number,
  py: number,
  cardWidth: number,
  cardHeight: number,
  padding = 0,
): Sticker | null {
  for (let i = stickers.length - 1; i >= 0; i--) {
    if (isInsideSticker(stickerBox(stickers[i], cardWidth, cardHeight), px, py, padding)) return stickers[i]
  }
  return null
}
