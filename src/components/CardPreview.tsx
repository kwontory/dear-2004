import { useEffect, useRef } from 'react'
import type { EditorState } from '../editor/types'
import { computeLayout } from '../render/layout'
import { renderCard, type CardAssets } from '../render/renderCard'
import './CardPreview.css'

const PREVIEW_MAX_WIDTH = 540
const PREVIEW_MAX_VIEWPORT_HEIGHT = 72

interface CardPreviewProps {
  state: EditorState
  assets: CardAssets
}

/**
 * 미리보기는 export와 같은 픽셀 크기로 그리고 CSS로만 축소한다.
 *
 * 카드는 문서에 붙지 않은 캔버스에 그린 뒤 화면 캔버스로 복사한다.
 * 화면에 붙은 캔버스는 페이지 CSS(사용자 지정 글꼴, letter-spacing 강제 등)가
 * 캔버스 글자에 스며들 수 있지만, 분리된 캔버스는 export와 똑같은 조건이 된다.
 */
export function CardPreview({ state, assets }: CardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const { width, height } = computeLayout(state.aspectRatio, state.theme.frame)

  useEffect(() => {
    const visible = canvasRef.current?.getContext('2d')
    if (!visible) return
    const offscreen = (offscreenRef.current ??= document.createElement('canvas'))
    offscreen.width = width
    offscreen.height = height
    const ctx = offscreen.getContext('2d')
    if (!ctx) return
    renderCard(ctx, state, assets)
    visible.clearRect(0, 0, width, height)
    visible.drawImage(offscreen, 0, 0)
  }, [state, assets, width, height])

  return (
    <div
      className="card-preview"
      // 높이를 직접 제한하면 비율이 찌그러지므로, 화면 높이에 맞춰 너비를 제한한다
      style={{
        aspectRatio: `${width} / ${height}`,
        maxWidth: `min(${PREVIEW_MAX_WIDTH}px, calc(${PREVIEW_MAX_VIEWPORT_HEIGHT}vh * ${width} / ${height}))`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={`카드 미리보기 (${state.aspectRatio})`}
      />
    </div>
  )
}
