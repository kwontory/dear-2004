import { describe, expect, it } from 'vitest'
import { checkUploadFile, fitWithin, isWithinDecodeLimits } from './checkUploadFile'
import { UPLOAD_LIMITS } from './constants'
import { readImageDimensions, sniffImageType } from './imageHeader'
import { uploadErrorMessage } from './messages'

/** PNG 시그니처 + IHDR 청크 헤더 */
function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(33)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  bytes.set([0, 0, 0, 13], 8)
  bytes.set([0x49, 0x48, 0x44, 0x52], 12) // "IHDR"
  new DataView(bytes.buffer).setUint32(16, width)
  new DataView(bytes.buffer).setUint32(20, height)
  return bytes
}

/** SOI + APP0(JFIF) + 선택 세그먼트 + SOFn 헤더 */
function jpegHeader(width: number, height: number, sofMarker = 0xc0, extra: number[] = []): Uint8Array {
  const app0 = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0]
  const sof = [0xff, sofMarker, 0x00, 0x11, 8, height >> 8, height & 0xff, width >> 8, width & 0xff, 3]
  return new Uint8Array([0xff, 0xd8, ...app0, ...extra, ...sof, ...new Array(9).fill(0)])
}

const textBytes = (s: string) => new TextEncoder().encode(s)

describe('sniffImageType / readImageDimensions', () => {
  it('PNG와 JPEG를 매직 바이트로 판별한다', () => {
    expect(sniffImageType(pngHeader(10, 20))).toBe('image/png')
    expect(sniffImageType(jpegHeader(10, 20))).toBe('image/jpeg')
    expect(sniffImageType(textBytes('GIF89a....'))).toBeNull()
    expect(sniffImageType(textBytes('%PDF-1.7'))).toBeNull()
    expect(sniffImageType(new Uint8Array())).toBeNull()
  })

  it('PNG IHDR에서 크기를 읽는다', () => {
    expect(readImageDimensions(pngHeader(1920, 1080), 'image/png')).toEqual({ width: 1920, height: 1080 })
  })

  it('JPEG SOF0 / progressive SOF2에서 크기를 읽고, 앞의 세그먼트를 건너뛴다', () => {
    expect(readImageDimensions(jpegHeader(4000, 3000), 'image/jpeg')).toEqual({ width: 4000, height: 3000 })
    const dht = [0xff, 0xc4, 0x00, 0x04, 0x00, 0x00] // SOF가 아닌 C4는 건너뛴다
    expect(readImageDimensions(jpegHeader(640, 480, 0xc2, dht), 'image/jpeg')).toEqual({
      width: 640,
      height: 480,
    })
  })

  it('잘린 헤더는 null', () => {
    expect(readImageDimensions(pngHeader(10, 10).subarray(0, 20), 'image/png')).toBeNull()
    expect(readImageDimensions(new Uint8Array([0xff, 0xd8, 0xff]), 'image/jpeg')).toBeNull()
    expect(readImageDimensions(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]), 'image/jpeg')).toBeNull()
  })
})

