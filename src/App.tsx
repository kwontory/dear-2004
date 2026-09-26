import { useMemo, useReducer } from 'react'
import './App.css'
import { AspectRatioSelector } from './components/AspectRatioSelector'
import { CardPreview } from './components/CardPreview'
import { ExportButtons } from './components/ExportButtons'
import { PhotoAdjust, PhotoEffectSelector } from './components/PhotoControls'
import { PhotoUpload } from './components/PhotoUpload'
import { TextControls } from './components/TextControls'
import { createDefaultEditorState } from './editor/defaults'
import { editorReducer } from './editor/reducer'
import { useCardFonts } from './hooks/useCardFonts'
import { useLoadedPhoto } from './hooks/useLoadedPhoto'
import { useStickerImages } from './hooks/useStickerImages'

function App() {
  const [state, dispatch] = useReducer(editorReducer, undefined, createDefaultEditorState)
  const photo = useLoadedPhoto(state.photo.source)
  const stickerImages = useStickerImages(state.stickers)
  const fonts = useCardFonts()
  const assets = useMemo(() => ({ photo, stickers: stickerImages, fonts }), [photo, stickerImages, fonts])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">그땐 그랬지,,</h1>
        <p className="app-subtitle">나만의 미니홈피 감성 카드 만들기</p>
      </header>

      <main className="app-main">
        <section className="panel panel-controls" aria-labelledby="controls-heading">
          <h2 id="controls-heading" className="panel-title">꾸미기</h2>

          <section className="control-section" aria-labelledby="upload-heading">
            <h3 id="upload-heading" className="control-section-title">■ 사진 올리기</h3>
            <PhotoUpload
              source={state.photo.source}
              onUpload={(source) => dispatch({ type: 'setPhoto', source })}
            />
          </section>

          <section className="control-section" aria-labelledby="ratio-heading">
            <h3 id="ratio-heading" className="control-section-title">■ 화면비</h3>
            <AspectRatioSelector
              value={state.aspectRatio}
              onChange={(aspectRatio) => dispatch({ type: 'setAspectRatio', aspectRatio })}
            />
          </section>

          <section className="control-section" aria-labelledby="adjust-heading">
            <div className="control-section-header">
              <h3 id="adjust-heading" className="control-section-title">■ 사진 조절</h3>
              <button
                type="button"
                className="retro-button retro-button-small"
                disabled={state.photo.source === null}
                onClick={() => dispatch({ type: 'resetPhotoTransform' })}
              >
                초기화
              </button>
            </div>
            <PhotoAdjust photo={state.photo} dispatch={dispatch} />
          </section>

          <section className="control-section" aria-labelledby="effect-heading">
            <h3 id="effect-heading" className="control-section-title">■ 사진 효과</h3>
            <PhotoEffectSelector photo={state.photo} date={state.text.date} dispatch={dispatch} />
          </section>

          <section className="control-section" aria-labelledby="text-heading">
            <h3 id="text-heading" className="control-section-title">■ 문구 쓰기</h3>
            <TextControls state={state} dispatch={dispatch} />
          </section>
        </section>

        <section className="panel panel-preview" aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="panel-title">미리보기</h2>
          <CardPreview state={state} assets={assets} />
          <ExportButtons state={state} />
          {fonts === 'failed' && (
            <p role="status" className="control-hint font-warning">
              ※ 픽셀 글꼴을 불러오지 못해 기본 글꼴로 보여요. 새로고침하면 다시 시도해요.
            </p>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <small>2000년대 개인 홈페이지 문화에서 영감을 받은 독립 프로젝트</small>
      </footer>
    </div>
  )
}

export default App
