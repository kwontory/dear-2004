import { describe, expect, it } from 'vitest'
import { createDefaultEditorState } from '../editor/defaults'
import {
  createTemplateRecord,
  normalizeTemplateName,
  parseTemplateRecord,
  sortTemplates,
  TEMPLATE_NAME_MAX,
} from './templateRecord'
import { createMemoryTemplateStore } from './templateStore'

const state = () => {
  const s = createDefaultEditorState()
  s.aspectRatio = '4:5'
  s.text.body = '방학 첫날 😀'
  s.stickers = [{ id: 's1', kind: 'heart-pink', x: 0.2, y: 0.3, size: 0.1, rotation: 5 }]
  s.comments = [{ id: 'c1', author: '단짝♡', text: '퍼가요~♡' }]
  return s
}

describe('normalizeTemplateName', () => {
  it('공백 정리 / 빈 이름·너무 긴 이름 거부', () => {
    expect(normalizeTemplateName('  여름   방학  ')).toBe('여름 방학')
    expect(normalizeTemplateName('   ')).toBeNull()
    expect(normalizeTemplateName('가'.repeat(TEMPLATE_NAME_MAX))).toHaveLength(TEMPLATE_NAME_MAX)
    expect(normalizeTemplateName('가'.repeat(TEMPLATE_NAME_MAX + 1))).toBeNull()
  })
})

describe('TemplateRecord', () => {
  it('EditorState 전체를 복제해 저장한다 (TC-19)', () => {
    const s = state()
    const record = createTemplateRecord('여름', s, 1000, 'id1')
    s.text.body = '바뀜'
    s.stickers.pop()
    expect(record.state.text.body).toBe('방학 첫날 😀')
    expect(record.state.stickers).toHaveLength(1)
    expect(parseTemplateRecord(JSON.parse(JSON.stringify(record)))).toEqual(record)
  })

  it.each([
    ['null', null],
    ['배열', []],
    ['id 없음', { name: 'a', createdAt: 1, updatedAt: 1, state: createDefaultEditorState() }],
    ['이름 빈칸', { id: 'x', name: ' ', createdAt: 1, updatedAt: 1, state: createDefaultEditorState() }],
    ['시간 NaN', { id: 'x', name: 'a', createdAt: NaN, updatedAt: 1, state: createDefaultEditorState() }],
    ['state 손상', { id: 'x', name: 'a', createdAt: 1, updatedAt: 1, state: { schemaVersion: 99 } }],
  ])('손상된 기록 거부: %s', (_label, value) => {
    expect(parseTemplateRecord(value)).toBeNull()
  })

  it('최근 수정 순으로 정렬', () => {
    const a = createTemplateRecord('a', state(), 1, 'a')
    const b = { ...createTemplateRecord('b', state(), 1, 'b'), updatedAt: 5 }
    expect(sortTemplates([a, b]).map((r) => r.id)).toEqual(['b', 'a'])
  })
})

describe('memory TemplateStore (CRUD)', () => {
  it('생성 / 목록 / 수정 / 삭제 (TC-19 ~ TC-22)', async () => {
    const store = createMemoryTemplateStore()
    const record = createTemplateRecord('여름', state(), 1, 'id1')
    await store.put(record)
    expect((await store.list()).records).toEqual([record])

    const updated = { ...record, name: '여름방학', updatedAt: 2, state: { ...record.state, aspectRatio: '9:16' as const } }
    await store.put(updated)
    const { records } = await store.list()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ name: '여름방학', updatedAt: 2 })
    expect(records[0].state.aspectRatio).toBe('9:16')

    await store.remove('id1')
    expect((await store.list()).records).toEqual([])
  })

  it('손상된 기록은 건너뛰고 개수를 알려준다', async () => {
    const store = createMemoryTemplateStore()
    await store.put(createTemplateRecord('ok', state(), 1, 'ok'))
    await store.put({ id: 'bad', name: 'bad', createdAt: 1, updatedAt: 1, state: { broken: true } } as never)
    const result = await store.list()
    expect(result.records.map((r) => r.id)).toEqual(['ok'])
    expect(result.skipped).toBe(1)
  })
})
