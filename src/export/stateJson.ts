import { PHOTO_SOURCE_LIMITS } from '../editor/constants'
import type { EditorState } from '../editor/types'
import { parseEditorStateJson, type ParseResult } from '../editor/validate'

/** JSON 파일 크기 상한: 사진 data URL 상한 + 여유 */
export const JSON_IMPORT_MAX_BYTES = PHOTO_SOURCE_LIMITS.maxDataUrlLength + 1024 * 1024

export function stateToJson(state: EditorState): string {
  return JSON.stringify(state, null, 2)
}

export function jsonFileName(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `dear2004-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}.json`
}

export type JsonImportResult = ParseResult | { ok: false; error: string; reason: 'too-large' | 'not-json-file' | 'read-failed' }

/** 파일을 읽어 검증까지 한다. 예외를 던지지 않는다 */
export async function readStateJsonFile(file: Pick<File, 'size' | 'name' | 'type' | 'text'>): Promise<JsonImportResult> {
  if (file.size > JSON_IMPORT_MAX_BYTES) {
    return { ok: false, reason: 'too-large', error: '파일이 너무 커요' }
  }
  const looksJson = file.type === '' || file.type === 'application/json' || file.type === 'text/plain' || /\.json$/i.test(file.name)
  if (!looksJson) return { ok: false, reason: 'not-json-file', error: 'JSON 파일이 아니에요' }
  let text: string
  try {
    text = await file.text()
  } catch {
    return { ok: false, reason: 'read-failed', error: '파일을 읽지 못했어요' }
  }
  return parseEditorStateJson(text)
}
