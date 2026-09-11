import { installOpenPanelMenu, OPEN_PANEL_MENU_ID } from './contextMenu'
import { enableAndOpenSidePanel } from './panel'

import { logSystem } from '@/shared/logs'

const activeTabId = async (): Promise<number|null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id ?? null
}

const reportMenuInstallFailure = (reason: string, err: unknown): void => {
  console.error('[commands] context menu install failed', err)
  logSystem(`contextmenu:install-failed reason=${reason} error=${err instanceof Error ? err.message : String(err)}`)
    .catch((logErr) => console.error('[commands] system log failed', logErr))
}

export const registerCommandAndMenu = () => {
  chrome.commands.onCommand.addListener(async (cmd) => {
    if (cmd === 'open-sidepanel') {
      const id = await activeTabId(); if (id) enableAndOpenSidePanel(id, 'src/sidepanel.html')
    }
  })
  chrome.runtime.onInstalled.addListener((details) => {
    installOpenPanelMenu(details.reason).catch((err: unknown) => reportMenuInstallFailure(details.reason, err))
  })
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === OPEN_PANEL_MENU_ID) {
      const id = tab?.id ?? (await activeTabId()); if (id) enableAndOpenSidePanel(id, 'src/sidepanel.html')
    }
  })
}
