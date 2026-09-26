import { CANVAS_SIZES } from '../editor/constants'
import type { AspectRatio, FrameId } from '../editor/types'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface CardLayout {
  width: number
  height: number
  /** 사진이 보이는 영역 (이 영역으로 clip된다) */
  photo: Rect
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
 * 카드의 각 영역 위치를 export 픽셀 좌표로 계산한다.
 * 틀(frame)별 레이아웃은 테마 단계에서 추가하며, 그 전까지는 모두 memo 배치를 쓴다.
 */
export function computeLayout(aspectRatio: AspectRatio, frame: FrameId): CardLayout {
  void frame
  const { width, height } = CANVAS_SIZES[aspectRatio]
  return {
    width,
    height,
    photo: { x: 0, y: 0, width, height: Math.round(height * MEMO_PHOTO_HEIGHT_RATIO[aspectRatio]) },
  }
}
