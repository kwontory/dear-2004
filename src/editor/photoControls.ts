import { PHOTO_LIMITS } from './constants'
import type { PhotoTransform } from './types'

/**
 * 사진 조절 슬라이더 ↔ PhotoTransform 변환.
 * 슬라이더는 사람이 읽기 쉬운 정수 단위(%, 도)를 쓰고, 상태는 비율을 쓴다.
 */
export type PhotoSliderKey = keyof PhotoTransform

export interface PhotoSliderSpec {
  key: PhotoSliderKey
  label: string
  min: number
  max: number
  unit: string
}

const PERCENT = 100

export const PHOTO_SLIDERS: readonly PhotoSliderSpec[] = [
  { key: 'scale', label: '확대', min: PHOTO_LIMITS.minScale * PERCENT, max: PHOTO_LIMITS.maxScale * PERCENT, unit: '%' },
  { key: 'offsetX', label: '좌우', min: -PHOTO_LIMITS.maxOffset * PERCENT, max: PHOTO_LIMITS.maxOffset * PERCENT, unit: '' },
  { key: 'offsetY', label: '위아래', min: -PHOTO_LIMITS.maxOffset * PERCENT, max: PHOTO_LIMITS.maxOffset * PERCENT, unit: '' },
  { key: 'rotation', label: '회전', min: -PHOTO_LIMITS.maxRotation, max: PHOTO_LIMITS.maxRotation, unit: '°' },
]

/** 상태 값 → 슬라이더 정수 값 */
export function toSliderValue(key: PhotoSliderKey, transform: PhotoTransform): number {
  const value = transform[key]
  return Math.round(key === 'rotation' ? value : value * PERCENT)
}

/** 슬라이더 값(문자열일 수 있음) → 상태 patch. 숫자가 아니면 null */
export function fromSliderValue(key: PhotoSliderKey, raw: string | number): Partial<PhotoTransform> | null {
  // Number('')는 0이 되므로 빈 문자열은 따로 거른다
  if (typeof raw === 'string' && raw.trim() === '') return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return null
  return { [key]: key === 'rotation' ? n : n / PERCENT }
}
