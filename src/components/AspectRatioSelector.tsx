import { ASPECT_RATIOS, CANVAS_SIZES } from '../editor/constants'
import type { AspectRatio } from '../editor/types'

interface AspectRatioSelectorProps {
  value: AspectRatio
  onChange: (value: AspectRatio) => void
}

const RATIO_HINTS: Record<AspectRatio, string> = {
  '1:1': '정사각형',
  '4:5': '피드',
  '9:16': '스토리',
}

/** 아이콘 높이(px). 너비는 실제 비율로 계산한다 */
const ICON_HEIGHT = 20

export function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  return (
    <fieldset className="choice-group" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
      <legend className="visually-hidden">화면비</legend>
      {ASPECT_RATIOS.map((ratio) => {
        const { width, height } = CANVAS_SIZES[ratio]
        return (
          <label key={ratio} className="choice">
            <input
              type="radio"
              name="aspect-ratio"
              className="visually-hidden"
              value={ratio}
              checked={value === ratio}
              onChange={() => onChange(ratio)}
            />
            <span className="choice-face">
              <span
                aria-hidden="true"
                className="ratio-icon"
                style={{ width: Math.round((ICON_HEIGHT * width) / height), height: ICON_HEIGHT }}
              />
              <span>{ratio}</span>
              <span className="choice-hint">{RATIO_HINTS[ratio]}</span>
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
