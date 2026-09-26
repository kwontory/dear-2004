import { ASPECT_RATIOS, STICKER_LIMITS, TEXT_MAX_LENGTHS } from './constants'
import { createDefaultPhotoTransform } from './defaults'
import { clampCounterValue, clampPhotoTransform, clampSticker } from './math'
import type {
  AspectRatio,
  CardTheme,
  EditorState,
  PhotoSource,
  PhotoTransform,
  Sticker,
  StickerKind,
  TextFieldKey,
  VisitCounter,
} from './types'

export type EditorAction =
  | { type: 'setAspectRatio'; aspectRatio: AspectRatio }
  | { type: 'setPhoto'; source: PhotoSource }
  | { type: 'clearPhoto' }
  | { type: 'updatePhotoTransform'; patch: Partial<PhotoTransform> }
  | { type: 'resetPhotoTransform' }
  | { type: 'setText'; field: TextFieldKey; value: string }
  | { type: 'updateCounter'; patch: Partial<VisitCounter> }
  | { type: 'updateTheme'; patch: Partial<CardTheme> }
  | { type: 'addSticker'; id: string; kind: StickerKind }
  | { type: 'updateSticker'; id: string; patch: Partial<Omit<Sticker, 'id'>> }
  | { type: 'removeSticker'; id: string }
  /** 템플릿 불러오기 / JSON import. 반드시 validateEditorState를 통과한 값을 넘긴다. */
  | { type: 'replaceState'; state: EditorState }

const NEW_STICKER_DEFAULTS = { x: 0.5, y: 0.5, size: 0.15, rotation: 0 } as const

/** 최대 길이로 자르되 이모지 등 surrogate pair가 반으로 잘리지 않게 한다. */
export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  let cut = value.slice(0, maxLength)
  const last = cut.charCodeAt(cut.length - 1)
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1)
  return cut
}

/**
 * EditorState의 모든 변경은 이 reducer를 거친다.
 * 입력이 범위를 벗어나도 항상 유효한 상태를 반환한다.
 */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'setAspectRatio':
      if (!ASPECT_RATIOS.includes(action.aspectRatio)) return state
      // 좌표가 해상도 독립이므로 화면비만 바꾸면 된다
      return { ...state, aspectRatio: action.aspectRatio }

    case 'setPhoto':
      return {
        ...state,
        photo: { source: action.source, transform: createDefaultPhotoTransform() },
      }

    case 'clearPhoto':
      return {
        ...state,
        photo: { source: null, transform: createDefaultPhotoTransform() },
      }

    case 'updatePhotoTransform':
      return {
        ...state,
        photo: {
          ...state.photo,
          transform: clampPhotoTransform({ ...state.photo.transform, ...action.patch }),
        },
      }

    case 'resetPhotoTransform':
      return { ...state, photo: { ...state.photo, transform: createDefaultPhotoTransform() } }

    case 'setText':
      return {
        ...state,
        text: {
          ...state.text,
          [action.field]: truncateText(action.value, TEXT_MAX_LENGTHS[action.field]),
        },
      }

    case 'updateCounter': {
      const next = { ...state.counter, ...action.patch }
      return {
        ...state,
        counter: {
          visible: next.visible,
          today: clampCounterValue(next.today),
          total: clampCounterValue(next.total),
        },
      }
    }

    case 'updateTheme':
      return { ...state, theme: { ...state.theme, ...action.patch } }

    case 'addSticker':
      if (state.stickers.length >= STICKER_LIMITS.maxCount) return state
      if (state.stickers.some((s) => s.id === action.id)) return state
      return {
        ...state,
        stickers: [...state.stickers, { id: action.id, kind: action.kind, ...NEW_STICKER_DEFAULTS }],
      }

    case 'updateSticker':
      return {
        ...state,
        stickers: state.stickers.map((s) =>
          s.id === action.id ? clampSticker({ ...s, ...action.patch, id: s.id }) : s,
        ),
      }

    case 'removeSticker':
      return { ...state, stickers: state.stickers.filter((s) => s.id !== action.id) }

    case 'replaceState':
      return action.state
  }
}
