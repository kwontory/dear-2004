import { PHOTO_SOURCE_LIMITS } from '../editor/constants'
import type { PhotoSource } from '../editor/types'
import { checkUploadFile, fitWithin, isWithinDecodeLimits, type UploadError } from './checkUploadFile'
import { UPLOAD_LIMITS } from './constants'

export type UploadResult = { ok: true; source: PhotoSource } | { ok: false; error: UploadError }

async function readBytes(file: File): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    return new Uint8Array(await file.arrayBuffer())
  } catch {
    return null
  }
}

async function decode(blob: Blob): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(blob)
  } catch {
    return null
  }
}

/**
 * 업로드 파일을 검증하고, 실제로 디코딩한 뒤 저장용 크기로 줄여 PhotoSource를 만든다.
 * 어떤 입력이 와도 예외를 던지지 않고 UploadResult를 돌려준다.
 */
export async function processUpload(file: File): Promise<UploadResult> {
  const bytes = await readBytes(file)
  if (!bytes) return { ok: false, error: { code: 'read-failed' } }

  const check = checkUploadFile({ type: file.type, size: file.size }, bytes)
  if (!check.ok) return check

  // 실제 형식의 MIME으로 다시 감싸서 디코딩한다
  const bitmap = await decode(new Blob([bytes], { type: check.type }))
  if (!bitmap) return { ok: false, error: { code: 'decode-failed' } }

  try {
    // EXIF 회전 반영 후 크기가 헤더와 다를 수 있으므로 다시 확인한다
    const decoded = { width: bitmap.width, height: bitmap.height }
    if (decoded.width < 1 || decoded.height < 1) return { ok: false, error: { code: 'decode-failed' } }
    if (!isWithinDecodeLimits(decoded)) return { ok: false, error: { code: 'dimensions-too-large' } }

    const size = fitWithin(decoded)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return { ok: false, error: { code: 'decode-failed' } }
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, size.width, size.height)

    // PNG는 투명도를 지키기 위해 PNG로, JPEG는 JPEG로 다시 저장한다
    const dataUrl =
      check.type === 'image/png'
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', UPLOAD_LIMITS.jpegQuality)
    if (dataUrl.length > PHOTO_SOURCE_LIMITS.maxDataUrlLength) {
      return { ok: false, error: { code: 'output-too-large' } }
    }
    return { ok: true, source: { dataUrl, width: size.width, height: size.height } }
  } finally {
    bitmap.close()
  }
}
