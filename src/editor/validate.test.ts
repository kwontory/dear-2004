import { describe, expect, it } from 'vitest'
import {
  COMMENT_LIMITS,
  PHOTO_LIMITS,
  STICKER_LIMITS,
  TEXT_MAX_LENGTHS,
  COUNTER_MAX,
} from './constants'
import { createDefaultEditorState } from './defaults'
import { clamp, clampPhotoTransform } from './math'
import type { EditorState } from './types'
import { parseEditorStateJson, validateEditorState } from './validate'

// 1x1 투명 PNG
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

function fullState(): EditorState {
  const state = createDefaultEditorState()
  state.aspectRatio = '9:16'
  state.photo = {
    source: { dataUrl: TINY_PNG, width: 1, height: 1 },
    transform: { offsetX: 0.25, offsetY: -0.5, scale: 1.8, rotation: 15 },
    effect: 'faded',
    showDateStamp: false,
  }
  state.text.body = '방학 첫날.\n떡볶이 😀✨'
  state.theme = { background: 'pink-check', frame: 'diary', solidColor: '#123abc' }
  state.stickers = [
    { id: 's1', kind: 'sparkle-blue', x: 0.1, y: 0.9, size: 0.12, rotation: -20 },
    { id: 's2', kind: 'heart-pink', x: 0.5, y: 0.5, size: 0.2, rotation: 0 },
  ]
  state.comments = [
    { id: 'c1', author: '단짝♡', text: '헐 우리 사진이ㄷㅏ ㅋㅋㅋ' },
    { id: 'c2', author: '옆반친구', text: '퍼가요~♡' },
  ]
  return state
}

/** 상태를 JSON 호환 객체로 복제한 뒤 일부를 손상시키는 헬퍼 */
function mutated(mutate: (raw: Record<string, any>) => void): unknown {
  const raw = JSON.parse(JSON.stringify(fullState()))
  mutate(raw)
  return raw
}

function expectRejected(value: unknown, pathFragment?: string) {
  const result = validateEditorState(value)
  expect(result.ok).toBe(false)
  if (!result.ok && pathFragment) expect(result.error).toContain(pathFragment)
}

describe('createDefaultEditorState', () => {
  it('자기 자신의 검증을 통과한다', () => {
    const result = validateEditorState(createDefaultEditorState())
    expect(result).toEqual({ ok: true, state: createDefaultEditorState() })
  })

  it('호출마다 독립된 객체를 반환한다', () => {
    const a = createDefaultEditorState()
    a.stickers.push({ id: 'x', kind: 'sparkle-blue', x: 0, y: 0, size: 0.1, rotation: 0 })
    a.text.title = 'changed'
    const b = createDefaultEditorState()
    expect(b.stickers).toEqual([])
    expect(b.text.title).not.toBe('changed')
  })
})

describe('JSON round trip (TC-24)', () => {
  it('export → import 결과가 원본과 같다', () => {
    const original = fullState()
    const result = parseEditorStateJson(JSON.stringify(original))
    expect(result).toEqual({ ok: true, state: original })
  })

  it('알 수 없는 추가 필드는 버린다', () => {
    const result = validateEditorState(mutated((raw) => { raw.extra = 1; raw.theme.extra = 2 }))
    expect(result).toEqual({ ok: true, state: fullState() })
  })
})

