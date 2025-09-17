import { pushEvent, markDomPhase } from '../pipeline/collector'

export const registerMessageListeners = () => {
  chrome.runtime.onMessage.addListener((msg, sender, send) => {
    const tabId = sender.tab?.id
    if (!tabId) return
    if (msg?.event) {
      pushEvent(tabId, { t: `dom:${msg.event}`, d: msg.data })
      if (msg.event === 'document_idle') markDomPhase(tabId)
    }
    if (msg === 'tabIdPls') send({ tabId, url: sender.tab?.url })
  })
}