describe('checkUploadFile', () => {
  const png = pngHeader(800, 600)
  const ok = (type: string, bytes: Uint8Array, size = bytes.length) => checkUploadFile({ type, size }, bytes)

  it('정상 PNG / JPEG (TC-01, TC-02)', () => {
    expect(ok('image/png', png)).toEqual({ ok: true, type: 'image/png', dimensions: { width: 800, height: 600 } })
    expect(ok('image/jpeg', jpegHeader(1200, 900))).toMatchObject({ ok: true, type: 'image/jpeg' })
  })

  it.each([
    ['application/pdf', 'PDF'], // TC-03
    ['image/gif', 'GIF'], // TC-04
    ['image/svg+xml', 'SVG'],
    ['text/html', 'HTML'],
    ['application/x-msdownload', undefined],
  ])('허용되지 않은 MIME %s 거부', (type, label) => {
    expect(ok(type, png)).toEqual({ ok: false, error: { code: 'unsupported-type', formatLabel: label } })
  })

  it('확장자만 바꾼 가짜 이미지 거부 (TC-05)', () => {
    expect(ok('image/jpeg', textBytes('<script>alert(1)</script>'))).toEqual({
      ok: false,
      error: { code: 'not-an-image' },
    })
    expect(ok('image/png', textBytes('GIF89a'))).toMatchObject({ error: { code: 'not-an-image' } })
  })

  it('MIME이 비어 있으면 실제 형식으로 판단한다', () => {
    expect(ok('', png)).toMatchObject({ ok: true, type: 'image/png' })
    expect(ok('', textBytes('hello'))).toMatchObject({ error: { code: 'not-an-image' } })
  })

  it('신고된 MIME과 실제 형식이 달라도 실제가 PNG/JPEG면 실제 형식을 쓴다', () => {
    expect(ok('image/png', jpegHeader(10, 10))).toMatchObject({ ok: true, type: 'image/jpeg' })
  })

  it('빈 파일 / 용량 초과', () => {
    expect(ok('image/png', new Uint8Array(), 0)).toMatchObject({ error: { code: 'empty-file' } })
    expect(ok('image/png', png, UPLOAD_LIMITS.maxFileBytes + 1)).toMatchObject({
      error: { code: 'file-too-large' },
    })
  })

  it('해상도가 너무 큰 이미지는 디코딩 전에 거부 (TC-06)', () => {
    expect(ok('image/png', pngHeader(UPLOAD_LIMITS.maxDimension + 1, 10))).toMatchObject({
      error: { code: 'dimensions-too-large' },
    })
    expect(ok('image/png', pngHeader(8000, 8000))).toMatchObject({ error: { code: 'dimensions-too-large' } })
    expect(ok('image/png', pngHeader(100_000, 100_000))).toMatchObject({
      error: { code: 'dimensions-too-large' },
    })
  })

  it('1x1 같은 아주 작은 이미지는 허용 (TC-07)', () => {
    expect(ok('image/png', pngHeader(1, 1))).toMatchObject({ ok: true, dimensions: { width: 1, height: 1 } })
  })

  it('크기 0 헤더는 거부', () => {
    expect(ok('image/png', pngHeader(0, 10))).toMatchObject({ error: { code: 'unreadable-header' } })
  })
})

describe('fitWithin', () => {
  it('긴 변을 기준으로 비율을 유지해 줄인다', () => {
    expect(fitWithin({ width: 4096, height: 2048 }, 2048)).toEqual({ width: 2048, height: 1024 })
    expect(fitWithin({ width: 1000, height: 3000 }, 2048)).toEqual({ width: 683, height: 2048 })
  })

  it('작은 이미지는 키우지 않는다', () => {
    expect(fitWithin({ width: 1, height: 1 })).toEqual({ width: 1, height: 1 })
  })

  it('극단적인 가로/세로 비율도 최소 1px을 유지한다 (TC-08, TC-09)', () => {
    expect(fitWithin({ width: 8192, height: 1 }, 2048)).toEqual({ width: 2048, height: 1 })
    expect(fitWithin({ width: 1, height: 8192 }, 2048)).toEqual({ width: 1, height: 2048 })
  })

  it('isWithinDecodeLimits 경계값', () => {
    expect(isWithinDecodeLimits({ width: UPLOAD_LIMITS.maxDimension, height: 1 })).toBe(true)
    expect(isWithinDecodeLimits({ width: UPLOAD_LIMITS.maxDimension + 1, height: 1 })).toBe(false)
  })
})

describe('uploadErrorMessage', () => {
  it('형식 이름을 넣고, 모르는 형식은 일반 문구를 쓴다', () => {
    expect(uploadErrorMessage({ code: 'unsupported-type', formatLabel: 'GIF' })).toContain('GIF 파일은')
    expect(uploadErrorMessage({ code: 'unsupported-type' })).toContain('이 파일은')
  })
})
