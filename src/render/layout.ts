import { CANVAS_SIZES, COMMENT_LIMITS } from '../editor/constants'
import type { AspectRatio, EditorState, FrameId } from '../editor/types'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export const FRAME_LABELS: Record<FrameId, string> = {
  memo: '감성 사진',
  minihome: '미니홈피',
  album: '사진첩',
  diary: '다이어리',
}

export function cardSize(aspectRatio: AspectRatio): { width: number; height: number } {
  return CANVAS_SIZES[aspectRatio]
}

/**
 * 모든 수치는 export 픽셀(카드 너비 1080) 기준. 시안(540px) 수치 × 2.
 * Galmuri11은 12px 배수, Galmuri9은 10px 배수에서 선명하므로 글자는 24px / 20px.
 */
export const TYPE = {
  body: 24,
  small: 20,
  lineHeight: 42,
  lineHeightTight: 38,
} as const

export interface MemoLayout {
  frame: 'memo'
  photo: Rect
  body: Rect & { maxLines: number }
  signature: { right: number; bottom: number; maxWidth: number }
}

export interface MinihomeLayout {
  frame: 'minihome'
  binder: Rect
  leftPage: Rect
  rightPage: Rect
  rings: { x: number; ys: number[] }
  tabs: Rect[]
  counter: { x: number; y: number; width: number } | null
  profileBox: Rect
  profilePhoto: Rect
  status: { x: number; y: number; width: number }
  profileText: Rect & { maxLines: number }
  signature: { x: number; y: number; width: number }
  profileDate: { x: number; y: number }
  title: { x: number; y: number; width: number }
  bgm: Rect | null
  photoBox: Rect
  photo: Rect
  comments: { x: number; y: number; width: number; lines: number }
  meta: { x: number; y: number; width: number }
}

export interface AlbumLayout {
  frame: 'album'
  topBar: Rect
  panel: Rect
  header: { x: number; y: number; width: number; lineY: number }
  photoBox: Rect
  photo: Rect
  body: Rect & { maxLines: number }
  footer: { x: number; y: number; width: number; lineY: number; comments: number }
  signaturePill: Rect | null
}

export interface DiaryLayout {
  frame: 'diary'
  paper: Rect
  marginX: number
  ruleStart: number
  ruleGap: number
  header: { x: number; y: number; width: number }
  title: { x: number; y: number; width: number }
  photoBox: Rect
  photo: Rect
  photoRotation: number
  body: Rect & { maxLines: number }
  signature: { right: number; bottom: number; maxWidth: number }
}

export type FrameLayout = MemoLayout | MinihomeLayout | AlbumLayout | DiaryLayout

export type CardLayout = FrameLayout & {
  width: number
  height: number
  /** 날짜 스탬프 숫자 높이 */
  stampHeight: number
}

/** 시안 1:1 카드(540px)에서 사진 높이 318px → 0.589 */
const MEMO_PHOTO_HEIGHT_RATIO: Record<AspectRatio, number> = { '1:1': 318 / 540, '4:5': 0.62, '9:16': 0.6 }

function memoLayout(width: number, height: number, ratio: AspectRatio): MemoLayout {
  const photoHeight = Math.round(height * MEMO_PHOTO_HEIGHT_RATIO[ratio])
  const padX = 68
  const top = photoHeight + 52
  const bottom = height - 44 - TYPE.body - 20
  return {
    frame: 'memo',
    photo: { x: 0, y: 0, width, height: photoHeight },
    body: {
      x: padX,
      y: top,
      width: width - padX * 2,
      height: bottom - top,
      maxLines: Math.max(1, Math.floor((bottom - top) / TYPE.lineHeight)),
    },
    signature: { right: width - 60, bottom: height - 44, maxWidth: Math.round(width * 0.5) },
  }
}

function inset(r: Rect, d: number): Rect {
  return { x: r.x + d, y: r.y + d, width: r.width - d * 2, height: r.height - d * 2 }
}

function minihomeLayout(width: number, height: number, state: EditorState): MinihomeLayout {
  // 시안: padding 34 58 34 16 → ×2
  const binder = { x: 32, y: 68, width: width - 32 - 116, height: height - 136 }
  const inner = inset(binder, 20)
  const leftPage = { x: inner.x, y: inner.y, width: 300, height: inner.height }
  const ringW = 32
  const rightPage = {
    x: leftPage.x + leftPage.width + ringW,
    y: inner.y,
    width: inner.x + inner.width - (leftPage.x + leftPage.width + ringW),
    height: inner.height,
  }
  const ringCount = 4
  const ringTop = inner.y + 120
  const ringBottom = inner.y + inner.height - 120
  const rings = {
    x: leftPage.x + leftPage.width + ringW / 2,
    ys: Array.from({ length: ringCount }, (_, i) => ringTop + ((ringBottom - ringTop) * (i + 0.5)) / ringCount),
  }
  const tabs = Array.from({ length: 4 }, (_, i) => ({ x: binder.x + binder.width - 2, y: binder.y + 72 + i * 58, width: 104, height: 52 }))

  // 왼쪽 페이지 내용
  const lp = inset(leftPage, 20)
  let y = lp.y
  const counter = state.counter.visible ? { x: lp.x, y, width: lp.width } : null
  if (counter) y += 28 + 16
  const profileBox = { x: lp.x, y, width: 256, height: 256 }
  const profilePhoto = inset(profileBox, 8)
  y += profileBox.height + 16
  const status = { x: lp.x, y, width: lp.width }
  y += 36 + 16
  const bottomBlock = 16 + 32 + 28
  const signature = { x: lp.x, y: lp.y + lp.height - 28 - 32, width: lp.width }
  const profileDate = { x: lp.x, y: lp.y + lp.height - 24 }
  const textBottom = lp.y + lp.height - bottomBlock - 8
  const profileText = {
    x: lp.x,
    y,
    width: lp.width,
    height: Math.max(0, textBottom - y),
    maxLines: Math.max(0, Math.floor((textBottom - y) / TYPE.lineHeightTight)),
  }

  // 오른쪽 페이지 내용
  const rp = inset(rightPage, 24)
  let ry = rp.y
  const title = { x: rp.x, y: ry, width: rp.width }
  ry += 40
  const bgm = state.text.bgm.trim() !== '' ? { x: rp.x, y: ry, width: rp.width, height: 48 } : null
  if (bgm) ry += 48 + 20
  const commentLines = Math.min(state.comments.length, 3)
  const meta = { x: rp.x, y: rp.y + rp.height - 24, width: rp.width }
  const comments = { x: rp.x, y: meta.y - 16 - commentLines * 36, width: rp.width, lines: commentLines }
  const photoBottom = comments.y - 16 - 16
  const photoBox = { x: rp.x, y: ry, width: rp.width, height: Math.max(40, photoBottom - ry) }
  return {
    frame: 'minihome',
    binder,
    leftPage,
    rightPage,
    rings,
    tabs,
    counter,
    profileBox,
    profilePhoto,
    status,
    profileText,
    signature,
    profileDate,
    title,
    bgm,
    photoBox,
    photo: inset(photoBox, 8),
    comments,
    meta,
  }
}

