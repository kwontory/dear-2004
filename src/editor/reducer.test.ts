import { describe, expect, it } from 'vitest'
import { ASPECT_RATIOS, COMMENT_LIMITS, COUNTER_MAX, PHOTO_LIMITS, STICKER_LIMITS, TEXT_MAX_LENGTHS } from './constants'
import { createDefaultEditorState } from './defaults'
import { editorReducer, type EditorAction } from './reducer'
import type { EditorState } from './types'
import { validateEditorState } from './validate'

const SOURCE = {
  dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
  width: 4000,
  height: 100,
}

function run(actions: EditorAction[], start: EditorState = createDefaultEditorState()) {
  return actions.reduce(editorReducer, start)
}

/** reducer 결과는 언제나 import 검증을 통과해야 한다 */
function expectValid(state: EditorState) {
  expect(validateEditorState(state)).toEqual({ ok: true, state })
}

describe('editorReducer', () => {
  it('화면비를 반복해서 바꿔도 다른 상태가 보존된다 (TC-18)', () => {
    const start = run([
      { type: 'setPhoto', source: SOURCE },
      { type: 'updatePhotoTransform', patch: { offsetX: 0.3, scale: 2 } },
      { type: 'addSticker', id: 'a', kind: 'sparkle-blue' },
    ])
    const cycle: EditorAction[] = ['4:5', '9:16', '1:1'].map((r) => ({
      type: 'setAspectRatio',
      aspectRatio: r as EditorState['aspectRatio'],
    }))
    const end = run([...cycle, ...cycle, ...cycle], start)
    expect(end).toEqual(start)
    expectValid(end)
  })

  it('허용되지 않은 화면비는 무시한다', () => {
    const state = createDefaultEditorState()
    const next = editorReducer(state, { type: 'setAspectRatio', aspectRatio: '16:9' as never })
    expect(next).toBe(state)
    expect(ASPECT_RATIOS).not.toContain('16:9')
  })

  it('새 사진을 올리면 변환이 초기화된다', () => {
    const state = run([
      { type: 'updatePhotoTransform', patch: { scale: 3 } },
      { type: 'setPhoto', source: SOURCE },
    ])
    expect(state.photo.transform.scale).toBe(1)
    expect(run([{ type: 'clearPhoto' }], state).photo.source).toBeNull()
  })

  it('극단 scale / NaN 입력에도 유한한 값을 유지한다 (TC-17)', () => {
    const big = run([{ type: 'updatePhotoTransform', patch: { scale: 1e9, offsetX: -1e9 } }])
    expect(big.photo.transform).toMatchObject({ scale: PHOTO_LIMITS.maxScale, offsetX: -PHOTO_LIMITS.maxOffset })
    const nan = run([{ type: 'updatePhotoTransform', patch: { scale: NaN, rotation: Infinity } }])
    expect(nan.photo.transform).toMatchObject({ scale: 1, rotation: 0 })
    expectValid(big)
    expectValid(nan)
  })

  it('텍스트는 최대 길이로 잘린다 (TC-12)', () => {
    const state = run([{ type: 'setText', field: 'body', value: '가'.repeat(5000) }])
    expect(state.text.body).toHaveLength(TEXT_MAX_LENGTHS.body)
    expectValid(state)
  })

  it('카운터는 0 이상의 정수로 보정된다', () => {
    const state = run([{ type: 'updateCounter', patch: { today: -5, total: 1.6e10 } }])
    expect(state.counter).toMatchObject({ today: 0, total: COUNTER_MAX })
  })

  it('스티커 추가 / 수정 / 삭제', () => {
    let state = run([
      { type: 'addSticker', id: 'a', kind: 'heart-pink' },
      { type: 'addSticker', id: 'a', kind: 'sparkle-blue' }, // 중복 id 무시
      { type: 'addSticker', id: 'b', kind: 'bow-pink' },
      { type: 'updateSticker', id: 'a', patch: { x: 2, size: 0.3 } },
    ])
    expect(state.stickers.map((s) => s.id)).toEqual(['a', 'b'])
    expect(state.stickers[0]).toMatchObject({ kind: 'heart-pink', x: 1, size: 0.3 })
    state = editorReducer(state, { type: 'removeSticker', id: 'a' })
    expect(state.stickers.map((s) => s.id)).toEqual(['b'])
    expectValid(state)
  })

  it('스티커 최대 개수를 넘지 않는다', () => {
    const actions: EditorAction[] = Array.from({ length: STICKER_LIMITS.maxCount + 5 }, (_, i) => ({
      type: 'addSticker',
      id: `s${i}`,
      kind: 'sparkle-blue',
    }))
    expect(run(actions).stickers).toHaveLength(STICKER_LIMITS.maxCount)
  })

  it('사진 효과 / 날짜 스탬프는 새 사진을 올려도 유지된다', () => {
    const state = run([
      { type: 'setPhotoEffect', effect: 'mono' },
      { type: 'setDateStamp', visible: false },
      { type: 'setPhoto', source: SOURCE },
    ])
    expect(state.photo).toMatchObject({ effect: 'mono', showDateStamp: false, source: SOURCE })
    expect(run([{ type: 'setPhotoEffect', effect: 'sepia' as never }], state)).toBe(state)
    expectValid(state)
  })

  it('댓글 추가 / 수정 / 삭제', () => {
    let state = run([
      { type: 'addComment', id: 'c1' },
      { type: 'addComment', id: 'c1' }, // 중복 id 무시
      { type: 'addComment', id: 'c2' },
      { type: 'updateComment', id: 'c1', patch: { author: '단짝♡' } },
      { type: 'updateComment', id: 'c1', patch: { text: '퍼가요~♡'.repeat(50) } },
    ])
    expect(state.comments.map((c) => c.id)).toEqual(['c1', 'c2'])
    expect(state.comments[0].author).toBe('단짝♡')
    expect(state.comments[0].text).toHaveLength(COMMENT_LIMITS.maxTextLength)
    state = editorReducer(state, { type: 'removeComment', id: 'c1' })
    expect(state.comments.map((c) => c.id)).toEqual(['c2'])
    expectValid(state)
  })

  it('댓글 최대 개수를 넘지 않는다', () => {
    const actions: EditorAction[] = Array.from({ length: COMMENT_LIMITS.maxCount + 3 }, (_, i) => ({
      type: 'addComment',
      id: `c${i}`,
    }))
    expect(run(actions).comments).toHaveLength(COMMENT_LIMITS.maxCount)
  })

  it('원본 상태를 변경하지 않는다', () => {
    const state = createDefaultEditorState()
    const snapshot = structuredClone(state)
    run([
      { type: 'setText', field: 'title', value: 'x' },
      { type: 'addSticker', id: 'a', kind: 'sparkle-blue' },
      { type: 'updateTheme', patch: { frame: 'memo' } },
    ], state)
    expect(state).toEqual(snapshot)
  })
})
