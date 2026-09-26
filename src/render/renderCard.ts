import type { EditorState, StickerKind } from '../editor/types'
import { drawDateStamp, formatStampText } from './dateStamp'
import { cardFont } from './fonts'
import { drawFrameBase, drawFrameOverlay, drawFrameText } from './frames'
import { computeLayout, type CardLayout, type Rect } from './layout'
import { drawSkin } from './skins'
import { applyColorEffect, EFFECT_PARAMS } from './photoEffects'
import { computePhotoPlacement } from './photoPlacement'

/** 디코딩이 끝난 이미지. HTMLImageElement나 ImageBitmap 모두 가능 */
export interface LoadedImage {
  image: CanvasImageSource
  width: number
  height: number
}

export type LoadedPhoto = LoadedImage

/**
 * 폰트 상태. loading 동안에는 글자를 그리지 않는다 (다른 글꼴로 줄바꿈이 틀어지는 것 방지).
 * failed면 대체 글꼴로 그리고 UI에서 알린다.
 */
export type FontStatus = 'loading' | 'ready' | 'failed'

/** renderCard가 그리는 데 필요한, 미리 준비된 자원들 */
export interface CardAssets {
  photo: LoadedPhoto | null
  stickers: ReadonlyMap<StickerKind, LoadedImage>
  fonts: FontStatus
}

export type CanvasFactory = (width: number, height: number) => HTMLCanvasElement

const defaultCanvasFactory: CanvasFactory = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const COLORS = {
  placeholderTop: '#b9c8d8',
  placeholderMiddle: '#d9d3d6',
  placeholderBottom: '#efe4da',
  placeholderText: '#7d8794',
} as const

/** 스탬프를 사진 모서리에서 떨어뜨리는 거리 (숫자 높이 대비) */
const STAMP_MARGIN = { right: 0.9, bottom: 0.6 } as const

