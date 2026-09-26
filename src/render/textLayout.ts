/**
 * 캔버스 문구 줄바꿈. measure는 캔버스의 measureText 폭을 넘겨받아 테스트에서 바꿔 끼울 수 있다.
 *
 * 정책 (TC-11 ~ TC-16):
 * - 사용자가 넣은 줄바꿈을 지킨다
 * - 한 줄이 maxWidth를 넘으면 공백에서 먼저 끊고, 공백이 없으면 글자(grapheme) 단위로 끊는다
 * - 이모지·결합 문자는 반으로 자르지 않는다 (Intl.Segmenter)
 * - maxLines를 넘으면 마지막 줄 끝을 "…"로 줄인다
 */
export type Measure = (text: string) => number

const ELLIPSIS = '…'

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null

export function splitGraphemes(text: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment)
  return Array.from(text)
}

/** 한 문단(줄바꿈 없음)을 폭에 맞춰 여러 줄로 나눈다 */
function wrapParagraph(paragraph: string, maxWidth: number, measure: Measure): string[] {
  if (paragraph === '') return ['']
  const lines: string[] = []
  const chars = splitGraphemes(paragraph)
  let line = ''
  let lastSpace = -1 // line 안에서 마지막 공백 뒤 위치

  for (const ch of chars) {
    const candidate = line + ch
    if (measure(candidate) <= maxWidth || line === '') {
      line = candidate
      if (ch === ' ') lastSpace = line.length
      continue
    }
    if (lastSpace > 0 && ch !== ' ') {
      // 공백에서 끊고 남은 단어를 다음 줄로
      lines.push(line.slice(0, lastSpace).trimEnd())
      line = line.slice(lastSpace) + ch
    } else {
      lines.push(line.trimEnd())
      line = ch === ' ' ? '' : ch
    }
    lastSpace = -1
    // 다음 줄로 넘어온 부분에 공백이 남아 있을 수 있다
    const space = line.lastIndexOf(' ')
    if (space >= 0) lastSpace = space + 1
  }
  lines.push(line)
  return lines
}

/** 마지막 줄을 "…"가 들어갈 만큼 줄인다 */
function withEllipsis(line: string, maxWidth: number, measure: Measure): string {
  const chars = splitGraphemes(line)
  while (chars.length > 0 && measure(chars.join('') + ELLIPSIS) > maxWidth) chars.pop()
  return chars.join('').trimEnd() + ELLIPSIS
}

export interface WrapResult {
  lines: string[]
  /** maxLines를 넘어 잘렸는지 */
  truncated: boolean
}

export function wrapText(text: string, maxWidth: number, maxLines: number, measure: Measure): WrapResult {
  const width = Number.isFinite(maxWidth) ? Math.max(1, maxWidth) : 1
  const limit = Number.isFinite(maxLines) ? Math.max(0, Math.floor(maxLines)) : 0
  const all: string[] = []
  for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
    all.push(...wrapParagraph(paragraph, width, measure))
    if (all.length > limit) break // 넘치면 더 계산하지 않는다 (줄바꿈 수천 개 대비)
  }
  if (all.length <= limit) return { lines: all, truncated: false }
  if (limit === 0) return { lines: [], truncated: true }
  const lines = all.slice(0, limit)
  lines[limit - 1] = withEllipsis(lines[limit - 1], width, measure)
  return { lines, truncated: true }
}
