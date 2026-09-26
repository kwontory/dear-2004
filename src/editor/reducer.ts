import {
  ASPECT_RATIOS,
  BACKGROUND_IDS,
  COMMENT_LIMITS,
  FRAME_IDS,
  HEX_COLOR_PATTERN,
  PHOTO_EFFECTS,
  STICKER_LIMITS,
  TEXT_MAX_LENGTHS,
} from './constants'
import { createDefaultPhotoTransform } from './defaults'
import { clampCounterValue, clampPhotoTransform, clampSticker } from './math'
import { truncateText } from './text'
import type {
  AspectRatio,
  CardComment,
  CardTheme,
  EditorState,
  PhotoEffect,
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
  | { type: 'setPhotoEffect'; effect: PhotoEffect }
  | { type: 'setDateStamp'; visible: boolean }
  | { type: 'setText'; field: TextFieldKey; value: string }
  | { type: 'updateCounter'; patch: Partial<VisitCounter> }
  | { type: 'updateTheme'; patch: Partial<CardTheme> }
  | { type: 'addSticker'; id: string; kind: StickerKind; x?: number; y?: number }
  | { type: 'updateSticker'; id: string; patch: Partial<Omit<Sticker, 'id'>> }
  | { type: 'removeSticker'; id: string }
  | { type: 'bringStickerToFront'; id: string }
  | { type: 'addComment'; id: string }
  | { type: 'updateComment'; id: string; patch: Partial<Omit<CardComment, 'id'>> }
  | { type: 'removeComment'; id: string }
  /** 템플릿 불러오기 / JSON import. 반드시 validateEditorState를 통과한 값을 넘긴다. */
  | { type: 'replaceState'; state: EditorState }

/** 새 스티커: 카드 가운데, 카드 너비의 7.5% */
const NEW_STICKER_DEFAULTS = { x: 0.5, y: 0.5, size: 0.075, rotation: 0 } as const

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

    // 새 사진이면 위치·크기만 초기화하고 효과·날짜 스탬프 설정은 유지한다
    case 'setPhoto':
      return {
        ...state,
        photo: { ...state.photo, source: action.source, transform: createDefaultPhotoTransform() },
      }

    case 'clearPhoto':
      return {
        ...state,
        photo: { ...state.photo, source: null, transform: createDefaultPhotoTransform() },
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

    case 'setPhotoEffect':
      if (!PHOTO_EFFECTS.includes(action.effect)) return state
      return { ...state, photo: { ...state.photo, effect: action.effect } }

    case 'setDateStamp':
      return { ...state, photo: { ...state.photo, showDateStamp: action.visible } }

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

    case 'updateTheme': {
      const { background, frame, solidColor } = action.patch
      // 잘못된 값은 무시하고 나머지만 반영한다
      return {
        ...state,
        theme: {
          background: background && BACKGROUND_IDS.includes(background) ? background : state.theme.background,
          frame: frame && FRAME_IDS.includes(frame) ? frame : state.theme.frame,
          solidColor: solidColor && HEX_COLOR_PATTERN.test(solidColor) ? solidColor.toLowerCase() : state.theme.solidColor,
        },
      }
    }

    case 'addSticker':
      if (state.stickers.length >= STICKER_LIMITS.maxCount) return state
      if (state.stickers.some((s) => s.id === action.id)) return state
      return {
        ...state,
        stickers: [
          ...state.stickers,
          clampSticker({
            ...NEW_STICKER_DEFAULTS,
            id: action.id,
            kind: action.kind,
            x: action.x ?? NEW_STICKER_DEFAULTS.x,
            y: action.y ?? NEW_STICKER_DEFAULTS.y,
          }),
        ],
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

    case 'bringStickerToFront': {
      const target = state.stickers.find((s) => s.id === action.id)
      if (!target) return state
      return { ...state, stickers: [...state.stickers.filter((s) => s.id !== action.id), target] }
    }

    case 'addComment':
      if (state.comments.length >= COMMENT_LIMITS.maxCount) return state
      if (state.comments.some((c) => c.id === action.id)) return state
      return { ...state, comments: [...state.comments, { id: action.id, author: '', text: '' }] }

    case 'updateComment':
      return {
        ...state,
        comments: state.comments.map((c) =>
          c.id === action.id
            ? {
                id: c.id,
                author: truncateText(action.patch.author ?? c.author, COMMENT_LIMITS.maxAuthorLength),
                text: truncateText(action.patch.text ?? c.text, COMMENT_LIMITS.maxTextLength),
              }
            : c,
        ),
      }

    case 'removeComment':
      return { ...state, comments: state.comments.filter((c) => c.id !== action.id) }

    case 'replaceState':
      return action.state
  }
}
