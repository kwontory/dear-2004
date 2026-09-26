import { describe, expect, it } from 'vitest'
import { PHOTO_LIMITS } from './constants'
import { fromSliderValue, PHOTO_SLIDERS, toSliderValue } from './photoControls'

const t = { offsetX: -0.254, offsetY: 0.5, scale: 1.2, rotation: 15.4 }

describe('photo slider 변환', () => {
  it('상태 → 슬라이더 정수', () => {
    expect(toSliderValue('scale', t)).toBe(120)
    expect(toSliderValue('offsetX', t)).toBe(-25)
    expect(toSliderValue('offsetY', t)).toBe(50)
    expect(toSliderValue('rotation', t)).toBe(15)
  })

  it('슬라이더 → 상태 patch', () => {
    expect(fromSliderValue('scale', '250')).toEqual({ scale: 2.5 })
    expect(fromSliderValue('offsetY', -100)).toEqual({ offsetY: -1 })
    expect(fromSliderValue('rotation', '-90')).toEqual({ rotation: -90 })
  })

  it('숫자가 아니면 null', () => {
    expect(fromSliderValue('scale', '')).toBeNull()
    expect(fromSliderValue('scale', 'abc')).toBeNull()
    expect(fromSliderValue('scale', NaN)).toBeNull()
  })

  it('슬라이더 범위가 PHOTO_LIMITS와 일치한다', () => {
    const scale = PHOTO_SLIDERS.find((s) => s.key === 'scale')!
    expect(fromSliderValue('scale', scale.min)).toEqual({ scale: PHOTO_LIMITS.minScale })
    expect(fromSliderValue('scale', scale.max)).toEqual({ scale: PHOTO_LIMITS.maxScale })
    const rotation = PHOTO_SLIDERS.find((s) => s.key === 'rotation')!
    expect([rotation.min, rotation.max]).toEqual([-PHOTO_LIMITS.maxRotation, PHOTO_LIMITS.maxRotation])
  })
})
