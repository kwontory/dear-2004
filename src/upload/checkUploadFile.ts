import { PHOTO_SOURCE_LIMITS } from '../editor/constants'
import { UPLOAD_LIMITS, type UploadMimeType } from './constants'
import { readImageDimensions, sniffImageType, type ImageDimensions } from './imageHeader'

export type UploadErrorCode =
  | 'unsupported-type'
  | 'empty-file'
  | 'file-too-large'
  | 'not-an-image'
  | 'unreadable-header'
  | 'dimensions-too-large'
  | 'decode-failed'
  | 'output-too-large'
  | 'read-failed'

export interface UploadError {
  code: UploadErrorCode
  /** 거부된 형식 이름 (예: GIF). unsupported-type일 때만 사용 */
  formatLabel?: string
}

export type UploadCheckResult =
  | { ok: true; type: UploadMimeType; dimensions: ImageDimensions }
  | { ok: false; error: UploadError }

export interface UploadFileInfo {
  /** 브라우저가 알려준 MIME. OS에 따라 빈 문자열일 수 있다. */
  type: string
  size: number
}

const KNOWN_FORMAT_LABELS: Record<string, string> = {
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
  'image/webp': 'WEBP',
  'image/heic': 'HEIC',
  'image/heif': 'HEIF',
  'image/bmp': 'BMP',
  'image/tiff': 'TIFF',
  'application/pdf': 'PDF',
  'text/html': 'HTML',
}

function isAllowedMime(type: string): type is UploadMimeType {
  return (PHOTO_SOURCE_LIMITS.mimeTypes as readonly string[]).includes(type)
}

/**
 * 디코딩 전 단계의 업로드 검증. 파일 전체(또는 앞부분) 바이트를 받아
 * MIME → 크기 → 실제 형식(매직 바이트) → 헤더 해상도 순으로 확인한다.
 */
export function checkUploadFile(file: UploadFileInfo, bytes: Uint8Array): UploadCheckResult {
  const declared = file.type.toLowerCase()
  if (declared !== '' && !isAllowedMime(declared)) {
    return { ok: false, error: { code: 'unsupported-type', formatLabel: KNOWN_FORMAT_LABELS[declared] } }
  }
  if (file.size === 0) return { ok: false, error: { code: 'empty-file' } }
  if (file.size > UPLOAD_LIMITS.maxFileBytes) return { ok: false, error: { code: 'file-too-large' } }

  // 신고된 MIME과 실제 형식이 달라도(예: .png로 저장된 JPEG) 실제 형식이 허용 목록이면 받는다
  const actual = sniffImageType(bytes)
  if (!actual) return { ok: false, error: { code: 'not-an-image' } }

  const dimensions = readImageDimensions(bytes, actual)
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    return { ok: false, error: { code: 'unreadable-header' } }
  }
  if (!isWithinDecodeLimits(dimensions)) {
    return { ok: false, error: { code: 'dimensions-too-large' } }
  }
  return { ok: true, type: actual, dimensions }
}

export function isWithinDecodeLimits({ width, height }: ImageDimensions): boolean {
  return (
    width <= UPLOAD_LIMITS.maxDimension &&
    height <= UPLOAD_LIMITS.maxDimension &&
    width * height <= UPLOAD_LIMITS.maxPixels
  )
}

/** 긴 변이 maxEdge를 넘으면 비율을 유지해 줄인다. 결과는 최소 1px 정수. */
export function fitWithin(
  { width, height }: ImageDimensions,
  maxEdge: number = UPLOAD_LIMITS.outputMaxEdge,
): ImageDimensions {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
