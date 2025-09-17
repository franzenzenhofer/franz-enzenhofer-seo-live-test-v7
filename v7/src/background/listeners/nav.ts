import { pushEvent } from '../pipeline/collector'

export const registerNavListeners = () => {
  chrome.webNavigation.onBeforeNavigate.addListener((e) => {
    if (e.frameId === 0) pushEvent(e.tabId, { t: 'nav:before', u: e.url })
  })
  chrome.webNavigation.onCommitted.addListener((e) => {
    if (e.frameId === 0) pushEvent(e.tabId, { t: 'nav:commit', u: e.url })
  })
  chrome.webNavigation.onHistoryStateUpdated.addListener((e) => {
    if (e.frameId === 0) pushEvent(e.tabId, { t: 'nav:history', u: e.url })
  })
}
