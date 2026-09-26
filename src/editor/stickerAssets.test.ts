import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STICKER_ASSETS } from './stickerAssets'

const STICKER_DIR = join(process.cwd(), 'public', 'stickers')

function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(file)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('STICKER_ASSETS', () => {
  it('id가 겹치지 않고 파일 이름으로 쓸 수 있다', () => {
    const ids = STICKER_ASSETS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('모든 에셋의 PNG가 있고 크기가 manifest와 같다', () => {
    for (const asset of STICKER_ASSETS) {
      expect(pngSize(join(STICKER_DIR, `${asset.id}.png`))).toEqual({ width: asset.width, height: asset.height })
    }
  })

  it('manifest에 없는 PNG가 폴더에 남아 있지 않다', () => {
    const files = readdirSync(STICKER_DIR).filter((f) => f.endsWith('.png'))
    expect(files.sort()).toEqual(STICKER_ASSETS.map((a) => `${a.id}.png`).sort())
  })
})
