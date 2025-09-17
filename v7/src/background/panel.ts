import { log } from '@/shared/logs'

// Open the side panel defensively. Never throw.
export const enableAndOpenSidePanel = (tabId: number, path = 'src/sidepanel.html') => {
  // Enable and set path, but swallow any errors.
  chrome.sidePanel
    .setOptions({ tabId, path, enabled: true })
    .catch(() => {})
  // Try to open; if Chrome rejects due to missing user gesture,
  // degrade by setting an action badge instead of throwing.
  chrome.sidePanel
    .open({ tabId })
    .catch(async () => {
      try {
        await chrome.action.setBadgeText({ tabId, text: 'Open' })
        await chrome.action.setBadgeBackgroundColor({ tabId, color: '#1b73e8' })
        await chrome.action.setTitle({ tabId, title: 'Click to open Live Test' })
      } catch {
        // ignore
      }
    })
  // Proactively inject declared content scripts for best UX.
  try {
    const m = chrome.runtime.getManifest()
    const files = (m.content_scripts || []).flatMap((cs) => cs.js || [])
    if (files.length) {
      log(tabId, `inject:start ${JSON.stringify(files)}`).catch(() => {})
      chrome.scripting.executeScript({ target: { tabId }, files }).then(() => log(tabId, 'inject:done')).catch(() => log(tabId, 'inject:fail'))
    }
  } catch {
    // ignore
  }
}
