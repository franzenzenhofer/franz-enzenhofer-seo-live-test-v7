import { enableAndOpenSidePanel } from './panel'

const activeTabId = async (): Promise<number|null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id ?? null
}

export const registerCommandAndMenu = () => {
  chrome.commands.onCommand.addListener(async (cmd) => {
    if (cmd === 'open-sidepanel') {
      const id = await activeTabId(); if (id) enableAndOpenSidePanel(id, 'src/sidepanel.html')
    }
  })
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({ id: 'open_panel', title: 'Open Live Test', contexts: ['action','page'] })
  })
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'open_panel') {
      const id = tab?.id ?? (await activeTabId()); if (id) enableAndOpenSidePanel(id, 'src/sidepanel.html')
    }
  })
}
