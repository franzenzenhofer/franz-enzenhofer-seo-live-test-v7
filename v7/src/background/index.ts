import { registerNavListeners } from './listeners/nav'
import { registerRequestListeners } from './listeners/requests'
import { registerMessageListeners } from './listeners/messages'
import { seedDefaults } from './rules/index'
import { enableAndOpenSidePanel } from './panel'
import { registerCommandAndMenu } from './commands'
import { initDevAutoReload } from './devReload'

import { refreshIfPresent } from '@/shared/auth'
import { rememberHttpTab } from '@/shared/tabMemory'
import { Logger } from '@/shared/logger'

Logger.setContext('background')

const panelPath = 'src/sidepanel.html'

chrome.runtime.onInstalled.addListener(() => { seedDefaults() })

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return
  // Do not await; panel.open requires a user gesture. All errors are caught internally.
  enableAndOpenSidePanel(tab.id, panelPath)
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    await chrome.sidePanel.setOptions({ tabId, path: panelPath, enabled: true })
  } catch {
    // ignore
  }
  rememberHttpTab(tabId).catch(() => {})
})

chrome.tabs.onUpdated.addListener(async (tabId) => {
  try {
    await chrome.sidePanel.setOptions({ tabId, path: panelPath, enabled: true })
  } catch {
    // ignore
  }
  rememberHttpTab(tabId).catch(() => {})
})

registerNavListeners()
registerRequestListeners()
registerMessageListeners()
registerCommandAndMenu()
initDevAutoReload()

// Try to reuse legacy Google token silently on startup
refreshIfPresent().catch(() => {})

// Guard against unhandled errors in the service worker.
// These prevent noisy "Uncaught (in promise)" logs.
addEventListener('unhandledrejection', (e) => {
  console.warn('[bg] unhandledrejection', e.reason)
  e.preventDefault?.()
})
addEventListener('error', (e: ErrorEvent) => {
  console.warn('[bg] error', e?.error || e?.message)
  e.preventDefault?.()
})
