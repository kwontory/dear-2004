import type { PhotoEffect } from '../editor/types'

/**
 * 사진 효과 수치. 픽셀을 직접 계산하므로 브라우저마다 결과가 같다.
 * - soft(뽀샤시): 밝게 들어올리고 살짝 탈색 + 흐린 사본을 screen으로 겹쳐 빛 번짐
 * - faded(빛바램): 채도 낮추고 크림빛으로 바램
 * - mono(흑백): 회색조 + 검정을 살짝 들어올림
 */
export const EFFECT_PARAMS = {
  soft: { lift: 30, gain: 0.88, saturation: 0.92, bloomAlpha: 0.45, bloomDownscale: 8, haze: 0.06 },
  faded: { saturation: 0.6, gain: [0.84, 0.8, 0.72], lift: [38, 38, 41] },
  mono: { gain: 0.9, lift: 18 },
} as const

function saturate(r: number, g: number, b: number, amount: number): [number, number, number] {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b
  return [gray + (r - gray) * amount, gray + (g - gray) * amount, gray + (b - gray) * amount]
}

/** RGBA 픽셀 배열에 색 효과를 제자리 적용한다. 알파는 건드리지 않는다. */
export function applyColorEffect(data: Uint8ClampedArray, effect: PhotoEffect): void {
  if (effect === 'original') return
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]
    if (effect === 'soft') {
      const p = EFFECT_PARAMS.soft
      ;[r, g, b] = saturate(r, g, b, p.saturation)
      r = r * p.gain + p.lift
      g = g * p.gain + p.lift
      b = b * p.gain + p.lift
    } else if (effect === 'faded') {
      const p = EFFECT_PARAMS.faded
      ;[r, g, b] = saturate(r, g, b, p.saturation)
      r = r * p.gain[0] + p.lift[0]
      g = g * p.gain[1] + p.lift[1]
      b = b * p.gain[2] + p.lift[2]
    } else {
      const p = EFFECT_PARAMS.mono
      const gray = (0.299 * r + 0.587 * g + 0.114 * b) * p.gain + p.lift
      r = g = b = gray
    }
    // Uint8ClampedArray가 0~255 범위와 반올림을 처리한다
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}
