import { useMemo, useReducer, useState, type ReactNode } from 'react'
import './App.css'
import { AspectRatioSelector } from './components/AspectRatioSelector'
import { CardPreview } from './components/CardPreview'
import { ExportButtons } from './components/ExportButtons'
import { IndexTabs, type TabSpec } from './components/IndexTabs'
import { JsonBackup } from './components/JsonBackup'
import { PhotoAdjust, PhotoEffectSelector } from './components/PhotoControls'
import { PhotoUpload } from './components/PhotoUpload'
import { SelectedStickerControls, StickerPicker } from './components/StickerControls'
import { TemplatePanel } from './components/TemplatePanel'
import { TextControls } from './components/TextControls'
import { FrameSelector, SkinSelector } from './components/ThemeControls'
import { STICKER_LIMITS } from './editor/constants'
import { createDefaultEditorState } from './editor/defaults'
import { editorReducer } from './editor/reducer'
import type { EditorState, StickerKind } from './editor/types'
import { useCardFonts } from './hooks/useCardFonts'
import { useLoadedPhoto } from './hooks/useLoadedPhoto'
import { useStickerImages } from './hooks/useStickerImages'

type TabId = 'photo' | 'text' | 'deco' | 'template'

const TABS: readonly TabSpec<TabId>[] = [
  { id: 'photo', label: '사진' },
  { id: 'text', label: '문구' },
  { id: 'deco', label: '꾸미기' },
  { id: 'template', label: '템플릿' },
]

const TAB_PREFIX = 'editor'
const STICKER_SPREAD = 5
const STICKER_SPREAD_OFFSET = 0.04
let stickerSeq = 0
const newStickerId = () => `s${Date.now().toString(36)}${(stickerSeq++).toString(36)}`

