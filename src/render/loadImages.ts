import { stickerAssetUrl } from '../editor/stickerAssets'
import type { EditorState, StickerKind } from '../editor/types'
import { loadCardFonts } from './fonts'
import type { CardAssets, LoadedImage } from './renderCard'

/** 이미지 하나를 디코딩까지 끝낸다. 실패하면 null */
export async function loadImage(src: string): Promise<LoadedImage | null> {
  const image = new Image()
  image.src = src
  try {
    await image.decode()
    return { image, width: image.naturalWidth, height: image.naturalHeight }
  } catch {
    return null
  }
}

/** 브라우저 캐시와 별개로, 한 번 디코딩한 스티커는 재사용한다 */
const stickerCache = new Map<StickerKind, Promise<LoadedImage | null>>()

export function loadSticker(kind: StickerKind): Promise<LoadedImage | null> {
  let pending = stickerCache.get(kind)
  if (!pending) {
    pending = loadImage(stickerAssetUrl(kind))
    stickerCache.set(kind, pending)
  }
  return pending
}

/**
 * 카드 한 장을 그리는 데 필요한 모든 자원을 끝까지 불러온다 (다운로드용).
 * 미리보기는 불러오는 대로 다시 그리지만, 다운로드는 반쯤 그려진 결과를 저장하면 안 된다.
 */
export async function loadCardAssets(state: EditorState): Promise<CardAssets> {
  const kinds = [...new Set(state.stickers.map((s) => s.kind))]
  const [fontsOk, photo, stickers] = await Promise.all([
    loadCardFonts(),
    state.photo.source ? loadImage(state.photo.source.dataUrl) : Promise.resolve(null),
    Promise.all(kinds.map(async (kind) => [kind, await loadSticker(kind)] as const)),
  ])
  const stickerMap = new Map<StickerKind, LoadedImage>()
  for (const [kind, image] of stickers) if (image) stickerMap.set(kind, image)
  return { photo, stickers: stickerMap, fonts: fontsOk ? 'ready' : 'failed' }
}
