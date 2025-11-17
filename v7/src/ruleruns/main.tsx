import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'

import { RunHistoryApp } from './RunHistoryApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <RunHistoryApp />
  </StrictMode>,
)
