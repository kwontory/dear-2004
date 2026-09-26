import { useId, useRef } from 'react'
import { COMMENT_LIMITS, COUNTER_MAX, SPECIAL_CHARACTERS, TEXT_MAX_LENGTHS } from '../editor/constants'
import type { EditorAction } from '../editor/reducer'
import { insertText } from '../editor/text'
import type { EditorState, TextFieldKey } from '../editor/types'
import './TextControls.css'

interface TextControlsProps {
  state: EditorState
  dispatch: (action: EditorAction) => void
}

type TextInput = HTMLInputElement | HTMLTextAreaElement

const FIELDS: { key: Exclude<TextFieldKey, 'date'>; label: string; multiline?: boolean; placeholder: string }[] = [
  { key: 'title', label: '제목', placeholder: '10월 27일 우리 100일이ㄷㅏ~♡' },
  { key: 'status', label: 'TODAY is.. (오늘 기분)', placeholder: '♡행복' },
  { key: 'body', label: '감성 문구', multiline: true, placeholder: '오늘 하루도...\n아무렇지 않은 척 웃었ㄷㅏ...' },
  { key: 'bgm', label: '♬ BGM', placeholder: '우리들의 여름 노래' },
  { key: 'signature', label: '닉네임 / 서명', placeholder: '★나야나★' },
]

let commentSeq = 0
const newCommentId = () => `c${Date.now().toString(36)}${(commentSeq++).toString(36)}`

export function TextControls({ state, dispatch }: TextControlsProps) {
  const idPrefix = useId()
  const refs = useRef<Partial<Record<TextFieldKey, TextInput | null>>>({})
  // 마지막으로 포커스된 문구 칸 (특수문자를 넣을 곳)
  const lastFocused = useRef<Exclude<TextFieldKey, 'date'>>('body')

  function insertSymbol(symbol: string) {
    const field = lastFocused.current
    const el = refs.current[field]
    const value = state.text[field]
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = insertText(value, symbol, start, end, TEXT_MAX_LENGTHS[field])
    dispatch({ type: 'setText', field, value: next.value })
    // 상태 반영 뒤 커서를 넣은 글자 뒤로 옮긴다
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(next.cursor, next.cursor)
    })
  }

  return (
    <div className="text-controls">
      {FIELDS.map((field) => {
        const id = `${idPrefix}-${field.key}`
        const value = state.text[field.key]
        const max = TEXT_MAX_LENGTHS[field.key]
        const common = {
          id,
          value,
          maxLength: max,
          placeholder: field.placeholder,
          onFocus: () => (lastFocused.current = field.key),
          onChange: (e: { currentTarget: TextInput }) =>
            dispatch({ type: 'setText', field: field.key, value: e.currentTarget.value }),
        }
        return (
          <div key={field.key} className="text-field">
            <label htmlFor={id}>{field.label}</label>
            {field.multiline ? (
              <>
                <textarea
                  {...common}
                  ref={(el) => void (refs.current[field.key] = el)}
                  rows={5}
                  aria-describedby={`${id}-count`}
                />
                <span id={`${id}-count`} className="text-count">
                  {value.length} / {max}
                </span>
              </>
            ) : (
              <input {...common} ref={(el) => void (refs.current[field.key] = el)} type="text" />
            )}
          </div>
        )
      })}

      <fieldset className="symbol-picker">
        <legend>특수문자 넣기</legend>
        {SPECIAL_CHARACTERS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            className="symbol-button"
            aria-label={`${symbol} 넣기`}
            // 버튼을 눌러도 입력칸 포커스·커서가 유지되도록 기본 동작을 막는다
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol(symbol)}
          >
            {symbol}
          </button>
        ))}
      </fieldset>

      <CounterControls state={state} dispatch={dispatch} />
      <CommentControls state={state} dispatch={dispatch} />
    </div>
  )
}

function CounterControls({ state, dispatch }: TextControlsProps) {
  const id = useId()
  const counter = state.counter
  const update = (patch: Partial<typeof counter>) => dispatch({ type: 'updateCounter', patch })
  const toNumber = (raw: string) => (raw.trim() === '' ? 0 : Number(raw))

  return (
    <fieldset className="counter-controls">
      <legend>방문자 수</legend>
      <label className="checkbox-row">
        <input type="checkbox" checked={counter.visible} onChange={(e) => update({ visible: e.currentTarget.checked })} />
        TODAY / TOTAL 보이기
      </label>
      <div className="counter-inputs">
        <label htmlFor={`${id}-today`}>TODAY</label>
        <input
          id={`${id}-today`}
          type="number"
          inputMode="numeric"
          min={0}
          max={COUNTER_MAX}
          value={counter.today}
          disabled={!counter.visible}
          onChange={(e) => update({ today: toNumber(e.currentTarget.value) })}
        />
        <label htmlFor={`${id}-total`}>TOTAL</label>
        <input
          id={`${id}-total`}
          type="number"
          inputMode="numeric"
          min={0}
          max={COUNTER_MAX}
          value={counter.total}
          disabled={!counter.visible}
          onChange={(e) => update({ total: toNumber(e.currentTarget.value) })}
        />
      </div>
    </fieldset>
  )
}

function CommentControls({ state, dispatch }: TextControlsProps) {
  const idPrefix = useId()
  const full = state.comments.length >= COMMENT_LIMITS.maxCount

  return (
    <fieldset className="comment-controls">
      <legend>
        댓글 ({state.comments.length}/{COMMENT_LIMITS.maxCount})
      </legend>
      {state.comments.map((comment, index) => (
        <div key={comment.id} className="comment-row">
          <span aria-hidden="true">ㄴ</span>
          <input
            type="text"
            aria-label={`댓글 ${index + 1} 닉네임`}
            id={`${idPrefix}-${comment.id}-author`}
            placeholder="닉네임"
            maxLength={COMMENT_LIMITS.maxAuthorLength}
            value={comment.author}
            onChange={(e) => dispatch({ type: 'updateComment', id: comment.id, patch: { author: e.currentTarget.value } })}
          />
          <input
            type="text"
            aria-label={`댓글 ${index + 1} 내용`}
            placeholder="퍼가요~♡"
            maxLength={COMMENT_LIMITS.maxTextLength}
            value={comment.text}
            onChange={(e) => dispatch({ type: 'updateComment', id: comment.id, patch: { text: e.currentTarget.value } })}
          />
          <button
            type="button"
            className="retro-button retro-button-small"
            aria-label={`댓글 ${index + 1} 지우기`}
            onClick={() => dispatch({ type: 'removeComment', id: comment.id })}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="retro-button retro-button-small"
        disabled={full}
        onClick={() => dispatch({ type: 'addComment', id: newCommentId() })}
      >
        + 댓글 달기
      </button>
    </fieldset>
  )
}
