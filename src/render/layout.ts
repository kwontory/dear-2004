import { CANVAS_SIZES } from '../editor/constants'
import type { AspectRatio, FrameId } from '../editor/types'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface TextBlock {
  x: number
  y: number
  width: number
  /** 글자 크기 / 줄 높이 (px) */
  fontSize: number
  lineHeight: number
  maxLines: number
}

export interface CardLayout {
  width: number
  height: number
  /** 사진이 보이는 영역 (이 영역으로 clip된다) */
  photo: Rect
  /** 본문(감성 문구) */
  body: TextBlock
  /** 서명: 오른쪽 아래 기준 한 줄 */
  signature: { right: number; bottom: number; maxWidth: number; fontSize: number }
}

/**
 * 감성 사진(memo) 틀 기준: 위쪽은 사진, 아래 흰 여백에 문구.
 * 시안 1:1 카드(540px)에서 사진 높이 318px → 0.589
 */
const MEMO_PHOTO_HEIGHT_RATIO: Record<AspectRatio, number> = {
  '1:1': 318 / 540,
  '4:5': 0.62,
  '9:16': 0.6,
}

/**
 * 시안(540px 카드) 수치 × 2 = export(1080px) 수치.
 * Galmuri11은 12px 배수에서 선명하므로 글자 크기는 24px.
 */
const MEMO_TEXT = {
  paddingX: 68,
  gapBelowPhoto: 52,
  fontSize: 24,
  lineHeight: 42,
  signatureRight: 60,
  signatureBottom: 44,
  /** 본문과 서명 사이 여백 */
  signatureGap: 20,
} as const

/**
 * 카드의 각 영역 위치를 export 픽셀 좌표로 계산한다.
 * 틀(frame)별 레이아웃은 테마 단계에서 추가하며, 그 전까지는 모두 memo 배치를 쓴다.
 */
export function computeLayout(aspectRatio: AspectRatio, frame: FrameId): CardLayout {
  void frame
  const { width, height } = CANVAS_SIZES[aspectRatio]
  const photoHeight = Math.round(height * MEMO_PHOTO_HEIGHT_RATIO[aspectRatio])
  const t = MEMO_TEXT
  const bodyTop = photoHeight + t.gapBelowPhoto
  const bodyBottom = height - t.signatureBottom - t.fontSize - t.signatureGap
  return {
    width,
    height,
    photo: { x: 0, y: 0, width, height: photoHeight },
    body: {
      x: t.paddingX,
      y: bodyTop,
      width: width - t.paddingX * 2,
      fontSize: t.fontSize,
      lineHeight: t.lineHeight,
      maxLines: Math.max(1, Math.floor((bodyBottom - bodyTop) / t.lineHeight)),
    },
    signature: {
      right: width - t.signatureRight,
      bottom: height - t.signatureBottom,
      maxWidth: Math.round(width * 0.5),
      fontSize: t.fontSize,
    },
  }
}
