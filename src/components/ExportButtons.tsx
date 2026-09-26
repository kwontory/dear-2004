import { useState } from 'react'
import type { EditorState } from '../editor/types'
import { exportCard, type ExportFormat } from '../export/exportCard'
import { computeLayout } from '../render/layout'
import './ExportButtons.css'

interface ExportButtonsProps {
  state: EditorState
}

type Status = { kind: 'idle' } | { kind: 'busy'; format: ExportFormat } | { kind: 'error' }

export function ExportButtons({ state }: ExportButtonsProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const { width, height } = computeLayout(state.aspectRatio, state.theme.frame)
  const busy = status.kind === 'busy'

  async function handleExport(format: ExportFormat) {
    setStatus({ kind: 'busy', format })
    try {
      await exportCard(state, format)
      setStatus({ kind: 'idle' })
    } catch {
      setStatus({ kind: 'error' })
    }
  }

  return (
    <div className="export-buttons">
      <div className="export-actions">
        <button
          type="button"
          className="retro-button retro-button-primary"
          disabled={busy}
          onClick={() => handleExport('png')}
        >
          {status.kind === 'busy' && status.format === 'png' ? '저장하는 중...' : 'PNG로 저장하기'}
        </button>
        <button type="button" className="retro-button" disabled={busy} onClick={() => handleExport('jpeg')}>
          {status.kind === 'busy' && status.format === 'jpeg' ? '저장하는 중...' : 'JPEG로 저장하기'}
        </button>
      </div>
      <p className="control-hint export-size">
        저장 크기 {width} × {height} px
      </p>
      {status.kind === 'error' && (
        <p role="alert" className="export-error">
          <strong>※ 앗!</strong> 이미지를 저장하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  )
}