describe('잘못된 JSON 거부 (TC-25 ~ TC-27)', () => {
  it('문법 오류 JSON', () => {
    expect(parseEditorStateJson('{"schemaVersion": 1,')).toEqual({
      ok: false,
      error: 'JSON 형식이 올바르지 않습니다',
    })
  })

  it.each([
    ['null', null],
    ['배열', []],
    ['문자열', 'hello'],
    ['숫자', 42],
    ['다른 schema', { name: 'other-app', items: [] }],
  ])('루트가 %s 이면 거부', (_label, value) => {
    expectRejected(value)
  })

  it.each([0, 2, '1', null, undefined])('지원하지 않는 schemaVersion %s', (version) => {
    expectRejected(mutated((raw) => { raw.schemaVersion = version }), 'schemaVersion')
  })

  it('허용되지 않은 화면비', () => {
    expectRejected(mutated((raw) => { raw.aspectRatio = '16:9' }), 'aspectRatio')
  })

  it('배열이어야 하는 stickers가 객체', () => {
    expectRejected(mutated((raw) => { raw.stickers = { 0: raw.stickers[0] } }), 'stickers')
  })

  it('필드 타입 오류', () => {
    expectRejected(mutated((raw) => { raw.text.title = 123 }), 'text.title')
    expectRejected(mutated((raw) => { raw.counter.visible = 'yes' }), 'counter.visible')
    expectRejected(mutated((raw) => { raw.photo.transform.scale = '2' }), 'photo.transform.scale')
    expectRejected(mutated((raw) => { delete raw.text.body }), 'text.body')
    expectRejected(mutated((raw) => { raw.theme = null }), 'theme')
  })

  it('NaN / Infinity 숫자를 거부한다', () => {
    // JSON 문자열로는 표현할 수 없지만 localStorage 손상·코드 경로로 들어올 수 있다
    expectRejected(mutated((raw) => { raw.photo.transform.scale = NaN }), 'scale')
    expectRejected(mutated((raw) => { raw.stickers[0].x = Infinity }), 'stickers[0].x')
    expectRejected(mutated((raw) => { raw.counter.total = -Infinity }), 'counter.total')
    // JSON에서 1e999는 Infinity로 파싱된다
    const json = JSON.stringify(fullState()).replace('"scale":1.8', '"scale":1e999')
    expect(parseEditorStateJson(json).ok).toBe(false)
  })

  it('너무 긴 문자열과 너무 많은 스티커를 거부한다', () => {
    expectRejected(
      mutated((raw) => { raw.text.body = 'a'.repeat(TEXT_MAX_LENGTHS.body + 1) }),
      'text.body',
    )
    expectRejected(
      mutated((raw) => {
        raw.stickers = Array.from({ length: STICKER_LIMITS.maxCount + 1 }, (_, i) => ({
          ...raw.stickers[0],
          id: `s${i}`,
        }))
      }),
      'stickers',
    )
  })

  it('스티커 kind / id 오류', () => {
    expectRejected(mutated((raw) => { raw.stickers[0].kind = 'skull' }), 'stickers[0].kind')
    // 에셋에 없는 스티커 종류는 허용하지 않는다
    expectRejected(mutated((raw) => { raw.stickers[0].kind = 'wingheart' }), 'stickers[0].kind')
    expectRejected(mutated((raw) => { raw.stickers[1].id = 's1' }), '중복')
    expectRejected(mutated((raw) => { raw.stickers[0].id = '' }), 'stickers[0].id')
  })
})

describe('단색 스킨 색', () => {
  it('없으면 기본색으로 채운다 (단색 스킨 이전에 저장한 데이터)', () => {
    const result = validateEditorState(mutated((raw) => { delete raw.theme.solidColor }))
    expect(result.ok && result.state.theme.solidColor).toBe('#f7d6e0')
  })

  it('대문자는 소문자로 맞춘다', () => {
    const result = validateEditorState(mutated((raw) => { raw.theme.background = 'solid'; raw.theme.solidColor = '#AABBCC' }))
    expect(result.ok && result.state.theme).toMatchObject({ background: 'solid', solidColor: '#aabbcc' })
  })

  it.each(['red', '#fff', '#12345g', 123, null, 'url(javascript:alert(1))'])('잘못된 색 %s 거부', (color) => {
    expectRejected(mutated((raw) => { raw.theme.solidColor = color }), 'theme.solidColor')
  })
})

