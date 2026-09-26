import type { EditorState, StickerKind } from '../editor/types'
import { drawDateStamp, formatStampText } from './dateStamp'
import { computeLayout, type Rect } from './layout'
import { applyColorEffect, EFFECT_PARAMS } from './photoEffects'
import { computePhotoPlacement } from './photoPlacement'

/** 디코딩이 끝난 이미지. HTMLImageElement나 ImageBitmap 모두 가능 */
export interface LoadedImage {
  image: CanvasImageSource
  width: number
  height: number
}

export type LoadedPhoto = LoadedImage

/** renderCard가 그리는 데 필요한, 미리 디코딩된 이미지들 */
export interface CardAssets {
  photo: LoadedPhoto | null
  stickers: ReadonlyMap<StickerKind, LoadedImage>
}

export type CanvasFactory = (width: number, height: number) => HTMLCanvasElement

const defaultCanvasFactory: CanvasFactory = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const COLORS = {
  memoBackground: '#ffffff',
  placeholderTop: '#b9c8d8',
  placeholderMiddle: '#d9d3d6',
  placeholderBottom: '#efe4da',
  placeholderText: '#7d8794',
} as const

/** 스탬프 숫자 높이 = 카드 너비의 2.4% (1080px에서 약 26px), 사진 모서리에서 떨어진 거리 */
const STAMP_DIGIT_HEIGHT_RATIO = 0.024
const STAMP_MARGIN_RATIO = { right: 0.022, bottom: 0.016 } as const

function drawPlaceholder(ctx: CanvasRenderingContext2D, area: Rect): void {
  const gradient = ctx.createLinearGradient(area.x, area.y, area.x + area.width * 0.4, area.y + area.height)
  gradient.addColorStop(0, COLORS.placeholderTop)
  gradient.addColorStop(0.55, COLORS.placeholderMiddle)
  gradient.addColorStop(1, COLORS.placeholderBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(area.x, area.y, area.width, area.height)

  ctx.fillStyle = COLORS.placeholderText
  ctx.font = `${Math.round(area.width * 0.022)}px Galmuri11, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('[내 사진]', area.x + area.width / 2, area.y + area.height / 2)
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

/**
 * 카드 한 장을 그린다. Preview와 Export가 모두 이 함수를 쓴다.
 * ctx의 캔버스는 computeLayout()이 돌려주는 export 크기와 같아야 한다.
 */
export function renderCard(
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  assets: CardAssets,
  createCanvas: CanvasFactory = defaultCanvasFactory,
): void {
  const { photo } = assets
  const layout = computeLayout(state.aspectRatio, state.theme.frame)
  const area = layout.photo

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  // JPEG export에서도 투명 영역이 검게 나오지 않도록 항상 배경을 먼저 칠한다
  ctx.fillStyle = COLORS.memoBackground
  ctx.fillRect(0, 0, layout.width, layout.height)

  if (photo) {
    ctx.drawImage(renderPhotoLayer(photo, state, area, createCanvas), area.x, area.y)
  } else {
    drawPlaceholder(ctx, area)
  }

  const stampText = state.photo.showDateStamp ? formatStampText(state.text.date) : null
  if (stampText) {
    drawDateStamp(
      ctx,
      stampText,
      area.x + area.width - layout.width * STAMP_MARGIN_RATIO.right,
      area.y + area.height - layout.width * STAMP_MARGIN_RATIO.bottom,
      layout.width * STAMP_DIGIT_HEIGHT_RATIO,
    )
  }

  drawStickers(ctx, state, layout, assets.stickers)
  ctx.restore()
}
