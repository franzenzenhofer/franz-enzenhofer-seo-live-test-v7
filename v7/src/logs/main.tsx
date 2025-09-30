import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'

import { LogsApp } from './LogsApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <LogsApp />
  </StrictMode>
)