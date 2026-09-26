import { useEffect, useState } from 'react'
import type { PhotoSource } from '../editor/types'
import type { LoadedPhoto } from '../render/renderCard'

/**
 * EditorState의 data URL을 디코딩된 이미지로 바꾼다.
 * Preview와 Export가 같은 LoadedPhoto를 쓰도록 App에서 한 번만 호출한다.
 */
export function useLoadedPhoto(source: PhotoSource | null): LoadedPhoto | null {
  const dataUrl = source?.dataUrl ?? null
  const [loaded, setLoaded] = useState<{ dataUrl: string; photo: LoadedPhoto } | null>(null)

  useEffect(() => {
    if (!dataUrl) return
    let cancelled = false
    const image = new Image()
    image.src = dataUrl
    image
      .decode()
      .then(() => {
        if (!cancelled) {
          setLoaded({ dataUrl, photo: { image, width: image.naturalWidth, height: image.naturalHeight } })
        }
      })
      .catch(() => {
        // 검증을 통과한 data URL이라 실패할 일은 드물다. 실패하면 사진 없이 그린다.
        if (!cancelled) setLoaded(null)
      })
    return () => {
      cancelled = true
    }
  }, [dataUrl])

  // 이전 사진이 남아 있어도 현재 source와 다르면 쓰지 않는다
  return loaded && loaded.dataUrl === dataUrl ? loaded.photo : null
}
