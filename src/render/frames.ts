import type { CardTheme, EditorState } from '../editor/types'
import { cardFont, FONT_FAMILIES } from './fonts'
import type { AlbumLayout, CardLayout, DiaryLayout, MemoLayout, MinihomeLayout, Rect } from './layout'
import { TYPE } from './layout'
import { darken } from './skins'
import { wrapText } from './textLayout'

/**
 * 틀(frame)별 카드 장식과 글자. 시안 CardSquare / CardPortrait / CardStory를 캔버스로 옮겼다.
 * 사진·날짜 스탬프·스티커는 renderCard가 그린다.
 */
export const FRAME_COLORS = {
  ink: '#4a4a4a',
  grey: '#6b6b6b',
  muted: '#767676',
  blue: '#2a6db0',
  orange: '#c75000',
  pink: '#d43a70',
  white: '#ffffff',
  photoBorder: '#d4d4d4',
  dotted: '#bcbcbc',
  binder: '#a8b9c9',
  binderDot: '#dfe7ee',
  binderBorder: '#7f93a6',
  pageBorder: '#c3ced8',
  ring: '#eef2f5',
  ringBorder: '#6f8396',
  tab: '#2f7fa8',
  bgmBorder: '#d4dde6',
  bgmFill: '#f5f8fb',
  paper: '#fffdf7',
  polaroid: '#fffefa',
  polaroidShadow: 'rgba(80, 70, 110, 0.22)',
  polaroidEdge: 'rgba(0, 0, 0, 0.05)',
  rule: '#eadbb4',
  margin: '#f3a6b8',
  tape: 'rgba(255, 224, 138, 0.75)',
  shadow: 'rgba(0, 0, 0, 0.12)',
} as const

/** 스킨에 어울리는 패널 테두리 색 */
const SKIN_ACCENT = {
  'sky-dots': '#9fc3e7',
  'pink-check': '#e4b3c4',
  'cream-diary': '#d8c59a',
  'pastel-gradient': '#c9b8e8',
} as const

/** 단색 스킨은 고른 색을 조금 어둡게 한 색을 테두리로 쓴다 */
const SOLID_ACCENT_DARKEN = 0.22

function skinAccent(theme: CardTheme): string {
  return theme.background === 'solid' ? darken(theme.solidColor, SOLID_ACCENT_DARKEN) : SKIN_ACCENT[theme.background]
}

const MINIHOME_TABS = ['홈', '다이어리', '사진첩', '방명록'] as const

// ── 공통 도우미 ─────────────────────────────────────────────

function roundRectPath(ctx: CanvasRenderingContext2D, r: Rect, radius: number | [number, number, number, number]): void {
  const [tl, tr, br, bl] = typeof radius === 'number' ? [radius, radius, radius, radius] : radius
  ctx.beginPath()
  ctx.moveTo(r.x + tl, r.y)
  ctx.lineTo(r.x + r.width - tr, r.y)
  ctx.arcTo(r.x + r.width, r.y, r.x + r.width, r.y + tr, tr)
  ctx.lineTo(r.x + r.width, r.y + r.height - br)
  ctx.arcTo(r.x + r.width, r.y + r.height, r.x + r.width - br, r.y + r.height, br)
  ctx.lineTo(r.x + bl, r.y + r.height)
  ctx.arcTo(r.x, r.y + r.height, r.x, r.y + r.height - bl, bl)
  ctx.lineTo(r.x, r.y + tl)
  ctx.arcTo(r.x, r.y, r.x + tl, r.y, tl)
  ctx.closePath()
}

function panel(ctx: CanvasRenderingContext2D, r: Rect, fill: string, border: string, radius: number, borderWidth = 2): void {
  roundRectPath(ctx, r, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = borderWidth
  ctx.strokeStyle = border
  ctx.stroke()
}

function dottedLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
  ctx.save()
  ctx.strokeStyle = FRAME_COLORS.dotted
  ctx.lineWidth = 2
  ctx.setLineDash([2, 4])
  ctx.beginPath()
  ctx.moveTo(x, Math.round(y) + 1)
  ctx.lineTo(x + width, Math.round(y) + 1)
  ctx.stroke()
  ctx.restore()
}

const measureWith = (ctx: CanvasRenderingContext2D) => (text: string) => ctx.measureText(text).width

/** 한 줄로 맞추고 넘치면 … (줄바꿈은 공백으로) */
function fitLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (maxWidth <= 0) return ''
  return wrapText(text.replace(/\s*\n\s*/g, ' '), maxWidth, 1, measureWith(ctx)).lines[0] ?? ''
}

