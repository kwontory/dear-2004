import { useEffect, useState } from 'react'
import { stickerAssetUrl } from '../editor/stickerAssets'
import type { Sticker, StickerKind } from '../editor/types'
import type { LoadedImage } from '../render/renderCard'

/**
 * 카드에 붙은 스티커 종류의 이미지를 불러온다. 한 번 불러온 이미지는 재사용한다.
 * Preview와 Export가 같은 Map을 쓰도록 App에서 한 번만 호출한다.
 */
export function useStickerImages(stickers: readonly Sticker[]): ReadonlyMap<StickerKind, LoadedImage> {
  const [images, setImages] = useState<ReadonlyMap<StickerKind, LoadedImage>>(() => new Map())
  const wanted = [...new Set(stickers.map((s) => s.kind))].sort().join(',')

  useEffect(() => {
    const missing = wanted === '' ? [] : (wanted.split(',') as StickerKind[]).filter((k) => !images.has(k))
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(
      missing.map(async (kind) => {
        const image = new Image()
        image.src = stickerAssetUrl(kind)
        try {
          await image.decode()
          return [kind, { image, width: image.naturalWidth, height: image.naturalHeight }] as const
        } catch {
          return null
        }
      }),
    ).then((loaded) => {
      if (cancelled) return
      setImages((prev) => {
        const next = new Map(prev)
        for (const entry of loaded) if (entry) next.set(entry[0], entry[1])
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [wanted, images])

  return images
}
