import { describe, expect, it } from 'vitest'
import { createDefaultEditorState } from '../editor/defaults'
import { JSON_IMPORT_MAX_BYTES, jsonFileName, readStateJsonFile, stateToJson } from './stateJson'

const file = (text: string, name = 'card.json', type = 'application/json', size = text.length) => ({
  name,
  type,
  size,
  text: async () => text,
})

describe('JSON export / import', () => {
  it('TC-23/24 내보낸 JSON을 다시 읽으면 같은 상태', async () => {
    const state = createDefaultEditorState()
    state.aspectRatio = '9:16'
    state.text.body = '안녕 😀\n<script>'
    state.stickers = [{ id: 's', kind: 'moon', x: 0.1, y: 0.2, size: 0.1, rotation: 3 }]
    expect(await readStateJsonFile(file(stateToJson(state)))).toEqual({ ok: true, state })
  })

  it('TC-25 문법이 틀린 JSON 거부', async () => {
    const r = await readStateJsonFile(file('{"schemaVersion":1,'))
    expect(r.ok).toBe(false)
  })

  it('TC-26 다른 형식의 JSON 거부', async () => {
    const r = await readStateJsonFile(file('{"name":"other app","items":[1,2]}'))
    expect(r).toMatchObject({ ok: false })
  })

  it('TC-27 지원하지 않는 버전 거부', async () => {
    const state = { ...createDefaultEditorState(), schemaVersion: 2 }
    const r = await readStateJsonFile(file(JSON.stringify(state)))
    expect(r.ok === false && r.error).toContain('schemaVersion')
  })

  it('너무 큰 파일 / JSON이 아닌 파일 거부', async () => {
    expect(await readStateJsonFile(file('{}', 'a.json', 'application/json', JSON_IMPORT_MAX_BYTES + 1))).toMatchObject({
      ok: false,
      reason: 'too-large',
    })
    expect(await readStateJsonFile(file('{}', 'a.png', 'image/png'))).toMatchObject({ ok: false, reason: 'not-json-file' })
  })

  it('파일 이름', () => {
    expect(jsonFileName(new Date(2004, 9, 27, 3, 4, 5))).toBe('dear2004-20041027-030405.json')
  })
})