interface TextStyle {
  size: number
  color: string
  weight?: 400 | 700
  family?: string
}

function setText(ctx: CanvasRenderingContext2D, style: TextStyle): void {
  ctx.font = cardFont(style.size, style.weight ?? 400, style.family)
  ctx.fillStyle = style.color
}

/** 글자 조각들을 이어서 한 줄로 그린다. 마지막 조각은 남은 폭에 맞춰 줄인다. 그린 끝 x를 돌려준다 */
function drawRuns(
  ctx: CanvasRenderingContext2D,
  runs: { text: string; style: TextStyle }[],
  x: number,
  y: number,
  maxWidth: number,
): number {
  ctx.textAlign = 'left'
  let cursor = x
  runs.forEach((run, i) => {
    setText(ctx, run.style)
    const remaining = x + maxWidth - cursor
    const text = i === runs.length - 1 ? fitLine(ctx, run.text, remaining) : run.text
    ctx.fillText(text, Math.round(cursor), Math.round(y))
    cursor += ctx.measureText(text).width
  })
  return cursor
}

function drawParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  maxLines: number,
  lineHeight: number,
  style: TextStyle,
): void {
  if (text.trim() === '' || maxLines <= 0) return
  setText(ctx, style)
  ctx.textAlign = 'left'
  const { lines } = wrapText(text, width, maxLines, measureWith(ctx))
  lines.forEach((line, i) => ctx.fillText(line, Math.round(x), Math.round(y + i * lineHeight)))
}

const small = (color: string): TextStyle => ({ size: TYPE.small, color, family: FONT_FAMILIES.small })
const body = (color: string, weight: 400 | 700 = 400): TextStyle => ({ size: TYPE.body, color, weight })

function counterRuns(state: EditorState) {
  return [
    { text: 'TODAY ', style: small(FRAME_COLORS.muted) },
    { text: String(state.counter.today), style: small(FRAME_COLORS.orange) },
    { text: ` | TOTAL ${state.counter.total}`, style: small(FRAME_COLORS.muted) },
  ]
}

function commentRuns(author: string, text: string) {
  return [
    { text: 'ㄴ ', style: body(FRAME_COLORS.muted) },
    { text: author.trim() === '' ? '익명' : author, style: body(FRAME_COLORS.blue, 700) },
    { text: ` : ${text}`, style: body(FRAME_COLORS.ink) },
  ]
}

// ── 감성 사진 (memo) ────────────────────────────────────────

/** 폴라로이드: 스킨 위에 그림자를 드리운 흰 인화지 */
function memoBase(ctx: CanvasRenderingContext2D, layout: MemoLayout): void {
  const r = layout.polaroid
  ctx.save()
  ctx.shadowColor = FRAME_COLORS.polaroidShadow
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 12
  ctx.fillStyle = FRAME_COLORS.polaroid
  ctx.fillRect(r.x, r.y, r.width, r.height)
  ctx.restore()
  // 인화지 윗면의 아주 옅은 선 (시안 box-shadow 0 2px 0)
  ctx.fillStyle = FRAME_COLORS.polaroidEdge
  ctx.fillRect(r.x, r.y + r.height, r.width, 4)
}

function memoText(ctx: CanvasRenderingContext2D, state: EditorState, layout: MemoLayout): void {
  ctx.textBaseline = 'top'
  drawParagraph(ctx, state.text.body, layout.body.x, layout.body.y, layout.body.width, layout.body.maxLines, TYPE.lineHeight, body(FRAME_COLORS.grey))
  const signature = state.text.signature.trim()
  if (signature !== '') {
    setText(ctx, body('#8a8a8a'))
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(fitLine(ctx, `by. ${signature}`, layout.signature.maxWidth), layout.signature.right, layout.signature.bottom)
  }
}

// ── 미니홈피 (minihome) ─────────────────────────────────────

