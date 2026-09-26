/**
 * Galmuri 폰트를 앱에 필요한 글자만 남겨 두 조각으로 나눈다.
 *
 *   core: 라틴·숫자·기호·한글 자모 + 자주 쓰는 한글 2,350자(KS X 1001)  → 처음에 받는다
 *   rare: 나머지 한글 음절 8,822자                                   → 그 글자를 쓸 때만 받는다
 *
 * 한자·가나·그리스/키릴 문자는 뺀다 (앱에서 쓰지 않음, 쓰면 기본 글꼴로 보인다).
 * 결과: public/fonts/*.woff2, src/render/fontRanges.generated.ts
 *
 * 실행: npm run fonts:subset
 */
import fs from 'node:fs'
import path from 'node:path'
import * as fontkit from 'fontkit'
import subsetFont from 'subset-font'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'fonts-src')
const OUT = path.join(ROOT, 'public', 'fonts')
const FONTS = ['Galmuri11', 'Galmuri11-Bold', 'Galmuri9']

const BASE_RANGES = [
  [0x20, 0x24f], // 라틴
  [0x2000, 0x2bff], // 문장부호·화살표·수학·도형·기호·딩벳
  [0x3000, 0x303f], // CJK 기호 (『』 등)
  [0x3130, 0x318f], // 한글 호환 자모 (ㄷㅏ, ㆀ)
  [0x3200, 0x32ff], // 괄호·원 문자
  [0xff00, 0xffef], // 반각/전각 (｡･ﾟ)
]
const HANGUL = [0xac00, 0xd7a3]

function commonHangul() {
  const dec = new TextDecoder('euc-kr')
  const set = new Set()
  for (let hi = 0xb0; hi <= 0xc8; hi++) {
    for (let lo = 0xa1; lo <= 0xfe; lo++) {
      const cp = dec.decode(new Uint8Array([hi, lo])).codePointAt(0)
      if (cp >= HANGUL[0] && cp <= HANGUL[1]) set.add(cp)
    }
  }
  return set
}

/** 코드포인트 목록 → "U+AC00-AC01, U+AC04" 형식 */
function toUnicodeRange(codepoints) {
  const sorted = [...new Set(codepoints)].sort((a, b) => a - b)
  const parts = []
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i]
    while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1) i++
    const end = sorted[i]
    const hex = (n) => n.toString(16).toUpperCase()
    parts.push(start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`)
  }
  return parts.join(', ')
}

const common = commonHangul()
const inBase = (c) => BASE_RANGES.some(([a, b]) => c >= a && c <= b)
const isHangul = (c) => c >= HANGUL[0] && c <= HANGUL[1]

// 범위는 글꼴과 무관하게 정한다 (core·rare가 겹치지 않아야 브라우저가 필요한 파일만 받는다)
const coreSpace = []
for (const [a, b] of BASE_RANGES) for (let c = a; c <= b; c++) coreSpace.push(c)
coreSpace.push(...common)
const rareSpace = []
for (let c = HANGUL[0]; c <= HANGUL[1]; c++) if (!common.has(c)) rareSpace.push(c)

fs.mkdirSync(OUT, { recursive: true })
for (const name of FONTS) {
  const source = fs.readFileSync(path.join(SRC, `${name}.woff2`))
  const chars = fontkit.create(source).characterSet
  const core = chars.filter((c) => inBase(c) || common.has(c))
  const rare = chars.filter((c) => isHangul(c) && !common.has(c))
  for (const [part, list] of [['core', core], ['rare', rare]]) {
    const data = await subsetFont(source, String.fromCodePoint(...list), { targetFormat: 'woff2' })
    fs.writeFileSync(path.join(OUT, `${name}.${part}.woff2`), data)
    console.log(`${name}.${part}.woff2`, `${(data.length / 1024).toFixed(0)}KB`, `${list.length}자`)
  }
}

const ts = `// 자동 생성: scripts/subset-fonts.mjs — 직접 고치지 말 것
/** 처음에 받는 조각: 라틴·기호·자모·자주 쓰는 한글 2,350자 */
export const CORE_UNICODE_RANGE = ${JSON.stringify(toUnicodeRange(coreSpace))}
/** 필요할 때만 받는 조각: 나머지 한글 음절 */
export const RARE_UNICODE_RANGE = ${JSON.stringify(toUnicodeRange(rareSpace))}
`
fs.writeFileSync(path.join(ROOT, 'src', 'render', 'fontRanges.generated.ts'), ts)
console.log('fontRanges.generated.ts', `${(ts.length / 1024).toFixed(1)}KB`)