function albumLayout(width: number, height: number, state: EditorState): AlbumLayout {
  const padX = 56
  const padY = 80
  const topBar = { x: padX, y: padY, width: width - padX * 2, height: 52 }
  const hasSignature = state.text.signature.trim() !== ''
  const signaturePill = hasSignature
    ? { x: width - padX - 360, y: height - padY - 48, width: 360, height: 48 }
    : null
  const panelTop = topBar.y + topBar.height + 28
  const panelBottom = signaturePill ? signaturePill.y - 28 : height - padY
  const panel = { x: padX, y: panelTop, width: width - padX * 2, height: panelBottom - panelTop }
  const c = inset(panel, 36)
  const header = { x: c.x, y: c.y, width: c.width, lineY: c.y + 44 }
  const comments = Math.min(state.comments.length, COMMENT_LIMITS.maxCount)
  const footerHeight = 16 + 24 + comments * 36
  const footer = { x: c.x, y: c.y + c.height - footerHeight + 16, width: c.width, lineY: c.y + c.height - footerHeight, comments }
  const bodyLines = 3
  const bodyHeight = bodyLines * TYPE.lineHeight
  const body = { x: c.x + 12, y: footer.lineY - 24 - bodyHeight, width: c.width - 24, height: bodyHeight, maxLines: bodyLines }
  const photoTop = header.lineY + 24
  const photoBottom = body.y - 24
  const boxWidth = Math.min(c.width, 880)
  const photoBox = { x: c.x + (c.width - boxWidth) / 2, y: photoTop, width: boxWidth, height: Math.max(40, photoBottom - photoTop) }
  return { frame: 'album', topBar, panel, header, photoBox, photo: inset(photoBox, 10), body, footer, signaturePill }
}

function diaryLayout(width: number, height: number): DiaryLayout {
  const paper = { x: 56, y: 64, width: width - 112, height: height - 128 }
  const marginX = paper.x + 80
  const ruleGap = 44
  const header = { x: marginX + 24, y: paper.y + 40, width: paper.x + paper.width - (marginX + 24) - 40 }
  const title = { x: marginX + 24, y: paper.y + 92, width: header.width }
  const ruleStart = paper.y + 150
  const photoWidth = Math.round((paper.x + paper.width - marginX) * 0.78)
  const available = paper.y + paper.height - ruleStart - 40
  const photoHeight = Math.round(Math.min(photoWidth * 0.72, available * 0.55))
  const photoBox = {
    x: marginX + (paper.x + paper.width - marginX - photoWidth) / 2,
    y: ruleStart + 24,
    width: photoWidth,
    height: photoHeight,
  }
  // 사진 아래 첫 줄 선부터 본문을 쓴다
  const afterPhoto = photoBox.y + photoBox.height + 40
  const firstRule = ruleStart + Math.ceil((afterPhoto - ruleStart) / ruleGap) * ruleGap
  const bodyBottom = paper.y + paper.height - 96
  const maxLines = Math.max(1, Math.floor((bodyBottom - firstRule) / ruleGap))
  return {
    frame: 'diary',
    paper,
    marginX,
    ruleStart,
    ruleGap,
    header,
    title,
    photoBox,
    photo: inset(photoBox, 16),
    photoRotation: (-1.5 * Math.PI) / 180,
    body: { x: marginX + 24, y: firstRule, width: header.width, height: maxLines * ruleGap, maxLines },
    signature: { right: paper.x + paper.width - 40, bottom: paper.y + paper.height - 36, maxWidth: Math.round(paper.width * 0.5) },
  }
}

/** 틀별 카드 영역을 export 픽셀 좌표로 계산한다 */
export function computeLayout(state: EditorState): CardLayout {
  const { width, height } = cardSize(state.aspectRatio)
  let frame: FrameLayout
  switch (state.theme.frame) {
    case 'minihome':
      frame = minihomeLayout(width, height, state)
      break
    case 'album':
      frame = albumLayout(width, height, state)
      break
    case 'diary':
      frame = diaryLayout(width, height)
      break
    default:
      frame = memoLayout(width, height, state.aspectRatio)
  }
  // 숫자 높이: 사진 너비의 3%, 14~26px
  const stampHeight = Math.round(Math.min(26, Math.max(14, frame.photo.width * 0.03)))
  return { ...frame, width, height, stampHeight }
}
