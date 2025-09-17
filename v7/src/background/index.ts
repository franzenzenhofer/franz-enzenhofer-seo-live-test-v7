import { registerNavListeners } from './listeners/nav'
import { registerRequestListeners } from './listeners/requests'
import { registerMessageListeners } from './listeners/messages'
import { seedDefaults } from './rules/index'

const panelPath = 'src/sidepanel.html'

chrome.runtime.onInstalled.addListener(() => { seedDefaults() })

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return
  await chrome.sidePanel.open({ tabId: tab.id })
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await chrome.sidePanel.setOptions({ tabId, path: panelPath, enabled: true })
})

chrome.tabs.onUpdated.addListener(async (tabId) => {
  await chrome.sidePanel.setOptions({ tabId, path: panelPath, enabled: true })
})

registerNavListeners()
registerRequestListeners()
registerMessageListeners()
