import { clampPhotoTransform } from '../editor/math'
import type { PhotoTransform } from '../editor/types'
import type { Rect } from './layout'

export interface PhotoPlacement {
  /** 사진 중심 (영역 좌표계) */
  centerX: number
  centerY: number
  /** 회전 전 그릴 크기 */
  drawWidth: number
  drawHeight: number
  /** 라디안 */
  rotation: number
}

/**
 * 사진을 영역에 cover로 맞춘 뒤 transform을 적용한 배치.
 * - scale 1 = 영역을 빈틈없이 덮는 최소 크기
 * - offset ±1 = 사진 중심이 영역 가장자리까지 이동
 * 입력이 비정상이어도 clamp를 거쳐 항상 유한한 값을 돌려준다.
 */
export function computePhotoPlacement(
  image: { width: number; height: number },
  area: Pick<Rect, 'width' | 'height'>,
  transform: PhotoTransform,
): PhotoPlacement {
  const t = clampPhotoTransform(transform)
  const imageWidth = Math.max(1, image.width)
  const imageHeight = Math.max(1, image.height)
  const coverScale = Math.max(area.width / imageWidth, area.height / imageHeight)
  const scale = coverScale * t.scale
  return {
    centerX: area.width / 2 + t.offsetX * (area.width / 2),
    centerY: area.height / 2 + t.offsetY * (area.height / 2),
    drawWidth: imageWidth * scale,
    drawHeight: imageHeight * scale,
    rotation: (t.rotation * Math.PI) / 180,
  }
}
