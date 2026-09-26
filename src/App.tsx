import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">그땐 그랬지...</h1>
        <p className="app-subtitle">나만의 미니홈피 감성 카드 만들기</p>
      </header>

      <main className="app-main">
        <section className="panel panel-controls" aria-labelledby="controls-heading">
          <h2 id="controls-heading" className="panel-title">꾸미기</h2>
          <p className="panel-placeholder">편집 도구가 여기에 들어갑니다.</p>
        </section>

        <section className="panel panel-preview" aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="panel-title">미리보기</h2>
          <p className="panel-placeholder">카드 미리보기가 여기에 표시됩니다.</p>
        </section>
      </main>

      <footer className="app-footer">
        <small>2000년대 개인 홈페이지 문화에서 영감을 받은 독립 프로젝트</small>
      </footer>
    </div>
  )
}

export default App
