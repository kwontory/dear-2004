import { useEffect, useState } from 'react'
import type { EditorState } from '../editor/types'
import { cardText, loadCardFonts } from '../render/fonts'
import type { FontStatus } from '../render/renderCard'

export interface CardFontsState {
  status: FontStatus
  /** 새 글자 조각을 받을 때마다 늘어난다 (미리보기를 다시 그리게 한다) */
  version: number
}

/**
 * 카드 글자에 필요한 폰트 조각을 불러온다.
 * 처음에는 loading(글자를 그리지 않음), 이후 드문 한글을 새로 입력하면 그 조각을 받고 다시 그린다.
 */
export function useCardFonts(state: EditorState): CardFontsState {
  const [fonts, setFonts] = useState<CardFontsState>({ status: 'loading', version: 0 })
  const text = cardText(state)
  // 같은 글자 집합이면 다시 요청하지 않는다
  const charset = [...new Set(text)].sort().join('')

  useEffect(() => {
    let cancelled = false
    loadCardFonts(charset).then((ok) => {
      if (cancelled) return
      setFonts((prev) => ({ status: ok ? 'ready' : 'failed', version: prev.version + 1 }))
    })
    return () => {
      cancelled = true
    }
  }, [charset])

  return fonts
}
