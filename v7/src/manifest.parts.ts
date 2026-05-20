export const PANEL_PATH = 'src/sidepanel.html'

// Each entry below is required by an explicitly-named feature. Chrome Web Store
// review expects justification per permission. Drop a permission only after
// removing every callsite that uses it.
export const PERMISSIONS: string[] = [
  'sidePanel',        // Side-panel UI (chrome.sidePanel)
  'offscreen',        // Sandboxed rule execution document (chrome.offscreen)
  'storage',          // chrome.storage.local + .session for results + run state
  'unlimitedStorage', // Run history grows large; bounded retention still below quota
  'tabs',             // tabs.onActivated/onUpdated/onRemoved for per-tab session state
  'scripting',        // chrome.scripting.executeScript for getPageInfo + highlight
  'webRequest',       // Non-blocking observation of redirects/headers in history listener
  'webNavigation',    // onCommitted + onHistoryStateUpdated for navigation ledger
  'identity',         // OAuth flow for Google Search Console + Analytics
  'alarms',           // chrome.alarms replaces every long timer in the SW
  'contextMenus',     // background/commands.ts creates "Open Live Test" entry
]

export const HOST_PERMISSIONS: string[] = ['<all_urls>']

export const CONTENT_SCRIPTS = [
  { matches: ['<all_urls>'], js: ['src/content/index.ts'], run_at: 'document_idle' },
]

export const WEB_ACCESSIBLE = [
  { resources: ['src/offscreen.html', 'src/report.html', 'src/settings.html', 'src/ruleruns.html', 'dev-reload.json'], matches: ['<all_urls>'] },
]

export const COMMANDS = {
  'open-sidepanel': {
    suggested_key: { default: 'Ctrl+Shift+L' },
    description: 'Open Live Test side panel',
  },
}
