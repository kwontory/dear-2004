import { useId } from 'react'
import { TEXT_MAX_LENGTHS } from '../editor/constants'
import { fromSliderValue, PHOTO_SLIDERS, toSliderValue } from '../editor/photoControls'
import type { EditorState, PhotoEffect } from '../editor/types'
import type { EditorAction } from '../editor/reducer'
import { formatStampText } from '../render/dateStamp'

interface PhotoControlsProps {
  photo: EditorState['photo']
  date: string
  dispatch: (action: EditorAction) => void
}

const EFFECT_OPTIONS: { value: PhotoEffect; label: string }[] = [
  { value: 'original', label: '원본' },
  { value: 'soft', label: '뽀샤시' },
  { value: 'faded', label: '빛바램' },
  { value: 'mono', label: '흑백' },
]

export function PhotoAdjust({ photo, dispatch }: Omit<PhotoControlsProps, 'date'>) {
  const idPrefix = useId()
  const disabled = photo.source === null

  return (
    <div className="photo-adjust">
      {PHOTO_SLIDERS.map((spec) => {
        const id = `${idPrefix}-${spec.key}`
        const value = toSliderValue(spec.key, photo.transform)
        return (
          <div key={spec.key} className="slider-row">
            <label htmlFor={id}>{spec.label}</label>
            <input
              id={id}
              type="range"
              min={spec.min}
              max={spec.max}
              step={1}
              value={value}
              disabled={disabled}
              aria-valuetext={`${value}${spec.unit}`}
              onChange={(e) => {
                const patch = fromSliderValue(spec.key, e.currentTarget.value)
                if (patch) dispatch({ type: 'updatePhotoTransform', patch })
              }}
            />
            <output htmlFor={id} className="slider-value">
              {value}
              {spec.unit}
            </output>
          </div>
        )
      })}
      {disabled && <p className="control-hint">사진을 올리면 조절할 수 있어요.</p>}
    </div>
  )
}

export function PhotoEffectSelector({ photo, date, dispatch }: PhotoControlsProps) {
  const dateId = useId()
  const hintId = useId()
  const stampText = formatStampText(date)

  return (
    <div className="photo-effects">
      <fieldset className="choice-group" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <legend className="visually-hidden">사진 효과</legend>
        {EFFECT_OPTIONS.map((option) => (
          <label key={option.value} className="choice">
            <input
              type="radio"
              name="photo-effect"
              className="visually-hidden"
              value={option.value}
              checked={photo.effect === option.value}
              onChange={() => dispatch({ type: 'setPhotoEffect', effect: option.value })}
            />
            <span className="choice-face">{option.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={photo.showDateStamp}
          onChange={(e) => dispatch({ type: 'setDateStamp', visible: e.currentTarget.checked })}
        />
        디카 날짜 찍기
      </label>
      <div className="stamp-date">
        <label htmlFor={dateId}>찍을 날짜</label>
        <input
          id={dateId}
          type="text"
          inputMode="numeric"
          placeholder="2004.10.27"
          maxLength={TEXT_MAX_LENGTHS.date}
          value={date}
          aria-describedby={hintId}
          onChange={(e) => dispatch({ type: 'setText', field: 'date', value: e.currentTarget.value })}
        />
        <span id={hintId} className="control-hint">
          {date.trim() === ''
            ? '날짜를 입력하면 사진에 찍혀요.'
            : stampText
              ? `사진에 '${stampText}' 로 찍혀요.`
              : '날짜 형식을 알아볼 수 없어요. 예: 2004.10.27'}
        </span>
      </div>
    </div>
  )
}
