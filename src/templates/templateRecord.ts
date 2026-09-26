import type { EditorState } from '../editor/types'
import { validateEditorState } from '../editor/validate'

export const TEMPLATE_NAME_MAX = 30
export const TEMPLATE_ID_MAX = 64

/** 브라우저에 저장되는 사용자 템플릿. state는 EditorState 전체다 */
export interface TemplateRecord {
  id: string
  name: string
  /** epoch ms */
  createdAt: number
  updatedAt: number
  state: EditorState
}

/** 앞뒤 공백을 지우고 길이를 확인한다. 비어 있거나 너무 길면 null */
export function normalizeTemplateName(raw: string): string | null {
  const name = raw.replace(/\s+/g, ' ').trim()
  if (name === '' || name.length > TEMPLATE_NAME_MAX) return null
  return name
}

export function newTemplateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export function createTemplateRecord(name: string, state: EditorState, now: number, id = newTemplateId()): TemplateRecord {
  // state를 복제해 두어야 이후 편집이 저장본을 바꾸지 않는다
  return { id, name, createdAt: now, updatedAt: now, state: structuredClone(state) }
}

const isFiniteTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

/**
 * 저장소에서 읽은 값을 검증한다. 구조가 틀리거나 state가 EditorState 검증을 통과하지 못하면 null.
 * (다른 탭·구버전·손상된 데이터가 앱을 멈추지 않게)
 */
export function parseTemplateRecord(value: unknown): TemplateRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const obj = value as Record<string, unknown>
  if (typeof obj.id !== 'string' || obj.id === '' || obj.id.length > TEMPLATE_ID_MAX) return null
  if (typeof obj.name !== 'string') return null
  const name = normalizeTemplateName(obj.name)
  if (!name) return null
  if (!isFiniteTime(obj.createdAt) || !isFiniteTime(obj.updatedAt)) return null
  const result = validateEditorState(obj.state)
  if (!result.ok) return null
  return { id: obj.id, name, createdAt: obj.createdAt, updatedAt: obj.updatedAt, state: result.state }
}

/** 최근 수정 순 */
export function sortTemplates(records: readonly TemplateRecord[]): TemplateRecord[] {
  return [...records].sort((a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name, 'ko'))
}
