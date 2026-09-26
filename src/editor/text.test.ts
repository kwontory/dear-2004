import { describe, expect, it } from 'vitest'
import { insertText, truncateText } from './text'

describe('truncateText', () => {
  it('이모지를 반으로 자르지 않는다', () => {
    expect(truncateText('ab😀', 3)).toBe('ab')
    expect(truncateText('ab😀', 4)).toBe('ab😀')
    expect(truncateText('abc', 10)).toBe('abc')
  })
})

describe('insertText (특수문자 넣기)', () => {
  it('커서 위치에 넣고 커서를 뒤로 옮긴다', () => {
    expect(insertText('오늘도 맑음', '★', 3, 3, 100)).toEqual({ value: '오늘도★ 맑음', cursor: 4 })
  })

  it('선택 영역을 대체한다', () => {
    expect(insertText('abcdef', '♡', 1, 4, 100)).toEqual({ value: 'a♡ef', cursor: 2 })
  })

  it('최대 길이를 넘으면 들어갈 만큼만 넣는다', () => {
    expect(insertText('abc', '^^', 3, 3, 4)).toEqual({ value: 'abc^', cursor: 4 })
    expect(insertText('abcd', '★', 4, 4, 4)).toEqual({ value: 'abcd', cursor: 4 })
  })

  it('범위를 벗어난 selection도 안전하게 처리한다', () => {
    expect(insertText('abc', '~', -5, 99, 100)).toEqual({ value: '~', cursor: 1 })
    expect(insertText('abc', '~', 99, 1, 100)).toEqual({ value: 'abc~', cursor: 4 })
  })
})