function minihomeBase(ctx: CanvasRenderingContext2D, layout: MinihomeLayout): void {
  const { binder } = layout
  // 바인더: 회색빛 파랑 바탕 + 흰 점
  ctx.save()
  roundRectPath(ctx, binder, 24)
  ctx.fillStyle = FRAME_COLORS.binder
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = FRAME_COLORS.binderDot
  for (let y = binder.y + 5; y < binder.y + binder.height; y += 10) {
    for (let x = binder.x + 5; x < binder.x + binder.width; x += 10) ctx.fillRect(x - 1, y - 1, 2, 2)
  }
  ctx.restore()
  roundRectPath(ctx, binder, 24)
  ctx.lineWidth = 2
  ctx.strokeStyle = FRAME_COLORS.binderBorder
  ctx.stroke()

  // 인덱스 탭 (바인더 오른쪽에 붙은 모양)
  layout.tabs.forEach((tab, i) => {
    const active = i === 0
    roundRectPath(ctx, tab, [0, 10, 10, 0])
    ctx.fillStyle = active ? FRAME_COLORS.white : FRAME_COLORS.tab
    ctx.fill()
    if (active) {
      ctx.lineWidth = 2
      ctx.strokeStyle = FRAME_COLORS.binderBorder
      ctx.stroke()
    }
  })

  panel(ctx, layout.leftPage, FRAME_COLORS.white, FRAME_COLORS.pageBorder, 12)
  panel(ctx, layout.rightPage, FRAME_COLORS.white, FRAME_COLORS.pageBorder, 12)

  // 스프링 고리
  for (const y of layout.rings.ys) {
    panel(ctx, { x: layout.rings.x - 22, y: y - 6, width: 44, height: 12 }, FRAME_COLORS.ring, FRAME_COLORS.ringBorder, 6)
  }

  panel(ctx, layout.profileBox, FRAME_COLORS.white, FRAME_COLORS.photoBorder, 0)
  panel(ctx, layout.photoBox, FRAME_COLORS.white, FRAME_COLORS.photoBorder, 0)
  if (layout.bgm) panel(ctx, layout.bgm, FRAME_COLORS.bgmFill, FRAME_COLORS.bgmBorder, 0)
}

function minihomeText(ctx: CanvasRenderingContext2D, state: EditorState, layout: MinihomeLayout): void {
  ctx.textBaseline = 'top'
  // 탭 글자
  layout.tabs.forEach((tab, i) => {
    setText(ctx, body(i === 0 ? FRAME_COLORS.tab : FRAME_COLORS.white, i === 0 ? 700 : 400))
    ctx.textAlign = 'center'
    ctx.fillText(fitLine(ctx, MINIHOME_TABS[i], tab.width - 8), Math.round(tab.x + tab.width / 2), Math.round(tab.y + 14))
  })

  if (layout.counter) drawRuns(ctx, counterRuns(state), layout.counter.x, layout.counter.y, layout.counter.width)

  const s = layout.status
  drawRuns(ctx, [{ text: 'TODAY is.. ', style: body(FRAME_COLORS.muted) }, { text: state.text.status, style: body(FRAME_COLORS.pink, 700) }], s.x, s.y, s.width)
  dottedLine(ctx, s.x, s.y + 40, s.width)

  const p = layout.profileText
  drawParagraph(ctx, state.text.body, p.x, p.y, p.width, p.maxLines, TYPE.lineHeightTight, body(FRAME_COLORS.blue))

  dottedLine(ctx, layout.signature.x, layout.signature.y - 14, layout.signature.width)
  if (state.text.signature.trim() !== '') {
    drawRuns(ctx, [{ text: state.text.signature, style: body(FRAME_COLORS.ink, 700) }], layout.signature.x, layout.signature.y, layout.signature.width)
  }
  if (state.text.date.trim() !== '') {
    drawRuns(ctx, [{ text: `(${state.text.date.trim()})`, style: small(FRAME_COLORS.muted) }], layout.profileDate.x, layout.profileDate.y, layout.signature.width)
  }

  drawRuns(ctx, [{ text: state.text.title, style: body(FRAME_COLORS.blue, 700) }], layout.title.x, layout.title.y, layout.title.width)

  if (layout.bgm) {
    const b = layout.bgm
    const y = b.y + 12
    let x = drawRuns(ctx, [{ text: '♬ ', style: body(FRAME_COLORS.orange) }], b.x + 16, y, 40)
    x = drawRuns(ctx, [{ text: 'BGM ', style: small(FRAME_COLORS.muted) }], x, y + 2, 80)
    setText(ctx, small(FRAME_COLORS.muted))
    const controls = '▶ ∥ ■'
    const controlsWidth = ctx.measureText(controls).width
    ctx.textAlign = 'right'
    ctx.fillText(controls, Math.round(b.x + b.width - 16), Math.round(y + 2))
    drawRuns(ctx, [{ text: state.text.bgm, style: body(FRAME_COLORS.ink) }], x, y, b.x + b.width - 16 - controlsWidth - 16 - x)
  }

  const c = layout.comments
  state.comments.slice(0, c.lines).forEach((comment, i) => {
    drawRuns(ctx, commentRuns(comment.author, comment.text), c.x, c.y + i * 36, c.width)
  })
  dottedLine(ctx, layout.meta.x, layout.meta.y - 14, layout.meta.width)
  setText(ctx, small(FRAME_COLORS.muted))
  ctx.textAlign = 'right'
  ctx.fillText(`댓글(${state.comments.length}) | 스크랩 | 퍼가기`, layout.meta.x + layout.meta.width, layout.meta.y - 4)
}