function Section({ id, title, action, children }: { id: string; title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="control-section" aria-labelledby={id}>
      <div className="control-section-header">
        <h3 id={id} className="control-section-title">
          ■ {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function TabPanel({ id, active, children }: { id: TabId; active: TabId; children: ReactNode }) {
  // 탭을 바꿔도 입력 중인 상태(업로드 안내, 템플릿 목록 등)가 사라지지 않도록 숨기기만 한다
  return (
    <div
      role="tabpanel"
      id={`${TAB_PREFIX}-panel-${id}`}
      aria-labelledby={`${TAB_PREFIX}-tab-${id}`}
      hidden={id !== active}
      className="tab-panel"
      tabIndex={0}
    >
      {children}
    </div>
  )
}

function App() {
  const [state, dispatch] = useReducer(editorReducer, undefined, createDefaultEditorState)
  const photo = useLoadedPhoto(state.photo.source)
  const stickerImages = useStickerImages(state.stickers)
  const { status: fonts, version: fontsVersion } = useCardFonts(state)
  // fontsVersion이 바뀌면(새 글자 조각 도착) 미리보기를 다시 그린다
  const assets = useMemo(
    () => ({ photo, stickers: stickerImages, fonts, fontsVersion }),
    [photo, stickerImages, fonts, fontsVersion],
  )
  const [tab, setTab] = useState<TabId>('photo')
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const selectedSticker = state.stickers.find((s) => s.id === selectedStickerId) ?? null

  function addSticker(kind: StickerKind) {
    const id = newStickerId()
    // 연달아 붙여도 완전히 겹치지 않도록 조금씩 비껴 놓는다
    const step = (state.stickers.length % STICKER_SPREAD) * STICKER_SPREAD_OFFSET
    dispatch({ type: 'addSticker', id, kind, x: 0.5 + step, y: 0.5 + step })
    setSelectedStickerId(id)
  }

  function replaceState(next: EditorState) {
    setSelectedStickerId(null)
    dispatch({ type: 'replaceState', state: next })
  }

  return (
    <div className="page">
      <div className="binder">
        <p className="binder-top" aria-hidden="true">
          TODAY <b>{state.counter.today}</b> | TOTAL {state.counter.total}
        </p>

        <div className="binder-body">
          <section className="binder-page page-preview" aria-labelledby="app-title">
            <header className="preview-header">
              <h1 id="app-title" className="app-title">
                그땐 그랬지,,
              </h1>
              {state.text.bgm.trim() !== '' && (
                <p className="bgm-box">
                  <span className="bgm-note" aria-hidden="true">
                    ♬
                  </span>
                  <span className="bgm-label">BGM</span>
                  <span className="bgm-title">{state.text.bgm}</span>
                  <span className="bgm-controls" aria-hidden="true">
                    ▶ ∥ ■
                  </span>
                </p>
              )}
            </header>
            <div className="preview-stage">
              <CardPreview
                state={state}
                assets={assets}
                selectedStickerId={selectedSticker?.id ?? null}
                onSelectSticker={setSelectedStickerId}
                onMoveSticker={(id, x, y) => dispatch({ type: 'updateSticker', id, patch: { x, y } })}
              />
            </div>
            {selectedSticker && tab !== 'deco' && (
              <p className="control-hint sticker-hint">
                스티커를 골랐어요.{' '}
                <button type="button" className="text-button" onClick={() => setTab('deco')}>
                  크기·회전 조절하기
                </button>
              </p>
            )}
            <ExportButtons state={state} />
            {fonts === 'failed' && (
              <p role="status" className="control-hint font-warning">
                ※ 픽셀 글꼴을 불러오지 못해 기본 글꼴로 보여요. 새로고침하면 다시 시도해요.
              </p>
            )}
          </section>

          <div className="binder-rings" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <IndexTabs tabs={TABS} active={tab} onChange={setTab} idPrefix={TAB_PREFIX} label="편집 메뉴" />

          <section className="binder-page page-controls" aria-label="편집 도구">
            <TabPanel id="photo" active={tab}>
              <Section id="upload-heading" title="사진 올리기">
                <PhotoUpload source={state.photo.source} onUpload={(source) => dispatch({ type: 'setPhoto', source })} />
              </Section>
              <Section id="ratio-heading" title="화면비">
                <AspectRatioSelector
                  value={state.aspectRatio}
                  onChange={(aspectRatio) => dispatch({ type: 'setAspectRatio', aspectRatio })}
                />
              </Section>
              <Section
                id="adjust-heading"
                title="사진 조절"
                action={
                  <button
                    type="button"
                    className="retro-button retro-button-small"
                    disabled={state.photo.source === null}
                    onClick={() => dispatch({ type: 'resetPhotoTransform' })}
                  >
                    초기화
                  </button>
                }
              >
                <PhotoAdjust photo={state.photo} dispatch={dispatch} />
              </Section>
              <Section id="effect-heading" title="사진 효과">
                <PhotoEffectSelector photo={state.photo} date={state.text.date} dispatch={dispatch} />
              </Section>
            </TabPanel>

            <TabPanel id="text" active={tab}>
              <Section id="text-heading" title="문구 쓰기">
                <TextControls state={state} dispatch={dispatch} />
              </Section>
            </TabPanel>

            <TabPanel id="deco" active={tab}>
              <Section id="frame-heading" title="틀 고르기">
                <FrameSelector theme={state.theme} dispatch={dispatch} />
              </Section>
              <Section id="skin-heading" title="스킨">
                <SkinSelector theme={state.theme} dispatch={dispatch} />
              </Section>
              <Section
                id="sticker-heading"
                title={
                  <>
                    도트 스티커{' '}
                    <span className="control-hint">
                      ({state.stickers.length}/{STICKER_LIMITS.maxCount})
                    </span>
                  </>
                }
              >
                {selectedSticker && (
                  <SelectedStickerControls
                    sticker={selectedSticker}
                    dispatch={dispatch}
                    onDeselect={() => setSelectedStickerId(null)}
                  />
                )}
                <StickerPicker onAdd={addSticker} disabled={state.stickers.length >= STICKER_LIMITS.maxCount} />
                <p className="control-hint">미리보기에서 스티커를 끌어서 옮길 수 있어요 ^^</p>
              </Section>
            </TabPanel>

            <TabPanel id="template" active={tab}>
              <Section id="template-heading" title="내 템플릿">
                <TemplatePanel state={state} onLoad={replaceState} />
              </Section>
              <Section id="json-heading" title="파일로 백업">
                <JsonBackup state={state} onImport={replaceState} />
              </Section>
            </TabPanel>
          </section>
        </div>
      </div>

      <footer className="page-footer">
        <small>2000년대 개인 홈페이지 문화에서 영감을 받은 독립 프로젝트 · 글꼴 Galmuri (OFL)</small>
      </footer>
    </div>
  )
}

export default App
