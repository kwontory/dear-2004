import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { hitTestStickers, stickerBox } from '../editor/stickerGeometry'
import type { EditorState } from '../editor/types'
import { cardSize } from '../render/layout'
import { renderCard, type CardAssets } from '../render/renderCard'
import './CardPreview.css'

const PREVIEW_MAX_WIDTH = 540
const PREVIEW_MAX_VIEWPORT_HEIGHT = 62
/** 손가락으로 잡기 쉽도록 스티커 판정 영역을 넓히는 정도 (카드 너비 대비) */
const HIT_PADDING = { mouse: 0.005, touch: 0.025 } as const

interface CardPreviewProps {
  state: EditorState
  assets: CardAssets
  selectedStickerId: string | null
  onSelectSticker: (id: string | null) => void
  onMoveSticker: (id: string, x: number, y: number) => void
}

interface DragState {
  id: string
  pointerId: number
  /** 잡은 지점과 스티커 중심의 차이 (카드 px) */
  offsetX: number
  offsetY: number
}

/**
 * 미리보기는 export와 같은 픽셀 크기로 그리고 CSS로만 축소한다.
 *
 * 카드는 문서에 붙지 않은 캔버스에 그린 뒤 화면 캔버스로 복사한다.
 * 화면에 붙은 캔버스는 페이지 CSS(사용자 지정 글꼴, letter-spacing 강제 등)가
 * 캔버스 글자에 스며들 수 있지만, 분리된 캔버스는 export와 똑같은 조건이 된다.
 * 스티커 선택 테두리는 캔버스 위에 겹친 HTML이라 저장 이미지에 들어가지 않는다.
 */
export function CardPreview({ state, assets, selectedStickerId, onSelectSticker, onMoveSticker }: CardPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const { width, height } = cardSize(state.aspectRatio)

  // 이벤트 핸들러가 항상 최신 스티커 목록을 보도록
  const stickersRef = useRef(state.stickers)
  useLayoutEffect(() => {
    stickersRef.current = state.stickers
  }, [state.stickers])

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

  /** 화면 좌표 → 카드 px 좌표 */
  function toCard(clientX: number, clientY: number) {
    const rect = wrapperRef.current!.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
    }
  }

  function hit(clientX: number, clientY: number, touch: boolean) {
    const p = toCard(clientX, clientY)
    const padding = width * (touch ? HIT_PADDING.touch : HIT_PADDING.mouse)
    return { point: p, sticker: hitTestStickers(stickersRef.current, p.x, p.y, width, height, padding) }
  }

  // 스티커를 잡은 터치만 페이지 스크롤을 막는다 (빈 곳을 끌면 평소처럼 스크롤)
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t && e.touches.length === 1 && hit(t.clientX, t.clientY, true).sticker) e.preventDefault()
    }
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    return () => el.removeEventListener('touchstart', onTouchStart)
  })

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const { point, sticker } = hit(e.clientX, e.clientY, e.pointerType !== 'mouse')
    if (!sticker) {
      onSelectSticker(null)
      return
    }
    onSelectSticker(sticker.id)
    dragRef.current = {
      id: sticker.id,
      pointerId: e.pointerId,
      offsetX: sticker.x * width - point.x,
      offsetY: sticker.y * height - point.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const p = toCard(e.clientX, e.clientY)
    onMoveSticker(drag.id, (p.x + drag.offsetX) / width, (p.y + drag.offsetY) / height)
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  const selected = state.stickers.find((s) => s.id === selectedStickerId) ?? null
  const box = selected ? stickerBox(selected, width, height) : null

  return (
    <div
      ref={wrapperRef}
      className="card-preview"
      // 높이를 직접 제한하면 비율이 찌그러지므로, 화면 높이에 맞춰 너비를 제한한다
      style={{
        aspectRatio: `${width} / ${height}`,
        maxWidth: `min(${PREVIEW_MAX_WIDTH}px, calc(${PREVIEW_MAX_VIEWPORT_HEIGHT}vh * ${width} / ${height}))`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={`카드 미리보기 (${state.aspectRatio})`}
      />
      {box && (
        <div
          className="sticker-selection"
          aria-hidden="true"
          style={{
            left: `${((box.cx - box.width / 2) / width) * 100}%`,
            top: `${((box.cy - box.height / 2) / height) * 100}%`,
            width: `${(box.width / width) * 100}%`,
            height: `${(box.height / height) * 100}%`,
            transform: `rotate(${box.rotation}rad)`,
          }}
        />
      )}
    </div>
  )
}
