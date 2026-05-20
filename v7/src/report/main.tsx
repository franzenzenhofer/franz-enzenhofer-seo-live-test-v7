import { createRoot } from 'react-dom/client'

import { ReportApp } from './ReportApp'

import { installCrashNet } from '@/shared/crashNet'

installCrashNet('report')

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(<ReportApp />)
