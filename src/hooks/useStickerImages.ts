import { useEffect, useState } from 'react'
import type { Sticker, StickerKind } from '../editor/types'
import { loadSticker } from '../render/loadImages'
import type { LoadedImage } from '../render/renderCard'

/**
 * 카드에 붙은 스티커 종류의 이미지를 불러온다. 한 번 불러온 이미지는 재사용한다.
 * Preview와 Export가 같은 로더(loadSticker)를 쓴다.
 */
export function useStickerImages(stickers: readonly Sticker[]): ReadonlyMap<StickerKind, LoadedImage> {
  const [images, setImages] = useState<ReadonlyMap<StickerKind, LoadedImage>>(() => new Map())
  const wanted = [...new Set(stickers.map((s) => s.kind))].sort().join(',')

  useEffect(() => {
    const missing = wanted === '' ? [] : (wanted.split(',') as StickerKind[]).filter((k) => !images.has(k))
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(missing.map(async (kind) => [kind, await loadSticker(kind)] as const)).then((loaded) => {
      if (cancelled) return
      setImages((prev) => {
        const next = new Map(prev)
        for (const [kind, image] of loaded) if (image) next.set(kind, image)
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [wanted, images])

  return images
}
