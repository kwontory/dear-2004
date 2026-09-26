import { useId } from 'react'
import { STICKER_LIMITS } from '../editor/constants'
import type { EditorAction } from '../editor/reducer'
import { STICKER_ASSETS, stickerAssetUrl } from '../editor/stickerAssets'
import type { Sticker, StickerKind } from '../editor/types'
import './StickerControls.css'

interface StickerPickerProps {
  onAdd: (kind: StickerKind) => void
  disabled: boolean
}

export function StickerPicker({ onAdd, disabled }: StickerPickerProps) {
  return (
    <div className="sticker-picker" role="group" aria-label="스티커 붙이기">
      {STICKER_ASSETS.map((asset) => (
        <button
          key={asset.id}
          type="button"
          className="sticker-button"
          aria-label={`${asset.label} 붙이기`}
          title={asset.label}
          disabled={disabled}
          onClick={() => onAdd(asset.id)}
        >
          <img src={stickerAssetUrl(asset.id)} alt="" loading="lazy" draggable={false} />
        </button>
      ))}
    </div>
  )
}

interface SelectedStickerProps {
  sticker: Sticker
  dispatch: (action: EditorAction) => void
  onDeselect: () => void
}

const PERCENT = 100

/** 끌기 대신 쓸 수 있는 키보드·정밀 조절 */
export function SelectedStickerControls({ sticker, dispatch, onDeselect }: SelectedStickerProps) {
  const idPrefix = useId()
  const label = STICKER_ASSETS.find((a) => a.id === sticker.kind)?.label ?? '스티커'
  const update = (patch: Partial<Omit<Sticker, 'id'>>) => dispatch({ type: 'updateSticker', id: sticker.id, patch })

  const sliders = [
    {
      key: 'size',
      label: '크기',
      min: STICKER_LIMITS.minSize * PERCENT,
      max: STICKER_LIMITS.maxSize * PERCENT,
      value: sticker.size * PERCENT,
      unit: '%',
      apply: (v: number) => update({ size: v / PERCENT }),
    },
    {
      key: 'rotation',
      label: '회전',
      min: -STICKER_LIMITS.maxRotation,
      max: STICKER_LIMITS.maxRotation,
      value: sticker.rotation,
      unit: '°',
      apply: (v: number) => update({ rotation: v }),
    },
    { key: 'x', label: '좌우', min: 0, max: PERCENT, value: sticker.x * PERCENT, unit: '', apply: (v: number) => update({ x: v / PERCENT }) },
    { key: 'y', label: '위아래', min: 0, max: PERCENT, value: sticker.y * PERCENT, unit: '', apply: (v: number) => update({ y: v / PERCENT }) },
  ]

  return (
    <div className="selected-sticker" aria-label={`선택한 스티커: ${label}`} role="group">
      <div className="selected-sticker-head">
        <img src={stickerAssetUrl(sticker.kind)} alt="" draggable={false} />
        <span>
          선택한 스티커 · <b>{label}</b>
        </span>
      </div>
      {sliders.map((s) => {
        const id = `${idPrefix}-${s.key}`
        const value = Math.round(s.value)
        return (
          <div key={s.key} className="slider-row">
            <label htmlFor={id}>{s.label}</label>
            <input
              id={id}
              type="range"
              min={s.min}
              max={s.max}
              step={1}
              value={value}
              aria-valuetext={`${value}${s.unit}`}
              onChange={(e) => {
                const v = Number(e.currentTarget.value)
                if (Number.isFinite(v)) s.apply(v)
              }}
            />
            <output htmlFor={id} className="slider-value">
              {value}
              {s.unit}
            </output>
          </div>
        )
      })}
      <div className="selected-sticker-actions">
        <button type="button" className="retro-button retro-button-small" onClick={() => dispatch({ type: 'bringStickerToFront', id: sticker.id })}>
          맨 앞으로
        </button>
        <button
          type="button"
          className="retro-button retro-button-small retro-button-danger"
          onClick={() => {
            dispatch({ type: 'removeSticker', id: sticker.id })
            onDeselect()
          }}
        >
          떼어내기
        </button>
        <button type="button" className="retro-button retro-button-small" onClick={onDeselect}>
          선택 해제
        </button>
      </div>
    </div>
  )
}
