import { SCHEMA_VERSION } from './constants'
import type { EditorState, PhotoTransform } from './types'

export function createDefaultPhotoTransform(): PhotoTransform {
  return { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }
}

/** 매번 새 객체를 반환하므로 호출 측에서 자유롭게 수정해도 기본값이 오염되지 않는다. */
export function createDefaultEditorState(): EditorState {
  return {
    schemaVersion: SCHEMA_VERSION,
    aspectRatio: '1:1',
    photo: {
      source: null,
      transform: createDefaultPhotoTransform(),
    },
    text: {
      title: '그땐 그랬지...',
      status: '오늘도 맑음 ☀',
      body: '',
      bgm: '',
      date: '',
      signature: '',
    },
    counter: {
      visible: true,
      today: 1,
      total: 2004,
    },
    theme: {
      background: 'sky-dots',
      frame: 'minihome',
    },
    stickers: [],
  }
}