describe('사진 효과 / 날짜 스탬프 / 댓글 검증', () => {
  it('알 수 없는 사진 효과와 잘못된 스탬프 타입을 거부한다', () => {
    expectRejected(mutated((raw) => { raw.photo.effect = 'sepia' }), 'photo.effect')
    expectRejected(mutated((raw) => { raw.photo.showDateStamp = 1 }), 'photo.showDateStamp')
    expectRejected(mutated((raw) => { delete raw.photo.effect }), 'photo.effect')
  })

  it('댓글 배열 / 필드 / 길이 / id 오류를 거부한다', () => {
    expectRejected(mutated((raw) => { delete raw.comments }), 'comments')
    expectRejected(mutated((raw) => { raw.comments = 'hi' }), 'comments')
    expectRejected(mutated((raw) => { raw.comments[0].text = null }), 'comments[0].text')
    expectRejected(
      mutated((raw) => { raw.comments[0].author = 'a'.repeat(COMMENT_LIMITS.maxAuthorLength + 1) }),
      'comments[0].author',
    )
    expectRejected(mutated((raw) => { raw.comments[1].id = 'c1' }), '중복')
    expectRejected(
      mutated((raw) => {
        raw.comments = Array.from({ length: COMMENT_LIMITS.maxCount + 1 }, (_, i) => ({
          id: `c${i}`, author: '', text: '',
        }))
      }),
      'comments',
    )
  })

  it('빈 닉네임·빈 댓글은 허용한다', () => {
    const result = validateEditorState(
      mutated((raw) => { raw.comments = [{ id: 'x', author: '', text: '' }] }),
    )
    expect(result.ok).toBe(true)
  })
})

describe('사진 source 검증', () => {
  it.each([
    ['SVG data URL', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='],
    ['GIF data URL', 'data:image/gif;base64,R0lGODlhAQABAAAAACw='],
    ['원격 URL', 'https://example.com/a.png'],
    ['javascript URL', 'javascript:alert(1)'],
    ['base64가 아닌 본문', 'data:image/png;base64,<script>alert(1)</script>'],
  ])('%s 거부', (_label, dataUrl) => {
    expectRejected(mutated((raw) => { raw.photo.source.dataUrl = dataUrl }), 'photo.source.dataUrl')
  })

  it.each([0, -1, 1.5, 10_000])('잘못된 크기 %s 거부', (width) => {
    expectRejected(mutated((raw) => { raw.photo.source.width = width }), 'photo.source.width')
  })

  it('source가 null이면 허용', () => {
    const result = validateEditorState(mutated((raw) => { raw.photo.source = null }))
    expect(result.ok && result.state.photo.source).toBeNull()
  })
})

describe('범위를 벗어난 유한 숫자는 보정한다', () => {
  it('사진 변환 / 스티커 / 카운터 clamp', () => {
    const result = validateEditorState(
      mutated((raw) => {
        raw.photo.transform = { offsetX: 99, offsetY: -99, scale: 1000, rotation: 720 }
        raw.stickers[0] = { ...raw.stickers[0], x: -5, y: 7, size: 0, rotation: -999 }
        raw.counter.today = -3
        raw.counter.total = 1e12
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.photo.transform).toEqual({
      offsetX: PHOTO_LIMITS.maxOffset,
      offsetY: -PHOTO_LIMITS.maxOffset,
      scale: PHOTO_LIMITS.maxScale,
      rotation: PHOTO_LIMITS.maxRotation,
    })
    expect(result.state.stickers[0]).toMatchObject({
      x: 0,
      y: 1,
      size: STICKER_LIMITS.minSize,
      rotation: -STICKER_LIMITS.maxRotation,
    })
    expect(result.state.counter).toMatchObject({ today: 0, total: COUNTER_MAX })
  })
})

describe('특수 문자 텍스트 (TC-14 ~ TC-16)', () => {
  it('HTML/이모지/한영 혼합 문자열을 그대로 보존한다', () => {
    const text = '< > & " \' / \\ { } [ ] <script>alert(1)</script>\n한글 English 123 😀😭⭐️💖✨🎵'
    const result = validateEditorState(mutated((raw) => { raw.text.body = text }))
    expect(result.ok && result.state.text.body).toBe(text)
  })
})

describe('clamp helpers', () => {
  it('NaN / Infinity는 fallback으로 대체한다', () => {
    expect(clamp(NaN, 0, 1, 0.5)).toBe(0.5)
    expect(clamp(Infinity, 0, 1, 0.5)).toBe(0.5)
    expect(clamp(-Infinity, 0, 1)).toBe(0)
  })

  it('clampPhotoTransform은 항상 유한한 값을 만든다 (TC-17)', () => {
    const t = clampPhotoTransform({ offsetX: NaN, offsetY: Infinity, scale: 0, rotation: NaN })
    expect(t).toEqual({ offsetX: 0, offsetY: 0, scale: PHOTO_LIMITS.minScale, rotation: 0 })
    Object.values(t).forEach((v) => expect(Number.isFinite(v)).toBe(true))
  })
})
