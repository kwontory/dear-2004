import { BACKGROUND_IDS } from '../editor/constants'
import type { EditorAction } from '../editor/reducer'
import type { CardTheme, FrameId } from '../editor/types'
import { FRAME_LABELS } from '../render/layout'
import { SKIN_LABELS } from '../render/skins'
import './ThemeControls.css'

/** 시안 순서: 감성 사진 → 미니홈피 → 사진첩 → 다이어리 */
const FRAME_ORDER: readonly FrameId[] = ['memo', 'minihome', 'album', 'diary']

interface ThemeControlsProps {
  theme: CardTheme
  dispatch: (action: EditorAction) => void
}

export function FrameSelector({ theme, dispatch }: ThemeControlsProps) {
  return (
    <fieldset className="choice-group" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
      <legend className="visually-hidden">틀 고르기</legend>
      {FRAME_ORDER.map((frame) => (
        <label key={frame} className="choice">
          <input
            type="radio"
            name="card-frame"
            className="visually-hidden"
            value={frame}
            checked={theme.frame === frame}
            onChange={() => dispatch({ type: 'updateTheme', patch: { frame } })}
          />
          <span className="choice-face frame-face">
            <span aria-hidden="true" className={`frame-icon frame-icon-${frame}`} />
            {FRAME_LABELS[frame]}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export function SkinSelector({ theme, dispatch }: ThemeControlsProps) {
  return (
    <fieldset className="choice-group" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
      <legend className="visually-hidden">스킨 (배경)</legend>
      {BACKGROUND_IDS.map((skin) => (
        <label key={skin} className="choice">
          <input
            type="radio"
            name="card-skin"
            className="visually-hidden"
            value={skin}
            checked={theme.background === skin}
            onChange={() => dispatch({ type: 'updateTheme', patch: { background: skin } })}
          />
          <span className="choice-face skin-face">
            <span aria-hidden="true" className={`skin-swatch skin-swatch-${skin}`} />
            <span className="skin-label">{SKIN_LABELS[skin]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
