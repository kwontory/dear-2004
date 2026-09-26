import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerFontFaces } from './render/fonts'

// 첫 화면부터 픽셀 폰트를 쓰도록 렌더링 전에 등록한다 (필요한 조각만 내려받는다)
registerFontFaces()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
