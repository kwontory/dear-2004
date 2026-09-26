import { PHOTO_SOURCE_LIMITS } from '../editor/constants'

export type UploadMimeType = (typeof PHOTO_SOURCE_LIMITS.mimeTypes)[number]

export const UPLOAD_LIMITS = {
  /** 업로드 파일 크기 상한 */
  maxFileBytes: 10 * 1024 * 1024,
  /** 원본 가로/세로 상한. EditorState 검증과 같은 값을 쓴다. */
  maxDimension: PHOTO_SOURCE_LIMITS.maxDimension,
  /** 원본 픽셀 수 상한. 디코딩 중 브라우저가 멈추지 않도록 헤더 단계에서 거른다. */
  maxPixels: 40_000_000,
  /** 저장용으로 줄일 긴 변 길이. 1080px export의 약 2배. */
  outputMaxEdge: 2048,
  jpegQuality: 0.9,
} as const
