import type { EditorState } from '../editor/types'
import { CORE_UNICODE_RANGE, RARE_UNICODE_RANGE } from './fontRanges.generated'

/**
 * 카드와 UI에 쓰는 픽셀 폰트 (Galmuri, SIL OFL 1.1, public/fonts/Galmuri-OFL.md).
 *
 * - 기기에 같은 이름의 폰트가 있거나 모바일에서 사용자 지정 글꼴이 기본 글꼴을 바꿔도
 *   카드 이미지가 달라지지 않도록 앱 전용 family 이름으로 등록한다.
 * - 용량을 줄이려고 글꼴마다 core(라틴·기호·자주 쓰는 한글 2,350자)와
 *   rare(나머지 한글) 두 조각으로 나눴다 (scripts/subset-fonts.mjs).
 *   unicode-range가 겹치지 않으므로 브라우저는 필요한 조각만 받는다.
 */
export const FONT_FAMILIES = {
  body: 'dear2004-galmuri11',
  small: 'dear2004-galmuri9',
} as const

interface FontFaceSpec {
  family: string
  file: string
  weight: '400' | '700'
  unicodeRange: string
}

const FONT_FILES = [
  { family: FONT_FAMILIES.body, name: 'Galmuri11', weight: '400' },
  { family: FONT_FAMILIES.body, name: 'Galmuri11-Bold', weight: '700' },
  { family: FONT_FAMILIES.small, name: 'Galmuri9', weight: '400' },
] as const

export const FONT_FACES: readonly FontFaceSpec[] = FONT_FILES.flatMap((f) => [
  { family: f.family, weight: f.weight, file: `${f.name}.core.woff2`, unicodeRange: CORE_UNICODE_RANGE },
  { family: f.family, weight: f.weight, file: `${f.name}.rare.woff2`, unicodeRange: RARE_UNICODE_RANGE },
])

/** 폰트를 못 불러왔을 때 쓸 대체 글꼴. 결과가 기기마다 달라질 수 있으므로 사용자에게 알린다 */
const FALLBACK = 'monospace'

export function cardFont(sizePx: number, weight: 400 | 700 = 400, family: string = FONT_FAMILIES.body): string {
  return `${weight} ${sizePx}px "${family}", ${FALLBACK}`
}

/** 카드 틀에 늘 들어가는 고정 문구 (사용자 입력과 함께 필요한 글자를 미리 받는다) */
const FRAME_FIXED_TEXT = 'TODAY is.. | TOTAL 0123456789 BGM ♬▶∥■ [사진첩] [내 사진] 홈 다이어리 사진첩 방명록 댓글() 스크랩 퍼가기 by. from. ㄴ : 익명 …'

/** 카드에 그려질 수 있는 모든 글자 */
export function cardText(state: EditorState): string {
  const { text } = state
  const comments = state.comments.map((c) => `${c.author}${c.text}`).join('')
  return [FRAME_FIXED_TEXT, text.title, text.status, text.body, text.bgm, text.date, text.signature, comments].join('')
}

let registered = false

/**
 * 모든 조각을 document.fonts에 등록만 한다 (내려받지는 않는다).
 * UI(CSS)는 화면에 나온 글자에 맞는 조각을 브라우저가 알아서 받는다.
 */
export function registerFontFaces(): void {
  if (registered || typeof document === 'undefined' || typeof FontFace === 'undefined') return
  registered = true
  const base = import.meta.env.BASE_URL
  for (const spec of FONT_FACES) {
    const face = new FontFace(spec.family, `url("${base}fonts/${spec.file}") format("woff2")`, {
      weight: spec.weight,
      unicodeRange: spec.unicodeRange,
      display: 'swap',
    })
    document.fonts.add(face)
  }
}

/**
 * 카드 글자에 필요한 조각을 모두 받아 둔다. 캔버스는 글꼴을 기다려 주지 않으므로
 * 글자를 그리기 전에 반드시 기다린다. 모두 준비되면 true, 실패해도 예외를 던지지 않는다.
 */
export async function loadCardFonts(text: string): Promise<boolean> {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return false
  registerFontFaces()
  try {
    const specs = FONT_FILES.map((f) => cardFont(24, Number(f.weight) as 400 | 700, f.family))
    await Promise.all(specs.map((font) => document.fonts.load(font, text)))
    return specs.every((font) => document.fonts.check(font, text))
  } catch {
    return false
  }
}
