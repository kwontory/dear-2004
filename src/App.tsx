import { useReducer } from 'react'
import './App.css'
import { CardPreview } from './components/CardPreview'
import { PhotoUpload } from './components/PhotoUpload'
import { createDefaultEditorState } from './editor/defaults'
import { editorReducer } from './editor/reducer'
import { useLoadedPhoto } from './hooks/useLoadedPhoto'

function App() {
  const [state, dispatch] = useReducer(editorReducer, undefined, createDefaultEditorState)
  const photo = useLoadedPhoto(state.photo.source)

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
        </section>

        <section className="panel panel-preview" aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="panel-title">미리보기</h2>
          <CardPreview state={state} photo={photo} />
        </section>
      </main>

      <footer className="app-footer">
        <small>2000년대 개인 홈페이지 문화에서 영감을 받은 독립 프로젝트</small>
      </footer>
    </div>
  )
}

export default App
