import type { AspectRatio, EditorState } from '../editor/types'
import { computeLayout } from '../render/layout'
import { loadCardAssets } from '../render/loadImages'
import { renderCard } from '../render/renderCard'

export type ExportFormat = 'png' | 'jpeg'

export const EXPORT_MIME: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
}

export const JPEG_QUALITY = 0.92

/** JPEG는 투명도가 없으므로 카드 아래에 먼저 칠하는 색 */
const JPEG_MATTE = '#ffffff'

const pad = (n: number) => String(n).padStart(2, '0')

/** 예: dear2004-4x5-20261027-031405.png (사용자 입력은 파일 이름에 넣지 않는다) */
export function exportFileName(aspectRatio: AspectRatio, format: ExportFormat, now: Date = new Date()): string {
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const ext = format === 'png' ? 'png' : 'jpg'
  return `dear2004-${aspectRatio.replace(':', 'x')}-${date}-${time}.${ext}`
}

export class ExportError extends Error {}

/**
 * 미리보기와 같은 renderCard로 분리된 캔버스에 그린 뒤 인코딩한다.
 * 폰트·사진·스티커가 모두 준비될 때까지 기다린다.
 */
export async function renderCardToCanvas(state: EditorState, format: ExportFormat): Promise<HTMLCanvasElement> {
  const assets = await loadCardAssets(state)
  const { width, height } = computeLayout(state.aspectRatio, state.theme.frame)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ExportError('canvas')
  if (format === 'jpeg') {
    ctx.fillStyle = JPEG_MATTE
    ctx.fillRect(0, 0, width, height)
  }
  renderCard(ctx, state, assets)
  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: ExportFormat): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ExportError('encode'))),
      EXPORT_MIME[format],
      format === 'jpeg' ? JPEG_QUALITY : undefined,
    )
  })
}

/** 브라우저 다운로드를 시작한다 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // 일부 브라우저는 클릭 직후 해제하면 다운로드가 취소되므로 잠시 뒤에 해제한다
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export async function exportCard(state: EditorState, format: ExportFormat): Promise<void> {
  const canvas = await renderCardToCanvas(state, format)
  const blob = await canvasToBlob(canvas, format)
  downloadBlob(blob, exportFileName(state.aspectRatio, format))
}
