import { useId } from 'react'
import { BACKGROUND_IDS, SOLID_COLOR_PRESETS } from '../editor/constants'
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
  const colorId = useId()
  const setColor = (solidColor: string) => dispatch({ type: 'updateTheme', patch: { solidColor } })

  return (
    <>
      <fieldset className="choice-group skin-group">
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
              <span
                aria-hidden="true"
                className={`skin-swatch skin-swatch-${skin}`}
                style={skin === 'solid' ? { background: theme.solidColor } : undefined}
              />
              <span className="skin-label">{SKIN_LABELS[skin]}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {theme.background === 'solid' && (
        <div className="solid-color-panel">
          <div className="solid-color-row">
            <label htmlFor={colorId}>배경색</label>
            <input
              id={colorId}
              type="color"
              className="solid-color-input"
              value={theme.solidColor}
              onChange={(e) => setColor(e.currentTarget.value)}
            />
            <output htmlFor={colorId} className="control-hint">
              {theme.solidColor}
            </output>
          </div>
          <div className="solid-color-presets" role="group" aria-label="자주 쓰는 색">
            {SOLID_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                className="solid-color-chip"
                aria-label={`${preset.label} ${preset.hex}`}
                aria-pressed={theme.solidColor === preset.hex}
                title={preset.label}
                style={{ background: preset.hex }}
                onClick={() => setColor(preset.hex)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
