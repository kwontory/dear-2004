import { describe, expect, it } from 'vitest'
import { EXPORT_MIME, exportFileName } from './exportCard'

describe('exportFileName', () => {
  const when = new Date(2004, 9, 27, 3, 14, 5)

  it('화면비·날짜·시간·확장자를 담는다', () => {
    expect(exportFileName('4:5', 'png', when)).toBe('dear2004-4x5-20041027-031405.png')
    expect(exportFileName('9:16', 'jpeg', when)).toBe('dear2004-9x16-20041027-031405.jpg')
    expect(exportFileName('1:1', 'png', when)).toBe('dear2004-1x1-20041027-031405.png')
  })

  it('파일 이름에 쓸 수 없는 문자가 없다', () => {
    expect(exportFileName('9:16', 'png', when)).toMatch(/^[a-z0-9.-]+$/)
  })
})

describe('EXPORT_MIME', () => {
  it('PNG와 JPEG만 지원한다', () => {
    expect(EXPORT_MIME).toEqual({ png: 'image/png', jpeg: 'image/jpeg' })
  })
})
