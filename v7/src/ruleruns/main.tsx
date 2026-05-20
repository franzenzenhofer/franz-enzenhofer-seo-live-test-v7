import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'

import { RunHistoryApp } from './RunHistoryApp'
import './index.css'

import { installCrashNet } from '@/shared/crashNet'

installCrashNet('ruleruns')

ReactDOM.createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <RunHistoryApp />
  </StrictMode>,
)
