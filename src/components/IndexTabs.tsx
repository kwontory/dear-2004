import { useRef, type KeyboardEvent } from 'react'

export interface TabSpec<T extends string> {
  id: T
  label: string
}

interface IndexTabsProps<T extends string> {
  tabs: readonly TabSpec<T>[]
  active: T
  onChange: (id: T) => void
  idPrefix: string
  label: string
}

/**
 * 바인더 오른쪽의 인덱스 탭. WAI-ARIA tabs 패턴:
 * 화살표·Home·End로 이동하면서 바로 선택한다 (자동 활성화).
 */
export function IndexTabs<T extends string>({ tabs, active, onChange, idPrefix, label }: IndexTabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1
    const next =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className="index-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            ref={(el) => void (refs.current[index] = el)}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`index-tab${selected ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
