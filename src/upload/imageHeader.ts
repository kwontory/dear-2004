import type { UploadMimeType } from './constants'

export interface ImageDimensions {
  width: number
  height: number
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** 파일 앞부분(매직 바이트)으로 실제 형식을 판별한다. 확장자·MIME은 믿지 않는다. */
export function sniffImageType(bytes: Uint8Array): UploadMimeType | null {
  if (bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((b, i) => bytes[i] === b)) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  return null
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  )
}

/** PNG: 시그니처 뒤 첫 청크가 IHDR이고 그 안에 width/height가 있다. */
function readPngDimensions(bytes: Uint8Array): ImageDimensions | null {
  const IHDR_OFFSET = 8
  if (bytes.length < IHDR_OFFSET + 16) return null
  const chunkType = String.fromCharCode(...bytes.subarray(IHDR_OFFSET + 4, IHDR_OFFSET + 8))
  if (chunkType !== 'IHDR') return null
  return { width: readUint32(bytes, IHDR_OFFSET + 8), height: readUint32(bytes, IHDR_OFFSET + 12) }
}

/** SOF 마커(프레임 헤더): baseline/progressive 등. DHT(C4), JPG(C8), DAC(CC)는 제외. */
function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
}

/** JPEG: 세그먼트를 따라가며 SOF 마커에서 height/width를 읽는다. */
function readJpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  let offset = 2 // SOI 다음
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1]
    // 채움 바이트(0xFF 연속)는 건너뛴다
    if (marker === 0xff) {
      offset += 1
      continue
    }
    // 길이 필드가 없는 마커
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }
    // 이미지 데이터 시작/끝까지 SOF를 못 찾으면 실패
    if (marker === 0xda || marker === 0xd9) return null

    const length = readUint16(bytes, offset + 2)
    if (length < 2) return null
    if (isStartOfFrame(marker)) {
      if (offset + 9 > bytes.length) return null
      return { height: readUint16(bytes, offset + 5), width: readUint16(bytes, offset + 7) }
    }
    offset += 2 + length
  }
  return null
}

export function readImageDimensions(
  bytes: Uint8Array,
  type: UploadMimeType,
): ImageDimensions | null {
  return type === 'image/png' ? readPngDimensions(bytes) : readJpegDimensions(bytes)
}
