import { useId, useRef, useState, type ChangeEvent } from 'react'
import type { PhotoSource } from '../editor/types'
import { UPLOAD_LIMITS } from '../upload/constants'
import { uploadErrorMessage } from '../upload/messages'
import { processUpload } from '../upload/processUpload'
import './PhotoUpload.css'

interface PhotoUploadProps {
  source: PhotoSource | null
  onUpload: (source: PhotoSource) => void
}

type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string }

const MAX_MB = UPLOAD_LIMITS.maxFileBytes / (1024 * 1024)

export function PhotoUpload({ source, onUpload }: PhotoUploadProps) {
  const inputId = useId()
  const hintId = useId()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // 연속으로 파일을 고르면 마지막 선택만 반영한다
  const latestRequest = useRef(0)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    // 같은 파일을 다시 골라도 change 이벤트가 나도록 비운다
    input.value = ''
    if (!file) return

    const request = ++latestRequest.current
    setStatus({ kind: 'loading' })
    const result = await processUpload(file)
    if (request !== latestRequest.current) return

    if (result.ok) {
      onUpload(result.source)
      setStatus({ kind: 'idle' })
    } else {
      // 실패해도 기존 사진과 편집 상태는 그대로 둔다
      setStatus({ kind: 'error', message: uploadErrorMessage(result.error) })
    }
  }

  return (
    <div className="photo-upload">
      <div className="photo-upload-drop">
        <label htmlFor={inputId} className="retro-button">
          {status.kind === 'loading' ? '읽는 중...' : '찾아보기...'}
        </label>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept="image/png,image/jpeg"
          aria-describedby={hintId}
          disabled={status.kind === 'loading'}
          onChange={handleChange}
        />
        <span id={hintId} className="photo-upload-hint">
          PNG · JPEG / {MAX_MB}MB 까지 올릴 수 있어요
        </span>
      </div>

      {status.kind === 'error' && (
        <p role="alert" className="photo-upload-error">
          <strong>※ 앗!</strong> {status.message}
        </p>
      )}

      {source && (
        <figure className="photo-upload-current">
          <img src={source.dataUrl} alt="올린 사진 미리보기" />
          <figcaption>
            올린 사진 · {source.width} × {source.height}
          </figcaption>
        </figure>
      )}
    </div>
  )
}
