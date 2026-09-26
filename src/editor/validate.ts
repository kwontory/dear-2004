import {
  ASPECT_RATIOS,
  BACKGROUND_IDS,
  FRAME_IDS,
  PHOTO_SOURCE_LIMITS,
  SCHEMA_VERSION,
  STICKER_KINDS,
  STICKER_LIMITS,
  TEXT_MAX_LENGTHS,
} from './constants'
import { clampCounterValue, clampPhotoTransform, clampSticker } from './math'
import type {
  CardText,
  EditorState,
  PhotoLayer,
  PhotoSource,
  Sticker,
  TextFieldKey,
  VisitCounter,
} from './types'

/**
 * 외부에서 들어온 값(JSON import, 저장된 템플릿)을 EditorState로 검증한다.
 *
 * 정책:
 * - 타입이 틀리거나, 필드가 없거나, NaN/Infinity이거나, 허용되지 않은 enum 값이면 거부
 * - 문자열/배열이 상한을 넘으면 거부 (손상되었거나 악의적인 입력으로 간주)
 * - 유한한 숫자가 범위를 벗어나면 편집기와 같은 clamp 규칙으로 보정
 * - 알 수 없는 추가 필드는 버린다
 */
export type ParseResult = { ok: true; state: EditorState } | { ok: false; error: string }

class ValidationError extends Error {}

type UnknownRecord = Record<string, unknown>

function fail(path: string, message: string): never {
  throw new ValidationError(`${path}: ${message}`)
}

function readObject(value: unknown, path: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, '객체여야 합니다')
  }
  return value as UnknownRecord
}

function readArray(value: unknown, path: string, maxLength: number): unknown[] {
  if (!Array.isArray(value)) fail(path, '배열이어야 합니다')
  if (value.length > maxLength) fail(path, `최대 ${maxLength}개까지 허용됩니다`)
  return value
}

function readString(value: unknown, path: string, maxLength: number): string {
  if (typeof value !== 'string') fail(path, '문자열이어야 합니다')
  if (value.length > maxLength) fail(path, `최대 ${maxLength}자까지 허용됩니다`)
  return value
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(path, '유한한 숫자여야 합니다')
  }
  return value
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'true 또는 false여야 합니다')
  return value
}

function readEnum<T extends string>(value: unknown, path: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    fail(path, `허용되지 않은 값입니다 (${allowed.join(', ')})`)
  }
  return value as T
}

const BASE64_BODY = /^[A-Za-z0-9+/]+={0,2}$/

function readPhotoSource(value: unknown, path: string): PhotoSource | null {
  if (value === null) return null
  const obj = readObject(value, path)

  const dataUrl = readString(obj.dataUrl, `${path}.dataUrl`, PHOTO_SOURCE_LIMITS.maxDataUrlLength)
  const isAllowedType = PHOTO_SOURCE_LIMITS.mimeTypes.some((mime) =>
    dataUrl.startsWith(`data:${mime};base64,`),
  )
  if (!isAllowedType) fail(`${path}.dataUrl`, 'PNG 또는 JPEG data URL만 허용됩니다')
  const body = dataUrl.slice(dataUrl.indexOf(',') + 1)
  if (!BASE64_BODY.test(body)) fail(`${path}.dataUrl`, '올바른 base64 데이터가 아닙니다')

  const readDimension = (v: unknown, p: string): number => {
    const n = readNumber(v, p)
    if (!Number.isInteger(n) || n < 1 || n > PHOTO_SOURCE_LIMITS.maxDimension) {
      fail(p, `1~${PHOTO_SOURCE_LIMITS.maxDimension} 사이의 정수여야 합니다`)
    }
    return n
  }

  return {
    dataUrl,
    width: readDimension(obj.width, `${path}.width`),
    height: readDimension(obj.height, `${path}.height`),
  }
}

function readPhoto(value: unknown, path: string): PhotoLayer {
  const obj = readObject(value, path)
  const t = readObject(obj.transform, `${path}.transform`)
  return {
    source: readPhotoSource(obj.source, `${path}.source`),
    transform: clampPhotoTransform({
      offsetX: readNumber(t.offsetX, `${path}.transform.offsetX`),
      offsetY: readNumber(t.offsetY, `${path}.transform.offsetY`),
      scale: readNumber(t.scale, `${path}.transform.scale`),
      rotation: readNumber(t.rotation, `${path}.transform.rotation`),
    }),
  }
}

function readText(value: unknown, path: string): CardText {
  const obj = readObject(value, path)
  const keys = Object.keys(TEXT_MAX_LENGTHS) as TextFieldKey[]
  return Object.fromEntries(
    keys.map((key) => [key, readString(obj[key], `${path}.${key}`, TEXT_MAX_LENGTHS[key])]),
  ) as CardText
}

function readCounter(value: unknown, path: string): VisitCounter {
  const obj = readObject(value, path)
  return {
    visible: readBoolean(obj.visible, `${path}.visible`),
    today: clampCounterValue(readNumber(obj.today, `${path}.today`)),
    total: clampCounterValue(readNumber(obj.total, `${path}.total`)),
  }
}

function readStickers(value: unknown, path: string): Sticker[] {
  const list = readArray(value, path, STICKER_LIMITS.maxCount)
  const seenIds = new Set<string>()

  return list.map((item, index) => {
    const p = `${path}[${index}]`
    const obj = readObject(item, p)
    const id = readString(obj.id, `${p}.id`, STICKER_LIMITS.maxIdLength)
    if (id.length === 0) fail(`${p}.id`, '비어 있을 수 없습니다')
    if (seenIds.has(id)) fail(`${p}.id`, '중복된 id입니다')
    seenIds.add(id)

    return clampSticker({
      id,
      kind: readEnum(obj.kind, `${p}.kind`, STICKER_KINDS),
      x: readNumber(obj.x, `${p}.x`),
      y: readNumber(obj.y, `${p}.y`),
      size: readNumber(obj.size, `${p}.size`),
      rotation: readNumber(obj.rotation, `${p}.rotation`),
    })
  })
}

/** 이미 파싱된 값(unknown)을 EditorState로 검증한다. 예외를 밖으로 던지지 않는다. */
export function validateEditorState(value: unknown): ParseResult {
  try {
    const root = readObject(value, 'root')

    if (root.schemaVersion !== SCHEMA_VERSION) {
      // 문자열 버전 등 타입이 다른 경우도 함께 거부
      fail('schemaVersion', `지원하지 않는 버전입니다 (지원: ${SCHEMA_VERSION})`)
    }

    const theme = readObject(root.theme, 'theme')

    return {
      ok: true,
      state: {
        schemaVersion: SCHEMA_VERSION,
        aspectRatio: readEnum(root.aspectRatio, 'aspectRatio', ASPECT_RATIOS),
        photo: readPhoto(root.photo, 'photo'),
        text: readText(root.text, 'text'),
        counter: readCounter(root.counter, 'counter'),
        theme: {
          background: readEnum(theme.background, 'theme.background', BACKGROUND_IDS),
          frame: readEnum(theme.frame, 'theme.frame', FRAME_IDS),
        },
        stickers: readStickers(root.stickers, 'stickers'),
      },
    }
  } catch (error) {
    if (error instanceof ValidationError) return { ok: false, error: error.message }
    return { ok: false, error: '알 수 없는 검증 오류가 발생했습니다' }
  }
}

/** JSON 문자열을 파싱하고 검증한다. 문법 오류도 ParseResult로 돌려준다. */
export function parseEditorStateJson(json: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'JSON 형식이 올바르지 않습니다' }
  }
  return validateEditorState(parsed)
}
