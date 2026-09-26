import { useEffect, useState } from 'react'
import { loadCardFonts } from '../render/fonts'
import type { FontStatus } from '../render/renderCard'

/** 카드용 픽셀 폰트를 불러오고 상태를 알려준다 */
export function useCardFonts(): FontStatus {
  const [status, setStatus] = useState<FontStatus>('loading')
  useEffect(() => {
    let cancelled = false
    loadCardFonts().then((ok) => {
      if (!cancelled) setStatus(ok ? 'ready' : 'failed')
    })
    return () => {
      cancelled = true
    }
  }, [])
  return status
}
