/**
 * 필름카메라 날짜 각인 스탬프 ('04 10 27').
 * 시안 DateStamp.dc.html의 7-segment 수치를 그대로 옮겼다.
 */

/** 칸 너비, 높이, 획 두께, 세그먼트 간격, 숫자 간격, 그룹 간 추가 간격 (시안 단위) */
export const STAMP_GEOMETRY = {
  digitWidth: 10,
  digitHeight: 18,
  stroke: 2.2,
  gap: 0.5,
  advance: 13,
  groupGap: 8,
  /** 기울기 (skewX -4°) */
  skew: Math.tan((-4 * Math.PI) / 180),
} as const

/** 번짐 3겹: 바깥 → 안쪽 (blur는 digitHeight 18 기준 값) */
export const STAMP_LAYERS = [
  { color: '#ff2e00', alpha: 0.85, blur: 2.4 },
  { color: '#ff5a1c', alpha: 1, blur: 0.8 },
  { color: '#ff8a3d', alpha: 1, blur: 0.25 },
] as const

const SEGMENTS_BY_DIGIT: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
}

const DATE_PATTERN = /^\s*(\d{2}|\d{4})\s*[.\-/년\s]\s*(\d{1,2})\s*[.\-/월\s]\s*(\d{1,2})\s*일?\s*\.?\s*$/

/**
 * 날짜 문구를 스탬프 형식 "YY M DD"로 바꾼다. 해석할 수 없으면 null (스탬프를 그리지 않음).
 * 예: "2004.10.27" → "04 10 27", "2004-7-21" → "04 7 21", "04/07/21" → "04 7 21"
 */
export function formatStampText(date: string): string | null {
  const match = DATE_PATTERN.exec(date)
  if (!match) return null
  const [, y, m, d] = match
  const month = Number(m)
  const day = Number(d)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${y.slice(-2)} ${month} ${String(day).padStart(2, '0')}`
}

export type Point = readonly [number, number]

/** 스탬프 문구를 세그먼트 다각형 목록으로 바꾼다 (시안 단위, 기울이기 전). */
export function buildStampPolygons(text: string): Point[][] {
  const { digitWidth: W, digitHeight: H, stroke: T, gap: G, advance, groupGap } = STAMP_GEOMETRY
  const h = T / 2

  const horizontal = (x: number, cy: number): Point[] => {
    const l = x + h + G
    const r = x + W - h - G
    return [[l, cy], [l + h, cy - h], [r - h, cy - h], [r, cy], [r - h, cy + h], [l + h, cy + h]]
  }
  const vertical = (cx: number, top: number, bottom: number): Point[] => {
    const t = top + h + G
    const b = bottom - h - G
    return [[cx, t], [cx + h, t + h], [cx + h, b - h], [cx, b], [cx - h, b - h], [cx - h, t + h]]
  }
  const segment: Record<string, (x: number) => Point[]> = {
    a: (x) => horizontal(x, h),
    g: (x) => horizontal(x, H / 2),
    d: (x) => horizontal(x, H - h),
    f: (x) => vertical(x + h, 0, H / 2),
    b: (x) => vertical(x + W - h, 0, H / 2),
    e: (x) => vertical(x + h, H / 2, H),
    c: (x) => vertical(x + W - h, H / 2, H),
  }

  const polygons: Point[][] = []
  let x = 0
  // 그룹마다 2칸, 한 자리면 앞 칸을 비운다
  for (const group of text.trim().split(/\s+/).slice(0, 3)) {
    for (const ch of group.slice(-2).padStart(2, ' ')) {
      for (const s of SEGMENTS_BY_DIGIT[ch] ?? '') polygons.push(segment[s](x))
      x += advance
    }
    x += groupGap
  }
  return polygons
}

/** 스탬프 전체 너비 (시안 단위). 3그룹 × 2칸 기준 */
export function stampWidth(): number {
  const { advance, groupGap, digitWidth } = STAMP_GEOMETRY
  return advance * 5 + groupGap * 2 + digitWidth
}

/**
 * 스탬프를 그린다. (right, bottom)은 스탬프 오른쪽 아래 모서리, digitHeight는 숫자 높이(px).
 * 번짐은 ctx.filter 대신 shadowBlur로 만들어 브라우저 간 차이를 줄인다.
 */
export function drawDateStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  right: number,
  bottom: number,
  digitHeight: number,
): void {
  const polygons = buildStampPolygons(text)
  if (polygons.length === 0) return
  const unit = digitHeight / STAMP_GEOMETRY.digitHeight
  const left = right - stampWidth() * unit
  const top = bottom - digitHeight

  ctx.save()
  ctx.translate(left, top)
  ctx.scale(unit, unit)
  // skewX: y가 아래로 갈수록 x가 왼쪽으로 (시안과 같은 방향)
  ctx.transform(1, 0, STAMP_GEOMETRY.skew, 1, 0, 0)
  for (const layer of STAMP_LAYERS) {
    ctx.globalAlpha = layer.alpha
    ctx.fillStyle = layer.color
    ctx.shadowColor = layer.color
    ctx.shadowBlur = layer.blur * 2 * unit
    ctx.beginPath()
    for (const polygon of polygons) {
      polygon.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)))
      ctx.closePath()
    }
    ctx.fill()
  }
  ctx.restore()
}
