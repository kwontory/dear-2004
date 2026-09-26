import { COUNTER_MAX, PHOTO_LIMITS, STICKER_LIMITS } from './constants'
import type { PhotoTransform, Sticker } from './types'

/** 유한한 숫자를 [min, max]로 제한한다. NaN/Infinity는 fallback으로 대체한다. */
export function clamp(value: number, min: number, max: number, fallback = min): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

export function clampPhotoTransform(t: PhotoTransform): PhotoTransform {
  const { minScale, maxScale, maxOffset, maxRotation } = PHOTO_LIMITS
  return {
    offsetX: clamp(t.offsetX, -maxOffset, maxOffset, 0),
    offsetY: clamp(t.offsetY, -maxOffset, maxOffset, 0),
    scale: clamp(t.scale, minScale, maxScale, 1),
    rotation: clamp(t.rotation, -maxRotation, maxRotation, 0),
  }
}

export function clampSticker(s: Sticker): Sticker {
  const { minSize, maxSize, maxRotation } = STICKER_LIMITS
  return {
    ...s,
    x: clamp(s.x, 0, 1, 0.5),
    y: clamp(s.y, 0, 1, 0.5),
    size: clamp(s.size, minSize, maxSize, minSize),
    rotation: clamp(s.rotation, -maxRotation, maxRotation, 0),
  }
}

export function clampCounterValue(value: number): number {
  return Math.round(clamp(value, 0, COUNTER_MAX, 0))
}
