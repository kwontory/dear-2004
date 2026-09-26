import { useEffect, useRef } from 'react'
import type { EditorState } from '../editor/types'
import { computeLayout } from '../render/layout'
import { renderCard, type LoadedPhoto } from '../render/renderCard'
import './CardPreview.css'

const PREVIEW_MAX_WIDTH = 540
const PREVIEW_MAX_VIEWPORT_HEIGHT = 72

interface CardPreviewProps {
  state: EditorState
  photo: LoadedPhoto | null
}

/**
 * 미리보기 캔버스는 export와 같은 픽셀 크기로 그리고 CSS로만 축소한다.
 * 그래서 화면과 다운로드 결과가 픽셀 단위로 같다.
 */
export function CardPreview({ state, photo }: CardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { width, height } = computeLayout(state.aspectRatio, state.theme.frame)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) renderCard(ctx, state, photo)
  }, [state, photo, width, height])

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