// ── 사진첩 (album) ──────────────────────────────────────────

function albumBase(ctx: CanvasRenderingContext2D, state: EditorState, layout: AlbumLayout): void {
  const accent = skinAccent(state.theme)
  panel(ctx, layout.topBar, FRAME_COLORS.white, accent, 8)
  panel(ctx, layout.panel, FRAME_COLORS.white, accent, 12)
  panel(ctx, layout.photoBox, FRAME_COLORS.white, FRAME_COLORS.photoBorder, 0)
  if (layout.signaturePill) panel(ctx, layout.signaturePill, FRAME_COLORS.white, accent, 8)
}

function albumText(ctx: CanvasRenderingContext2D, state: EditorState, layout: AlbumLayout): void {
  ctx.textBaseline = 'top'
  const bar = layout.topBar
  const barY = bar.y + 16
  let leftEnd = bar.x + 20
  if (state.counter.visible) leftEnd = drawRuns(ctx, counterRuns(state), bar.x + 20, barY, bar.width / 2 - 20)
  if (state.text.bgm.trim() !== '') {
    setText(ctx, small(FRAME_COLORS.muted))
    const maxWidth = bar.x + bar.width - 20 - leftEnd - 24
    const text = fitLine(ctx, `BGM · ${state.text.bgm} ▶`, maxWidth - 30)
    const width = ctx.measureText(text).width
    ctx.textAlign = 'right'
    ctx.fillText(text, Math.round(bar.x + bar.width - 20), Math.round(barY))
    setText(ctx, small(FRAME_COLORS.orange))
    ctx.fillText('♬ ', Math.round(bar.x + bar.width - 20 - width), Math.round(barY))
  }

  const h = layout.header
  setText(ctx, small(FRAME_COLORS.muted))
  const date = state.text.date.trim()
  const dateWidth = date === '' ? 0 : ctx.measureText(date).width + 16
  if (date !== '') {
    ctx.textAlign = 'right'
    ctx.fillText(date, Math.round(h.x + h.width), Math.round(h.y + 4))
  }
  drawRuns(ctx, [{ text: '[사진첩] ', style: body(FRAME_COLORS.blue, 700) }, { text: state.text.title, style: body(FRAME_COLORS.blue, 700) }], h.x, h.y, h.width - dateWidth)
  dottedLine(ctx, h.x, h.lineY, h.width)

  const b = layout.body
  drawParagraph(ctx, state.text.body, b.x, b.y, b.width, b.maxLines, TYPE.lineHeight, body(FRAME_COLORS.grey))

  const f = layout.footer
  dottedLine(ctx, f.x, f.lineY, f.width)
  setText(ctx, small(FRAME_COLORS.muted))
  ctx.textAlign = 'left'
  ctx.fillText(`스크랩 0 | 퍼가기 | 댓글 ${state.comments.length}`, Math.round(f.x), Math.round(f.y))
  state.comments.slice(0, f.comments).forEach((comment, i) => {
    drawRuns(ctx, commentRuns(comment.author, comment.text), f.x, f.y + 32 + i * 36, f.width)
  })

  if (layout.signaturePill) {
    const pill = layout.signaturePill
    setText(ctx, body(FRAME_COLORS.muted))
    ctx.textAlign = 'center'
    ctx.fillText(fitLine(ctx, `by. ${state.text.signature.trim()}`, pill.width - 32), Math.round(pill.x + pill.width / 2), Math.round(pill.y + 12))
  }
}

// ── 다이어리 (diary) ────────────────────────────────────────

