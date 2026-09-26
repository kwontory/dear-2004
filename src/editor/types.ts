import type {
  ASPECT_RATIOS,
  BACKGROUND_IDS,
  FRAME_IDS,
  SCHEMA_VERSION,
  STICKER_KINDS,
  TEXT_MAX_LENGTHS,
} from './constants'

export type AspectRatio = (typeof ASPECT_RATIOS)[number]
export type BackgroundId = (typeof BACKGROUND_IDS)[number]
export type FrameId = (typeof FRAME_IDS)[number]
export type StickerKind = (typeof STICKER_KINDS)[number]

/** 디코드가 끝난 업로드 이미지. dataUrl은 PNG/JPEG data URL만 허용한다. */
export interface PhotoSource {
  dataUrl: string
  width: number
  height: number
}

/**
 * 해상도 독립 사진 변환.
 * - offsetX/offsetY: 사진 영역 크기 대비 이동 비율 (0 = 가운데)
 * - scale: cover 맞춤 대비 배율 (1 = 영역을 꽉 채움)
 * - rotation: 도(degree)
 */
export interface PhotoTransform {
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
}

export interface PhotoLayer {
  source: PhotoSource | null
  transform: PhotoTransform
}

export type TextFieldKey = keyof typeof TEXT_MAX_LENGTHS

export type CardText = Record<TextFieldKey, string>

export interface VisitCounter {
  visible: boolean
  today: number
  total: number
}

export interface CardTheme {
  background: BackgroundId
  frame: FrameId
}

/** x, y: 카드 크기 대비 중심 좌표(0~1), size: 카드 너비 대비 비율 */
export interface Sticker {
  id: string
  kind: StickerKind
  x: number
  y: number
  size: number
  rotation: number
}

/**
 * 편집 가능한 모든 상태의 단일 source of truth.
 * 템플릿 저장, JSON export/import, 렌더링이 모두 이 구조를 그대로 사용한다.
 */
export interface EditorState {
  schemaVersion: typeof SCHEMA_VERSION
  aspectRatio: AspectRatio
  photo: PhotoLayer
  text: CardText
  counter: VisitCounter
  theme: CardTheme
  stickers: Sticker[]
}
