import { describe, expect, it } from 'vitest'
import { splitGraphemes, wrapText } from './textLayout'

/** 모든 글자 폭 = 1, … = 1 인 가짜 measure */
const mono = (text: string) => splitGraphemes(text).length

describe('wrapText', () => {
  it('빈 문자열은 빈 한 줄 (TC-11)', () => {
    expect(wrapText('', 10, 5, mono)).toEqual({ lines: [''], truncated: false })
  })

  it('사용자 줄바꿈을 지킨다', () => {
    expect(wrapText('가나\n다라\r\n마', 10, 5, mono).lines).toEqual(['가나', '다라', '마'])
  })

  it('폭을 넘으면 공백에서 먼저 끊는다', () => {
    expect(wrapText('hello world foo', 11, 5, mono).lines).toEqual(['hello world', 'foo'])
    expect(wrapText('오늘 하루도 웃었다', 6, 5, mono).lines).toEqual(['오늘 하루도', '웃었다'])
  })

  it('공백이 없으면 글자 단위로 끊는다', () => {
    expect(wrapText('가나다라마바사', 3, 5, mono).lines).toEqual(['가나다', '라마바', '사'])
  })

  it('이모지를 반으로 자르지 않는다 (TC-14)', () => {
    const lines = wrapText('😀😭⭐️💖✨🎵', 2, 5, mono).lines
    expect(lines).toEqual(['😀😭', '⭐️💖', '✨🎵'])
  })

  it('넘치면 마지막 줄을 …로 줄인다 (TC-12)', () => {
    const r = wrapText('가'.repeat(500), 10, 3, mono)
    expect(r.truncated).toBe(true)
    expect(r.lines).toHaveLength(3)
    expect(r.lines[2]).toBe('가'.repeat(9) + '…')
    for (const line of r.lines) expect(mono(line)).toBeLessThanOrEqual(10)
  })

  it('줄바꿈이 아주 많아도 maxLines에서 멈춘다 (TC-13)', () => {
    const r = wrapText('a\n'.repeat(10_000), 10, 4, mono)
    expect(r.lines).toEqual(['a', 'a', 'a', 'a…'])
    expect(r.truncated).toBe(true)
  })

  it('HTML 같은 문자열도 그대로 글자로 다룬다 (TC-15)', () => {
    expect(wrapText('<script>alert(1)</script>', 100, 1, mono).lines).toEqual(['<script>alert(1)</script>'])
  })

  it('한글·영어·숫자·이모지 혼합 (TC-16)', () => {
    const r = wrapText('안녕 hello 123 😀 반가워', 8, 5, mono)
    for (const line of r.lines) expect(mono(line)).toBeLessThanOrEqual(8)
    expect(r.lines.join(' ').replace(/\s+/g, ' ')).toBe('안녕 hello 123 😀 반가워')
  })

  it('폭보다 넓은 글자 하나도 무한 루프 없이 한 줄에 둔다', () => {
    const wide = (t: string) => splitGraphemes(t).length * 100
    expect(wrapText('가나', 10, 5, wide).lines).toEqual(['가', '나'])
  })

  it('maxLines 0 / 음수 / NaN 폭도 안전하다', () => {
    expect(wrapText('abc', 10, 0, mono)).toEqual({ lines: [], truncated: true })
    expect(wrapText('abc', NaN, 2, mono).lines.length).toBeLessThanOrEqual(2)
    expect(wrapText('abc', -5, 2, mono).lines.length).toBeLessThanOrEqual(2)
  })
})
