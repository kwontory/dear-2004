import { useId, useState, type FormEvent } from 'react'
import type { EditorState } from '../editor/types'
import { useTemplates } from '../hooks/useTemplates'
import { normalizeTemplateName, TEMPLATE_NAME_MAX, type TemplateRecord } from '../templates/templateRecord'
import './TemplatePanel.css'

interface TemplatePanelProps {
  state: EditorState
  onLoad: (state: EditorState) => void
}

type Notice = { kind: 'info' | 'error'; text: string } | null

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function TemplatePanel({ state, onLoad }: TemplatePanelProps) {
  const nameId = useId()
  const { templates, status, create, overwrite, rename, remove } = useTemplates()
  const [name, setName] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const ready = status.kind === 'ready'

  const report = (error: string | null, success: string) =>
    setNotice(error ? { kind: 'error', text: error } : { kind: 'info', text: success })

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeTemplateName(name)
    if (!normalized) {
      setNotice({ kind: 'error', text: `템플릿 이름을 1~${TEMPLATE_NAME_MAX}자로 적어 주세요.` })
      return
    }
    const error = await create(normalized, state)
    if (!error) setName('')
    report(error, `'${normalized}' 템플릿으로 저장했어요.`)
  }

  function handleLoad(record: TemplateRecord) {
    if (!window.confirm(`'${record.name}'을(를) 불러올까요?\n지금 편집 중인 내용은 사라져요.`)) return
    onLoad(structuredClone(record.state))
    setNotice({ kind: 'info', text: `'${record.name}'을(를) 불러왔어요.` })
  }

  async function handleOverwrite(record: TemplateRecord) {
    if (!window.confirm(`'${record.name}'을(를) 지금 디자인으로 덮어쓸까요?`)) return
    report(await overwrite(record, state), `'${record.name}'을(를) 지금 디자인으로 바꿨어요.`)
  }

  async function handleRename(event: FormEvent, record: TemplateRecord) {
    event.preventDefault()
    const normalized = normalizeTemplateName(renameValue)
    if (!normalized) {
      setNotice({ kind: 'error', text: `템플릿 이름을 1~${TEMPLATE_NAME_MAX}자로 적어 주세요.` })
      return
    }
    const error = await rename(record, normalized)
    if (!error) setRenamingId(null)
    report(error, `이름을 '${normalized}'(으)로 바꿨어요.`)
  }

  async function handleRemove(record: TemplateRecord) {
    if (!window.confirm(`'${record.name}'을(를) 지울까요? 되돌릴 수 없어요.`)) return
    report(await remove(record), `'${record.name}'을(를) 지웠어요.`)
  }

  return (
    <div className="template-panel">
      <aside className="privacy-note" aria-label="개인정보 안내">
        <p>
          <strong>※ 공용 컴퓨터에서 쓰고 있나요?</strong>
        </p>
        <p>
          사진과 글은 어디에도 올라가지 않고 지금 쓰는 브라우저 안에만 저장돼요. 그래서 템플릿을 저장해 두면
          다음 사람이 이 컴퓨터를 켰을 때 사진까지 그대로 보일 수 있어요.
        </p>
        <p>PC방·학교·회사 컴퓨터라면 다 쓰고 나서 저장한 템플릿을 꼭 지워 주세요.</p>
      </aside>

      <form className="template-create" onSubmit={handleCreate}>
        <label htmlFor={nameId}>템플릿 이름</label>
        <div className="template-create-row">
          <input
            id={nameId}
            type="text"
            value={name}
            maxLength={TEMPLATE_NAME_MAX}
            placeholder="예: 여름방학 일기"
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <button type="submit" className="retro-button" disabled={!ready}>
            저장
          </button>
        </div>
      </form>

      {status.kind === 'loading' && <p className="control-hint">저장된 템플릿을 불러오는 중...</p>}
      {status.kind === 'error' && (
        <p role="alert" className="template-notice template-notice-error">
          <strong>※ 앗!</strong> {status.message}
        </p>
      )}
      {status.kind === 'ready' && !status.persistent && (
        <p className="template-notice template-notice-error" role="status">
          <strong>※ 주의</strong> 이 브라우저에서는 템플릿을 저장해 둘 수 없어서, 새로고침하면 사라져요.
        </p>
      )}
      {status.kind === 'ready' && status.skipped > 0 && (
        <p className="control-hint" role="status">
          손상된 템플릿 {status.skipped}개는 불러오지 않았어요.
        </p>
      )}
      {notice && (
        <p
          className={`template-notice ${notice.kind === 'error' ? 'template-notice-error' : ''}`}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          {notice.kind === 'error' && <strong>※ 앗! </strong>}
          {notice.text}
        </p>
      )}

      {ready && templates.length === 0 && <p className="control-hint">아직 저장한 템플릿이 없어요.</p>}
      <ul className="template-list">
        {templates.map((record) => (
          <li key={record.id} className="template-item">
            {renamingId === record.id ? (
              <form className="template-rename" onSubmit={(e) => handleRename(e, record)}>
                <input
                  type="text"
                  aria-label={`'${record.name}' 새 이름`}
                  value={renameValue}
                  maxLength={TEMPLATE_NAME_MAX}
                  autoFocus
                  onChange={(e) => setRenameValue(e.currentTarget.value)}
                />
                <button type="submit" className="retro-button retro-button-small">
                  확인
                </button>
                <button type="button" className="retro-button retro-button-small" onClick={() => setRenamingId(null)}>
                  취소
                </button>
              </form>
            ) : (
              <div className="template-item-head">
                <span className="template-name">{record.name}</span>
                <span className="template-meta">
                  {record.state.aspectRatio} · {dateFormat.format(record.updatedAt)}
                </span>
              </div>
            )}
            <div className="template-actions">
              <button type="button" className="text-button" onClick={() => handleLoad(record)}>
                불러오기
              </button>
              <button type="button" className="text-button" onClick={() => handleOverwrite(record)}>
                덮어쓰기
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setRenamingId(record.id)
                  setRenameValue(record.name)
                }}
              >
                이름 바꾸기
              </button>
              <button type="button" className="text-button text-button-danger" onClick={() => handleRemove(record)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
