import { STICKER_ASSETS } from './stickerAssets'

/**
 * EditorState 관련 상수의 단일 출처.
 * 타입(types.ts), 기본값(defaults.ts), 검증(validate.ts)이 모두 여기서 파생된다.
 */

export const SCHEMA_VERSION = 1

export const ASPECT_RATIOS = ['1:1', '4:5', '9:16'] as const

/** 다운로드(export) 해상도. Preview는 같은 좌표계를 축소해서 그린다. */
export const CANVAS_SIZES = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
} as const satisfies Record<(typeof ASPECT_RATIOS)[number], { width: number; height: number }>

/** solid = 사용자가 고른 단색 (theme.solidColor) */
export const BACKGROUND_IDS = ['sky-dots', 'pink-check', 'cream-diary', 'pastel-gradient', 'solid'] as const

/** 단색 스킨 기본색과 형식 (#rrggbb 소문자) */
export const DEFAULT_SOLID_COLOR = '#f7d6e0'
export const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i

/** 단색 스킨 팔레트의 빠른 선택 색 */
export const SOLID_COLOR_PRESETS = [
  { hex: '#f7d6e0', label: '연분홍' },
  { hex: '#d6e9f8', label: '연하늘' },
  { hex: '#e3dbf5', label: '연보라' },
  { hex: '#fff4c2', label: '연노랑' },
  { hex: '#d9f2e3', label: '연민트' },
  { hex: '#ffffff', label: '흰색' },
  { hex: '#c3ced6', label: '잿빛 하늘' },
  { hex: '#2b2f3a', label: '밤하늘' },
] as const

export const FRAME_IDS = ['minihome', 'diary', 'album', 'memo'] as const

/** 스티커 종류 = 스티커 에셋 id (src/editor/stickerAssets.ts) */
export const STICKER_KINDS = STICKER_ASSETS.map((asset) => asset.id)

/** original=원본, soft=뽀샤시, faded=빛바램, mono=흑백 */
export const PHOTO_EFFECTS = ['original', 'soft', 'faded', 'mono'] as const

/** 사진 변환 범위. scale 1 = 사진 영역을 꽉 채우는(cover) 크기. */
export const PHOTO_LIMITS = {
  minScale: 0.1,
  maxScale: 5,
  /** 사진 영역 크기 대비 비율. ±1이면 사진 중심이 영역 가장자리까지 이동. */
  maxOffset: 1,
  maxRotation: 180,
} as const

export const PHOTO_SOURCE_LIMITS = {
  maxDimension: 8192,
  /** data URL 전체 문자열 길이 상한 (약 12MB) */
  maxDataUrlLength: 12 * 1024 * 1024,
  mimeTypes: ['image/png', 'image/jpeg'],
} as const

/** 스티커 좌표는 카드 크기 대비 비율(0~1), 크기는 카드 너비 대비 비율. */
export const STICKER_LIMITS = {
  maxCount: 50,
  minSize: 0.03,
  maxSize: 0.5,
  maxRotation: 180,
  maxIdLength: 64,
} as const

export const TEXT_MAX_LENGTHS = {
  title: 40,
  status: 80,
  body: 1000,
  bgm: 60,
  date: 20,
  signature: 30,
} as const

export const COUNTER_MAX = 9_999_999

/** 카드 아래 "ㄴ 닉네임 : 댓글" 줄 */
export const COMMENT_LIMITS = {
  maxCount: 5,
  maxAuthorLength: 20,
  maxTextLength: 60,
  maxIdLength: 64,
} as const

/** 문구 입력칸 옆 "특수문자 넣기" 버튼. 모두 Galmuri 폰트가 지원하는 글자만 쓴다. */
export const SPECIAL_CHARACTERS = [
  '˚', '｡', '･ﾟ', '°', '·', '*', '★', '☆', '♡', '♥', '♬', '♪',
  '…', '~', 'ㆀ', '⊙', '▶', '『', '』', '─', '※', '^^', '*˚', '｡ﾟ',
] as const
