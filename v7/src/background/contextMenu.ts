import { EXTENSION_NAME } from '../../config.js'

import { logSystem } from '@/shared/logs'

export const OPEN_PANEL_MENU_ID = 'open_panel'

// contextMenus.create/removeAll are callback-style at minimum_chrome_version 116.
// The callback MUST read runtime.lastError, otherwise Chrome reports
// "Unchecked runtime.lastError" in chrome://extensions > Errors.
// https://developer.chrome.com/docs/extensions/reference/api/runtime#property-lastError
const settle = (label: string, resolve: () => void, reject: (err: Error) => void) => () => {
  const err = chrome.runtime.lastError
  if (err) reject(new Error(`${label}: ${err.message}`))
  else resolve()
}

const removeAllMenus = () =>
  new Promise<void>((resolve, reject) => {
    chrome.contextMenus.removeAll(settle('contextMenus.removeAll', resolve, reject))
  })

const createOpenPanelItem = () =>
  new Promise<void>((resolve, reject) => {
    chrome.contextMenus.create(
      { id: OPEN_PANEL_MENU_ID, title: `Open ${EXTENSION_NAME}`, contexts: ['action', 'page'] },
      settle('contextMenus.create', resolve, reject),
    )
  })

const install = async (reason: string): Promise<void> => {
  await removeAllMenus()
  await createOpenPanelItem()
  await logSystem(`contextmenu:installed id=${OPEN_PANEL_MENU_ID} reason=${reason}`)
}

let inFlight: Promise<void> | null = null

/**
 * Idempotent menu registration. Chrome persists a service-worker extension's
 * menu items and restores them on every extension load, while
 * runtime.onInstalled fires again on every update and on every unpacked reload
 * ("treated as an update"). A bare create() therefore fails with
 * "Cannot create item with duplicate id open_panel". removeAll first, then
 * create; concurrent callers share one in-flight installation.
 * https://developer.chrome.com/docs/extensions/reference/api/contextMenus
 * https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onInstalled
 */
export const installOpenPanelMenu = (reason: string): Promise<void> => {
  if (!inFlight) {
    inFlight = install(reason).finally(() => {
      inFlight = null
    })
  }
  return inFlight
}
