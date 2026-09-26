import { useId, useState, type ChangeEvent } from 'react'
import type { EditorState } from '../editor/types'
import { downloadBlob } from '../export/exportCard'
import { jsonFileName, readStateJsonFile, stateToJson } from '../export/stateJson'

interface JsonBackupProps {
  state: EditorState
  onImport: (state: EditorState) => void
}

type Notice = { kind: 'info' | 'error'; text: string; detail?: string } | null

export function JsonBackup({ state, onImport }: JsonBackupProps) {
  const inputId = useId()
  const [notice, setNotice] = useState<Notice>(null)

  function handleExport() {
    downloadBlob(new Blob([stateToJson(state)], { type: 'application/json' }), jsonFileName())
    setNotice({ kind: 'info', text: '지금 디자인을 JSON 파일로 저장했어요.' })
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const result = await readStateJsonFile(file)
    if (!result.ok) {
      // 실패하면 지금 편집 상태는 그대로 둔다
      setNotice({ kind: 'error', text: '이 파일은 불러올 수 없어요. 그땐 그랬지에서 내보낸 JSON인지 확인해 주세요.', detail: result.error })
      return
    }
    if (!window.confirm('JSON 파일의 디자인을 불러올까요?\n지금 편집 중인 내용은 사라져요.')) return
    onImport(result.state)
    setNotice({ kind: 'info', text: 'JSON 파일의 디자인을 불러왔어요.' })
  }

  return (
    <div className="json-backup">
      <div className="json-backup-actions">
        <button type="button" className="retro-button" onClick={handleExport}>
          JSON 내보내기
        </button>
        <label htmlFor={inputId} className="retro-button">
          JSON 불러오기
        </label>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
        />
      </div>
      {notice && (
        <p
          className={`template-notice ${notice.kind === 'error' ? 'template-notice-error' : ''}`}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          {notice.kind === 'error' && <strong>※ 앗! </strong>}
          {notice.text}
          {notice.detail && <span className="json-error-detail">({notice.detail})</span>}
        </p>
      )}
    </div>
  )
}
