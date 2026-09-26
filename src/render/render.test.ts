import { describe, expect, it } from 'vitest'
import { ASPECT_RATIOS, CANVAS_SIZES, COMMENT_LIMITS, FRAME_IDS, PHOTO_LIMITS } from '../editor/constants'
import { createDefaultEditorState } from '../editor/defaults'
import { buildStampPolygons, formatStampText, STAMP_GEOMETRY, stampWidth } from './dateStamp'
import { computeLayout } from './layout'
import { applyColorEffect } from './photoEffects'
import { computePhotoPlacement } from './photoPlacement'

const identity = { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }

describe('computeLayout', () => {
  const inside = (r: { x: number; y: number; width: number; height: number }, w: number, h: number) =>
    r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= w + 0.5 && r.y + r.height <= h + 0.5

  const variants = ASPECT_RATIOS.flatMap((ratio) =>
    FRAME_IDS.flatMap((frame) => [false, true].map((busy) => [ratio, frame, busy] as const)),
  )

  it.each(variants)('%s / %s / 댓글·서명 많음=%s: 영역이 카드 안에 있다', (ratio, frame, busy) => {
    const state = createDefaultEditorState()
    state.aspectRatio = ratio
    state.theme.frame = frame
    if (busy) {
      state.text.signature = '★나야나★'
      state.text.bgm = '노래'
      state.comments = Array.from({ length: COMMENT_LIMITS.maxCount }, (_, i) => ({ id: `c${i}`, author: 'a', text: 'b' }))
    }
    const layout = computeLayout(state)
    expect(layout).toMatchObject(CANVAS_SIZES[ratio])
    expect(layout.frame).toBe(frame)
    expect(inside(layout.photo, layout.width, layout.height)).toBe(true)
    expect(layout.stampHeight).toBeGreaterThanOrEqual(14)
    expect(layout.stampHeight).toBeLessThanOrEqual(26)
    if (layout.frame === 'minihome') {
      expect(inside(layout.profilePhoto, layout.width, layout.height)).toBe(true)
      expect(layout.profileText.maxLines).toBeGreaterThanOrEqual(0)
      // 사진이 댓글 줄과 겹치지 않는다
      expect(layout.photoBox.y + layout.photoBox.height).toBeLessThanOrEqual(layout.comments.y)
    }
    if (layout.frame === 'album') {
      expect(layout.photoBox.y + layout.photoBox.height).toBeLessThanOrEqual(layout.body.y)
      expect(layout.body.y + layout.body.height).toBeLessThanOrEqual(layout.footer.lineY)
    }
    if (layout.frame === 'memo' || layout.frame === 'diary') {
      expect(layout.body.maxLines).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('computePhotoPlacement', () => {
  const area = { width: 1080, height: 636 }

  it('scale 1이면 영역을 빈틈없이 덮는다 (cover)', () => {
    const wide = computePhotoPlacement({ width: 4000, height: 1000 }, area, identity)
    expect(wide.drawHeight).toBeCloseTo(area.height)
    expect(wide.drawWidth).toBeGreaterThanOrEqual(area.width)
    const tall = computePhotoPlacement({ width: 500, height: 3000 }, area, identity)
    expect(tall.drawWidth).toBeCloseTo(area.width)
    expect(tall.drawHeight).toBeGreaterThanOrEqual(area.height)
    expect([wide.centerX, wide.centerY]).toEqual([540, 318])
  })

  it('offset ±1은 사진 중심을 영역 가장자리로 옮긴다', () => {
    const p = computePhotoPlacement({ width: 100, height: 100 }, area, { ...identity, offsetX: 1, offsetY: -1 })
    expect([p.centerX, p.centerY]).toEqual([1080, 0])
  })

  it('회전은 라디안으로 바꾼다', () => {
    expect(computePhotoPlacement({ width: 1, height: 1 }, area, { ...identity, rotation: 90 }).rotation).toBeCloseTo(
      Math.PI / 2,
    )
  })

  it('극단 입력에도 유한한 값을 낸다 (TC-17)', () => {
    const cases = [
      computePhotoPlacement({ width: 0, height: 0 }, area, { offsetX: NaN, offsetY: Infinity, scale: 0, rotation: NaN }),
      computePhotoPlacement({ width: 8192, height: 1 }, area, { ...identity, scale: 1e9 }),
      computePhotoPlacement({ width: 1, height: 8192 }, area, { ...identity, scale: -5 }),
    ]
    for (const p of cases) Object.values(p).forEach((v) => expect(Number.isFinite(v)).toBe(true))
    // scale은 PHOTO_LIMITS로 제한된다
    const max = computePhotoPlacement({ width: 100, height: 100 }, area, { ...identity, scale: 1e9 })
    expect(max.drawWidth).toBeCloseTo(1080 * PHOTO_LIMITS.maxScale)
  })
})

describe('formatStampText', () => {
  it.each([
    ['2004.10.27', '04 10 27'],
    ['2004.7.21', '04 7 21'],
    ['2004-07-01', '04 7 01'],
    ['04/10/27', '04 10 27'],
    ['2004년 10월 27일', '04 10 27'],
    [' 2004. 10. 27. ', '04 10 27'],
  ])('%s → %s', (input, expected) => {
    expect(formatStampText(input)).toBe(expected)
  })

  it.each(['', '오늘', '2004.13.01', '2004.10.32', '2004.00.10', '20041027', '<script>'])(
    '해석할 수 없는 %s 는 null',
    (input) => {
      expect(formatStampText(input)).toBeNull()
    },
  )
})

describe('buildStampPolygons', () => {
  it('숫자별 세그먼트 수를 맞춘다', () => {
    // 0(6) 4(4) + 1(2) 0(6) + 2(5) 7(3) = 26
    expect(buildStampPolygons('04 10 27')).toHaveLength(26)
    // 한 자리 월은 빈 칸 + 7(3)
    expect(buildStampPolygons('04 7 21')).toHaveLength(6 + 4 + 3 + 5 + 2)
    expect(buildStampPolygons('')).toHaveLength(0)
  })

  it('모든 좌표가 스탬프 너비·높이 안에 있다', () => {
    const points = buildStampPolygons('88 88 88').flat()
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(stampWidth())
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(STAMP_GEOMETRY.digitHeight)
    }
  })
})

describe('applyColorEffect', () => {
  const pixel = () => new Uint8ClampedArray([200, 40, 60, 128, 0, 0, 0, 255])

  it('original은 바꾸지 않는다', () => {
    const data = pixel()
    applyColorEffect(data, 'original')
    expect([...data]).toEqual([...pixel()])
  })

  it('mono는 회색조가 되고 검정이 살짝 뜬다', () => {
    const data = pixel()
    applyColorEffect(data, 'mono')
    expect(data[0]).toBe(data[1])
    expect(data[1]).toBe(data[2])
    expect(data[4]).toBeGreaterThan(0)
  })

  it('soft / faded는 검정을 들어올리고 채도를 낮춘다', () => {
    for (const effect of ['soft', 'faded'] as const) {
      const data = pixel()
      applyColorEffect(data, effect)
      expect(data[4]).toBeGreaterThan(20)
      expect(data[0] - data[1]).toBeLessThan(200 - 40)
    }
  })

  it('알파는 유지하고 값은 0~255 범위다', () => {
    for (const effect of ['soft', 'faded', 'mono'] as const) {
      const data = new Uint8ClampedArray([255, 255, 255, 10, 0, 0, 0, 0])
      applyColorEffect(data, effect)
      expect(data[3]).toBe(10)
      expect(data[7]).toBe(0)
      expect(Math.max(...data)).toBeLessThanOrEqual(255)
    }
  })
})

describe('darken (단색 스킨 테두리 색)', () => {
  it('각 채널을 비율만큼 어둡게 한다', async () => {
    const { darken } = await import('./skins')
    expect(darken('#ffffff', 0.5)).toBe('#808080')
    expect(darken('#2b2f3a', 0)).toBe('#2b2f3a')
    expect(darken('#88cc44', 1)).toBe('#000000')
  })
})
