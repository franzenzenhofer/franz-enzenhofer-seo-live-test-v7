import { createRoot } from 'react-dom/client'

import { SettingsApp } from './SettingsApp'

import { installCrashNet } from '@/shared/crashNet'

installCrashNet('settings')

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(<SettingsApp />)
