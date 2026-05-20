import { registerNavListeners } from './listeners/nav'
import { registerRequestListeners } from './listeners/requests'
import { registerMessageListeners } from './listeners/messages'
import { registerHistoryListeners } from './history/listeners'
import { seedDefaults } from './rules/index'
import { enableAndOpenSidePanel } from './panel'
import { registerCommandAndMenu } from './commands'
import { initDevAutoReload } from './devReload'
import { abortSession } from './rules/sessions'

import { refreshIfPresent } from '@/shared/auth'
import { rememberHttpTab } from '@/shared/tabMemory'
import { Logger } from '@/shared/logger'
import { installCrashNet } from '@/shared/crashNet'
import { incr, startTelemetryFlush } from '@/shared/telemetry'

Logger.setContext('background')
installCrashNet('background')
incr('sw.wakeups')
startTelemetryFlush()

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

chrome.tabs.onRemoved.addListener((tabId) => {
  abortSession(tabId, 'tab-closed').catch(() => {})
  chrome.storage.session.remove(`nav:ledger:${tabId}`).catch(() => {})
})

registerNavListeners()
registerRequestListeners()
registerMessageListeners()
registerHistoryListeners()
registerCommandAndMenu()
initDevAutoReload()

// Try to reuse legacy Google token silently on startup
refreshIfPresent().catch(() => {})
// installCrashNet('background') above replaces the inline error/unhandledrejection handlers.
