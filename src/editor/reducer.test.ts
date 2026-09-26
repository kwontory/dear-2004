import { describe, expect, it } from 'vitest'
import { ASPECT_RATIOS, COUNTER_MAX, PHOTO_LIMITS, STICKER_LIMITS, TEXT_MAX_LENGTHS } from './constants'
import { createDefaultEditorState } from './defaults'
import { editorReducer, truncateText, type EditorAction } from './reducer'
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
      { type: 'addSticker', id: 'a', kind: 'star' },
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

  it('이모지를 반으로 자르지 않는다', () => {
    expect(truncateText('ab😀', 3)).toBe('ab')
    expect(truncateText('ab😀', 4)).toBe('ab😀')
  })

  it('카운터는 0 이상의 정수로 보정된다', () => {
    const state = run([{ type: 'updateCounter', patch: { today: -5, total: 1.6e10 } }])
    expect(state.counter).toMatchObject({ today: 0, total: COUNTER_MAX })
  })

  it('스티커 추가 / 수정 / 삭제', () => {
    let state = run([
      { type: 'addSticker', id: 'a', kind: 'heart' },
      { type: 'addSticker', id: 'a', kind: 'star' }, // 중복 id 무시
      { type: 'addSticker', id: 'b', kind: 'cloud' },
      { type: 'updateSticker', id: 'a', patch: { x: 2, size: 0.3 } },
    ])
    expect(state.stickers.map((s) => s.id)).toEqual(['a', 'b'])
    expect(state.stickers[0]).toMatchObject({ kind: 'heart', x: 1, size: 0.3 })
    state = editorReducer(state, { type: 'removeSticker', id: 'a' })
    expect(state.stickers.map((s) => s.id)).toEqual(['b'])
    expectValid(state)
  })

  it('스티커 최대 개수를 넘지 않는다', () => {
    const actions: EditorAction[] = Array.from({ length: STICKER_LIMITS.maxCount + 5 }, (_, i) => ({
      type: 'addSticker',
      id: `s${i}`,
      kind: 'star',
    }))
    expect(run(actions).stickers).toHaveLength(STICKER_LIMITS.maxCount)
  })

  it('원본 상태를 변경하지 않는다', () => {
    const state = createDefaultEditorState()
    const snapshot = structuredClone(state)
    run([
      { type: 'setText', field: 'title', value: 'x' },
      { type: 'addSticker', id: 'a', kind: 'star' },
      { type: 'updateTheme', patch: { frame: 'memo' } },
    ], state)
    expect(state).toEqual(snapshot)
  })
})
