export const PANEL_PATH = 'src/sidepanel.html'

export const PERMISSIONS: string[] = [
  'sidePanel',
  'offscreen',
  'storage',
  'tabs',
  'scripting',
  'activeTab',
  'webRequest',
  'webNavigation',
  'identity',
  'alarms',
  'contextMenus',
]

export const HOST_PERMISSIONS: string[] = ['<all_urls>']

export const CONTENT_SCRIPTS = [
  { matches: ['<all_urls>'], js: ['src/content/index.ts'], run_at: 'document_idle' },
]

export const WEB_ACCESSIBLE = [
  { resources: ['src/offscreen.html', 'src/report.html', 'src/settings.html', 'src/sidepanel.html', 'dev-reload.json'], matches: ['<all_urls>'] },
]

export const COMMANDS = {
  'open-sidepanel': {
    suggested_key: { default: 'Ctrl+Shift+L' },
    description: 'Open Live Test side panel',
  },
}
