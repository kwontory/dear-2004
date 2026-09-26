/**
 * 카드와 UI에 쓰는 픽셀 폰트 (Galmuri, SIL OFL 1.1, public/fonts/Galmuri-OFL.md).
 *
 * 기기에 같은 이름의 폰트가 있거나, 모바일에서 사용자 지정 글꼴이 기본 글꼴을 바꿔도
 * 카드 이미지가 달라지지 않도록 앱 전용 family 이름으로 등록한다.
 */
export const FONT_FAMILIES = {
  body: 'dear2004-galmuri11',
  small: 'dear2004-galmuri9',
} as const

interface FontFaceSpec {
  family: string
  file: string
  weight: '400' | '700'
}

export const FONT_FACES: readonly FontFaceSpec[] = [
  { family: FONT_FAMILIES.body, file: 'Galmuri11.woff2', weight: '400' },
  { family: FONT_FAMILIES.body, file: 'Galmuri11-Bold.woff2', weight: '700' },
  { family: FONT_FAMILIES.small, file: 'Galmuri9.woff2', weight: '400' },
]

/** 폰트를 못 불러왔을 때 쓸 대체 글꼴. 결과가 기기마다 달라질 수 있으므로 사용자에게 알린다 */
const FALLBACK = 'monospace'

export function cardFont(sizePx: number, weight: 400 | 700 = 400, family: string = FONT_FAMILIES.body): string {
  return `${weight} ${sizePx}px "${family}", ${FALLBACK}`
}

let loading: Promise<boolean> | null = null

/**
 * 카드용 폰트를 FontFace API로 불러와 document.fonts에 등록한다. 여러 번 불러도 한 번만 받는다.
 * 모두 성공하면 true. 실패해도 예외를 던지지 않는다.
 */
export function loadCardFonts(): Promise<boolean> {
  if (loading) return loading
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return Promise.resolve(false)
  const base = import.meta.env.BASE_URL
  loading = Promise.all(
    FONT_FACES.map(async (spec) => {
      const face = new FontFace(spec.family, `url("${base}fonts/${spec.file}") format("woff2")`, {
        weight: spec.weight,
        display: 'swap',
      })
      await face.load()
      document.fonts.add(face)
    }),
  ).then(
    () => true,
    () => false,
  )
  return loading
}