function drawPlaceholder(ctx: CanvasRenderingContext2D, area: Rect, drawLabel: boolean): void {
  const gradient = ctx.createLinearGradient(area.x, area.y, area.x + area.width * 0.4, area.y + area.height)
  gradient.addColorStop(0, COLORS.placeholderTop)
  gradient.addColorStop(0.55, COLORS.placeholderMiddle)
  gradient.addColorStop(1, COLORS.placeholderBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(area.x, area.y, area.width, area.height)

  if (!drawLabel) return
  ctx.fillStyle = COLORS.placeholderText
  ctx.font = cardFont(Math.min(24, Math.max(12, Math.round(area.width / 480) * 12)))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('[내 사진]', area.x + area.width / 2, area.y + area.height / 2)
}

/**
 * 효과까지 입힌 사진 레이어 캐시. 스티커를 끌거나 글자를 칠 때마다 사진 효과(픽셀 계산)를
 * 다시 하지 않도록, 같은 이미지·배치·효과·크기면 이전 결과를 재사용한다. 결과는 항상 같다.
 */
const PHOTO_CACHE_PER_IMAGE = 4
const photoLayerCache = new WeakMap<object, Map<string, HTMLCanvasElement>>()

function cachedPhotoLayer(
  photo: LoadedPhoto,
  state: EditorState,
  area: Rect,
  createCanvas: CanvasFactory,
): HTMLCanvasElement {
  const key = JSON.stringify([state.photo.transform, state.photo.effect, Math.round(area.width), Math.round(area.height)])
  let entries = photoLayerCache.get(photo.image)
  if (!entries) {
    entries = new Map()
    photoLayerCache.set(photo.image, entries)
  }
  const hit = entries.get(key)
  if (hit) return hit
  const layer = renderPhotoLayer(photo, state, area, createCanvas)
  entries.set(key, layer)
  // 오래된 것부터 버린다 (Map은 넣은 순서를 기억한다)
  while (entries.size > PHOTO_CACHE_PER_IMAGE) entries.delete(entries.keys().next().value!)
  return layer
}

/** 사진 영역 크기의 캔버스에 사진을 배치·회전해 그리고 효과를 입힌다. */
function renderPhotoLayer(
  photo: LoadedPhoto,
  state: EditorState,
  area: Rect,
  createCanvas: CanvasFactory,
): HTMLCanvasElement {
  const width = Math.max(1, Math.round(area.width))
  const height = Math.max(1, Math.round(area.height))
  const layer = createCanvas(width, height)
  const ctx = layer.getContext('2d')
  if (!ctx) return layer

  const p = computePhotoPlacement(photo, area, state.photo.transform)
  ctx.imageSmoothingQuality = 'high'
  ctx.save()
  ctx.translate(p.centerX, p.centerY)
  ctx.rotate(p.rotation)
  ctx.drawImage(photo.image, -p.drawWidth / 2, -p.drawHeight / 2, p.drawWidth, p.drawHeight)
  ctx.restore()

  const effect = state.photo.effect
  if (effect !== 'original') {
    const pixels = ctx.getImageData(0, 0, width, height)
    applyColorEffect(pixels.data, effect)
    ctx.putImageData(pixels, 0, 0)
  }

  if (effect === 'soft') {
    const { bloomDownscale, bloomAlpha, haze } = EFFECT_PARAMS.soft
    // 작게 줄였다가 다시 키우면 흐린 사본이 된다 (ctx.filter 없이 blur)
    const small = createCanvas(Math.max(1, Math.round(width / bloomDownscale)), Math.max(1, Math.round(height / bloomDownscale)))
    const smallCtx = small.getContext('2d')
    if (smallCtx) {
      smallCtx.imageSmoothingQuality = 'high'
      smallCtx.drawImage(layer, 0, 0, small.width, small.height)
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = bloomAlpha
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(small, 0, 0, width, height)
      ctx.restore()
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${haze})`
    ctx.fillRect(0, 0, width, height)
  }
  return layer
}

/**
 * 스티커: 원본 도트 이미지를 smoothing 없이 확대해 픽셀 경계를 유지한다.
 * size = 카드 너비 대비 스티커 너비, (x, y) = 카드 대비 중심 좌표.
 * 아직 불러오지 못한 스티커는 건너뛴다 (불러오면 다시 그린다).
 */
function drawStickers(
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  layout: { width: number; height: number },
  images: CardAssets['stickers'],
): void {
  for (const sticker of state.stickers) {
    const image = images.get(sticker.kind)
    if (!image) continue
    const drawWidth = sticker.size * layout.width
    const drawHeight = (drawWidth * image.height) / Math.max(1, image.width)
    ctx.save()
    ctx.translate(sticker.x * layout.width, sticker.y * layout.height)
    ctx.rotate((sticker.rotation * Math.PI) / 180)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    ctx.restore()
  }
}

/** 사진(또는 자리 표시)을 영역에 그린다. rotation이 있으면 영역 중심을 기준으로 돌린다 */
function drawPhotoArea(
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  assets: CardAssets,
  area: Rect,
  rotation: number,
  createCanvas: CanvasFactory,
  stamp: { text: string; height: number } | null,
): void {
  ctx.save()
  ctx.translate(area.x + area.width / 2, area.y + area.height / 2)
  ctx.rotate(rotation)
  const local = { x: -area.width / 2, y: -area.height / 2, width: area.width, height: area.height }
  if (assets.photo) {
    ctx.drawImage(cachedPhotoLayer(assets.photo, state, area, createCanvas), local.x, local.y, area.width, area.height)
  } else {
    drawPlaceholder(ctx, local, assets.fonts !== 'loading')
  }
  if (stamp) {
    drawDateStamp(
      ctx,
      stamp.text,
      local.x + local.width - stamp.height * STAMP_MARGIN.right,
      local.y + local.height - stamp.height * STAMP_MARGIN.bottom,
      stamp.height,
    )
  }
  ctx.restore()
}

/**
 * 카드 한 장을 그린다. Preview와 Export가 모두 이 함수를 쓴다.
 * ctx의 캔버스는 cardSize(state.aspectRatio)와 같은 크기여야 한다.
 *
 * 순서: 배경(스킨) → 틀 장식 → 사진·날짜 스탬프 → 틀 위 장식(테이프) → 글자 → 스티커
 */
export function renderCard(
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  assets: CardAssets,
  createCanvas: CanvasFactory = defaultCanvasFactory,
): void {
  const layout: CardLayout = computeLayout(state)

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  // JPEG export에서도 투명 영역이 검게 나오지 않도록 항상 배경을 먼저 칠한다
  drawSkin(ctx, state.theme.background, layout.width, layout.height)
  drawFrameBase(ctx, state, layout)

  const stampText = state.photo.showDateStamp ? formatStampText(state.text.date) : null
  const rotation = layout.frame === 'diary' ? layout.photoRotation : 0
  drawPhotoArea(ctx, state, assets, layout.photo, rotation, createCanvas, stampText ? { text: stampText, height: layout.stampHeight } : null)
  if (layout.frame === 'minihome') {
    drawPhotoArea(ctx, state, assets, layout.profilePhoto, 0, createCanvas, null)
  }

  drawFrameOverlay(ctx, layout)
  if (assets.fonts !== 'loading') drawFrameText(ctx, state, layout)
  drawStickers(ctx, state, layout, assets.stickers)
  ctx.restore()
}
