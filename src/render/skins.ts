import type { BackgroundId, CardTheme } from '../editor/types'

/**
 * 카드 배경(스킨). 시안의 CSS 패턴을 캔버스로 옮겼다 (시안 540px × 2 = export 1080px).
 * 패턴은 정수 좌표에 그려 도트·줄이 번지지 않게 한다.
 */
export const SKIN_COLORS = {
  'sky-dots': { base: '#d6e9f8', dot: '#ffffff' },
  'pink-check': { base: '#ffe3ec', stripe: 'rgba(255, 160, 190, 0.25)' },
  'cream-diary': { base: '#fffaf0', line: '#eadbb4' },
  'pastel-gradient': { stops: ['#c9e0f6', '#e3dbf5', '#fadbe7'] as const },
} as const

export const SKIN_LABELS: Record<BackgroundId, string> = {
  'sky-dots': '하늘 도트',
  'pink-check': '핑크 체크',
  'cream-diary': '크림 줄노트',
  'pastel-gradient': '파스텔',
  solid: '단색',
}

/** #rrggbb를 amount(0~1)만큼 검게 */
export function darken(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const channel = (shift: number) => Math.round(((n >> shift) & 0xff) * (1 - amount))
  return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, '0')).join('')}`
}

const DOT_GRID = 24
const DOT_RADIUS = 3
const CHECK = 48
const RULE = 28
/** CSS linear-gradient(160deg, ...) 와 같은 방향 */
const GRADIENT_DEG = 160

export function drawSkin(ctx: CanvasRenderingContext2D, theme: CardTheme, width: number, height: number): void {
  ctx.save()
  switch (theme.background) {
    case 'solid': {
      ctx.fillStyle = theme.solidColor
      ctx.fillRect(0, 0, width, height)
      break
    }
    case 'sky-dots': {
      const c = SKIN_COLORS['sky-dots']
      ctx.fillStyle = c.base
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = c.dot
      for (let y = DOT_GRID / 2; y < height; y += DOT_GRID) {
        for (let x = DOT_GRID / 2; x < width; x += DOT_GRID) {
          ctx.beginPath()
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
    case 'pink-check': {
      const c = SKIN_COLORS['pink-check']
      ctx.fillStyle = c.base
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = c.stripe
      // 세로 띠 + 가로 띠가 겹쳐 체크무늬가 된다
      for (let x = 0; x < width; x += CHECK) ctx.fillRect(x, 0, CHECK / 2, height)
      for (let y = 0; y < height; y += CHECK) ctx.fillRect(0, y, width, CHECK / 2)
      break
    }
    case 'cream-diary': {
      const c = SKIN_COLORS['cream-diary']
      ctx.fillStyle = c.base
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = c.line
      for (let y = RULE - 2; y < height; y += RULE) ctx.fillRect(0, y, width, 2)
      break
    }
    case 'pastel-gradient': {
      const rad = (GRADIENT_DEG * Math.PI) / 180
      const dx = Math.sin(rad)
      const dy = -Math.cos(rad)
      const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2
      const cx = width / 2
      const cy = height / 2
      const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half)
      const stops = SKIN_COLORS['pastel-gradient'].stops
      stops.forEach((color, i) => g.addColorStop(i / (stops.length - 1), color))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, width, height)
      break
    }
  }
  ctx.restore()
}