function diaryBase(ctx: CanvasRenderingContext2D, state: EditorState, layout: DiaryLayout): void {
  const { paper } = layout
  panel(ctx, paper, FRAME_COLORS.paper, skinAccent(state.theme), 12)
  ctx.save()
  roundRectPath(ctx, paper, 12)
  ctx.clip()
  ctx.fillStyle = FRAME_COLORS.rule
  for (let y = layout.ruleStart; y < paper.y + paper.height - 40; y += layout.ruleGap) ctx.fillRect(paper.x, y, paper.width, 2)
  ctx.fillStyle = FRAME_COLORS.margin
  ctx.fillRect(layout.marginX, paper.y, 2, paper.height)
  ctx.restore()

  // 사진 흰 테두리 + 그림자 (살짝 기울임)
  const box = layout.photoBox
  ctx.save()
  ctx.translate(box.x + box.width / 2, box.y + box.height / 2)
  ctx.rotate(layout.photoRotation)
  ctx.fillStyle = FRAME_COLORS.shadow
  ctx.fillRect(-box.width / 2 + 6, -box.height / 2 + 8, box.width, box.height)
  ctx.fillStyle = FRAME_COLORS.white
  ctx.fillRect(-box.width / 2, -box.height / 2, box.width, box.height)
  ctx.restore()
}

function diaryOverlay(ctx: CanvasRenderingContext2D, layout: DiaryLayout): void {
  // 사진 위에 붙인 마스킹테이프
  const box = layout.photoBox
  ctx.save()
  ctx.translate(box.x + box.width / 2, box.y + box.height / 2)
  ctx.rotate(layout.photoRotation)
  ctx.fillStyle = FRAME_COLORS.tape
  for (const [dx, angle] of [[-0.32, -8], [0.32, 6]] as const) {
    ctx.save()
    ctx.translate(box.width * dx, -box.height / 2)
    ctx.rotate((angle * Math.PI) / 180)
    ctx.fillRect(-80, -24, 160, 48)
    ctx.restore()
  }
  ctx.restore()
}

function diaryText(ctx: CanvasRenderingContext2D, state: EditorState, layout: DiaryLayout): void {
  ctx.textBaseline = 'top'
  const h = layout.header
  setText(ctx, body(FRAME_COLORS.muted))
  const status = fitLine(ctx, state.text.status, h.width / 2)
  ctx.textAlign = 'right'
  ctx.fillText(status, Math.round(h.x + h.width), Math.round(h.y))
  const statusWidth = status === '' ? 0 : ctx.measureText(status).width + 24
  drawRuns(ctx, [{ text: state.text.date, style: body(FRAME_COLORS.muted) }], h.x, h.y, h.width - statusWidth)
  drawRuns(ctx, [{ text: state.text.title, style: body(FRAME_COLORS.blue, 700) }], layout.title.x, layout.title.y, layout.title.width)

  // 본문은 줄 위에 얹는다
  const b = layout.body
  if (state.text.body.trim() !== '') {
    setText(ctx, body(FRAME_COLORS.grey))
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    const { lines } = wrapText(state.text.body, b.width, b.maxLines, measureWith(ctx))
    lines.forEach((line, i) => ctx.fillText(line, Math.round(b.x), Math.round(b.y + i * layout.ruleGap - 6)))
  }
  const signature = state.text.signature.trim()
  if (signature !== '') {
    setText(ctx, body(FRAME_COLORS.muted))
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(fitLine(ctx, `from. ${signature}`, layout.signature.maxWidth), layout.signature.right, layout.signature.bottom)
  }
}

// ── 진입점 ──────────────────────────────────────────────────

/** 사진보다 아래에 깔리는 장식 (배경은 renderCard가 먼저 칠한다) */
export function drawFrameBase(ctx: CanvasRenderingContext2D, state: EditorState, layout: CardLayout): void {
  ctx.save()
  switch (layout.frame) {
    case 'memo':
      memoBase(ctx, layout)
      break
    case 'minihome':
      minihomeBase(ctx, layout)
      break
    case 'album':
      albumBase(ctx, state, layout)
      break
    case 'diary':
      diaryBase(ctx, state, layout)
      break
  }
  ctx.restore()
}

/** 사진 위에 올라가는 장식 (테이프 등) */
export function drawFrameOverlay(ctx: CanvasRenderingContext2D, layout: CardLayout): void {
  if (layout.frame === 'diary') {
    ctx.save()
    diaryOverlay(ctx, layout)
    ctx.restore()
  }
}

/** 틀의 글자. 폰트가 준비된 뒤에만 부른다 */
export function drawFrameText(ctx: CanvasRenderingContext2D, state: EditorState, layout: CardLayout): void {
  ctx.save()
  switch (layout.frame) {
    case 'memo':
      memoText(ctx, state, layout)
      break
    case 'minihome':
      minihomeText(ctx, state, layout)
      break
    case 'album':
      albumText(ctx, state, layout)
      break
    case 'diary':
      diaryText(ctx, state, layout)
      break
  }
  ctx.restore()
}
